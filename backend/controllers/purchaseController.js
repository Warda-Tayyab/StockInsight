const mongoose = require('mongoose');
const Vendor = require('../models/tenant/Vendor');
const PurchaseOrder = require('../models/tenant/PurchaseOrder');
const GoodsReceipt = require('../models/tenant/GoodsReceipt');
const Bill = require('../models/tenant/Bill');
const PurchaseReturn = require('../models/tenant/PurchaseReturn');
const Product = require('../models/tenant/Product');
const Warehouse = require('../models/tenant/Warehouse');
const Batch = require('../models/tenant/Batch');
const Stock = require('../models/tenant/Stock');
const Inventory = require('../models/tenant/Inventory');
const WriteOff = require('../models/tenant/WriteOff');
const generateDocumentNumber = require('../utils/generateDocumentNumber');
const { receiveStockLine } = require('../utils/stockMovementService');
const { resolvePurchaseLineProduct } = require('../utils/purchaseProductHelper');
const getInventoryActivity = require('../utils/inventoryActivityHelper');
const sendAlerts = require('../utils/alertEngine');
const INVENTORY_TYPES = require('../constants/inventoryTypes');

const buildPoLine = async ({ tenantId, row, vendor }) => {
  const quantity = Number(row.quantity);
  if (!quantity || quantity <= 0) {
    throw new Error(`Invalid quantity for ${row.productName || row.productId || 'item'}`);
  }

  const product = await resolvePurchaseLineProduct({ tenantId, row, vendor });

  return {
    productId: product._id,
    productName: product.name,
    sku: product.sku,
    unit: row.unit || product.unit || 'pcs',
    quantity,
    unitCost: Number(row.unitCost ?? product.costPrice ?? 0),
    receivedQty: 0,
  };
};

const calcLineSubtotal = (items = []) =>
  items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitCost || 0), 0);

const refreshPoStatus = (po) => {
  const allReceived = po.items.every((i) => Number(i.receivedQty || 0) >= Number(i.quantity || 0));
  const anyReceived = po.items.some((i) => Number(i.receivedQty || 0) > 0);
  if (allReceived) po.status = 'received';
  else if (anyReceived) po.status = 'partial';
  else if (po.status !== 'draft' && po.status !== 'cancelled') po.status = 'ordered';
};

const resolveLocation = async (tenantId, locationId) => {
  const location = await Warehouse.findOne({
    _id: locationId,
    tenantId,
    isDeleted: { $ne: true },
  });
  if (!location) throw new Error('Location not found');
  return location;
};

/* =========================
   VENDORS
========================= */

exports.listVendors = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { status, search } = req.query;
    const filter = { tenantId };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const vendors = await Vendor.find(filter).sort({ name: 1 });
    res.json({ success: true, data: vendors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ _id: req.params.id, tenantId: req.auth.tenantId });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json({ success: true, data: vendor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createVendor = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Vendor name is required' });

    let code = String(req.body.code || '').trim().toUpperCase();
    if (!code) {
      code = await generateDocumentNumber(tenantId, 'vendor_code', 'VND');
    }

    const vendor = await Vendor.create({
      tenantId,
      name,
      code,
      contactPerson: req.body.contactPerson || '',
      phone: req.body.phone || '',
      email: req.body.email || '',
      address: req.body.address || '',
      city: req.body.city || '',
      notes: req.body.notes || '',
      status: req.body.status === 'inactive' ? 'inactive' : 'active',
    });

    res.status(201).json({ success: true, data: vendor });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Vendor code already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ _id: req.params.id, tenantId: req.auth.tenantId });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    const fields = ['name', 'contactPerson', 'phone', 'email', 'address', 'city', 'notes', 'status'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) vendor[f] = req.body[f];
    });
    if (req.body.code) vendor.code = String(req.body.code).trim().toUpperCase();

    await vendor.save();
    res.json({ success: true, data: vendor });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Vendor code already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   PURCHASE ORDERS
========================= */

exports.listPurchaseOrders = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { status, vendorId, search } = req.query;
    const filter = { tenantId };
    if (status) filter.status = status;
    if (vendorId) filter.vendorId = vendorId;
    if (search) filter.poNumber = { $regex: search, $options: 'i' };

    const orders = await PurchaseOrder.find(filter)
      .sort({ createdAt: -1 });

    await Promise.all([
      Vendor.populate(orders, { path: 'vendorId', select: 'name code phone' }),
      Warehouse.populate(orders, { path: 'locationId', select: 'name code locationType' }),
    ]);

    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne({
      _id: req.params.id,
      tenantId: req.auth.tenantId,
    })
      .populate('vendorId')
      .populate('locationId', 'name code locationType')
      .populate('items.productId', 'name sku unit costPrice sellingPrice');

    if (!order) return res.status(404).json({ message: 'Purchase order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createPurchaseOrder = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;
    const { vendorId, locationId, expectedDate, notes, items, status } = req.body;

    if (!vendorId) return res.status(400).json({ message: 'Vendor is required' });
    if (!locationId) return res.status(400).json({ message: 'Destination location is required' });
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    const vendor = await Vendor.findOne({ _id: vendorId, tenantId, status: 'active' });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    await resolveLocation(tenantId, locationId);

    const builtItems = [];
    for (const row of items) {
      builtItems.push(await buildPoLine({ tenantId, row, vendor }));
    }

    const poNumber = await generateDocumentNumber(tenantId, 'po', 'PO');
    const order = await PurchaseOrder.create({
      tenantId,
      poNumber,
      vendorId,
      locationId,
      expectedDate: expectedDate || null,
      notes: notes || '',
      items: builtItems,
      subtotal: calcLineSubtotal(builtItems),
      status: status === 'ordered' ? 'ordered' : 'draft',
      createdBy: userId,
    });

    const populated = await PurchaseOrder.findById(order._id)
      .populate('vendorId', 'name code')
      .populate('locationId', 'name code locationType')
      .populate('items.productId', 'name sku setupStatus status');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePurchaseOrder = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const order = await PurchaseOrder.findOne({ _id: req.params.id, tenantId });
    if (!order) return res.status(404).json({ message: 'Purchase order not found' });
    if (['received', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ message: `Cannot edit a ${order.status} purchase order` });
    }
    if (order.items.some((i) => Number(i.receivedQty || 0) > 0) && req.body.items) {
      return res.status(400).json({ message: 'Cannot change items after partial receive' });
    }

    if (req.body.vendorId) {
      const vendor = await Vendor.findOne({ _id: req.body.vendorId, tenantId });
      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
      order.vendorId = vendor._id;
    }
    if (req.body.locationId) {
      await resolveLocation(tenantId, req.body.locationId);
      order.locationId = req.body.locationId;
    }
    if (req.body.expectedDate !== undefined) order.expectedDate = req.body.expectedDate || null;
    if (req.body.notes !== undefined) order.notes = req.body.notes;
    if (req.body.status && ['draft', 'ordered', 'cancelled'].includes(req.body.status)) {
      if (req.body.status === 'cancelled' && order.items.some((i) => i.receivedQty > 0)) {
        return res.status(400).json({ message: 'Cannot cancel a partially received PO' });
      }
      order.status = req.body.status;
    }

    if (Array.isArray(req.body.items) && req.body.items.length) {
      const vendor = await Vendor.findById(order.vendorId);
      const builtItems = [];
      for (const row of req.body.items) {
        builtItems.push(await buildPoLine({ tenantId, row, vendor }));
      }
      order.items = builtItems;
      order.subtotal = calcLineSubtotal(builtItems);
    }

    await order.save();
    const populated = await PurchaseOrder.findById(order._id)
      .populate('vendorId', 'name code')
      .populate('locationId', 'name code locationType');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markPurchaseOrderOrdered = async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne({
      _id: req.params.id,
      tenantId: req.auth.tenantId,
    });
    if (!order) return res.status(404).json({ message: 'Purchase order not found' });
    if (order.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft POs can be marked ordered' });
    }
    order.status = 'ordered';
    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   GOODS RECEIVE (GRN)
========================= */

exports.listGoodsReceipts = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { status, vendorId, search, filter: dateFilter } = req.query;
    const filter = { tenantId };
    if (status) filter.status = status;
    if (vendorId) filter.vendorId = vendorId;
    if (search) filter.grnNumber = { $regex: search, $options: 'i' };

    if (dateFilter === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: startOfDay };
    }

    const receipts = await GoodsReceipt.find(filter)
      .populate('vendorId', 'name code phone address')
      .populate('locationId', 'name code locationType')
      .populate('purchaseOrderId', 'poNumber status')
      .populate('billId', 'billNumber status total')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: receipts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getGoodsReceipt = async (req, res) => {
  try {
    const receipt = await GoodsReceipt.findOne({
      _id: req.params.id,
      tenantId: req.auth.tenantId,
    })
      .populate('vendorId')
      .populate('locationId', 'name code locationType')
      .populate('purchaseOrderId', 'poNumber status items')
      .populate('billId', 'billNumber status total');

    if (!receipt) return res.status(404).json({ message: 'Goods receipt not found' });
    res.json({ success: true, data: receipt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Create + optionally post a goods receipt.
 * - With PO: validates remaining qty against PO lines
 * - Without PO (direct receive): small shops can receive straight into Store
 * - post: true → immediately increase stock
 */
exports.createGoodsReceipt = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;
    const io = req.app.get('io');
    const {
      vendorId,
      locationId,
      purchaseOrderId,
      receivedDate,
      notes,
      items,
      post = true,
      createBill = false,
    } = req.body;

    if (!vendorId) return res.status(400).json({ message: 'Vendor is required' });
    if (!locationId) return res.status(400).json({ message: 'Receive location is required' });
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    const vendor = await Vendor.findOne({ _id: vendorId, tenantId });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    await resolveLocation(tenantId, locationId);

    let po = null;
    if (purchaseOrderId) {
      po = await PurchaseOrder.findOne({ _id: purchaseOrderId, tenantId });
      if (!po) return res.status(404).json({ message: 'Purchase order not found' });
      if (['cancelled', 'draft'].includes(po.status)) {
        return res.status(400).json({ message: 'PO must be ordered before receiving' });
      }
      if (String(po.vendorId) !== String(vendorId)) {
        return res.status(400).json({ message: 'Vendor must match the purchase order' });
      }
    }

    const builtItems = [];
    for (const row of items) {
      const product = await resolvePurchaseLineProduct({ tenantId, row, vendor });
      const quantity = Number(row.quantity);
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: `Invalid quantity for ${product.name}` });
      }

      let purchaseOrderItemId = null;
      if (po) {
        const poItem = row.purchaseOrderItemId
          ? po.items.id(row.purchaseOrderItemId)
          : po.items.find((i) => String(i.productId) === String(product._id));
        if (!poItem) {
          return res.status(400).json({ message: `${product.name} is not on this PO` });
        }
        const remaining = Number(poItem.quantity) - Number(poItem.receivedQty || 0);
        if (quantity > remaining) {
          return res.status(400).json({
            message: `Cannot receive ${quantity} of ${product.name}; only ${remaining} remaining on PO`,
          });
        }
        purchaseOrderItemId = poItem._id;
      }

      builtItems.push({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        quantity,
        unitCost: Number(row.unitCost ?? product.costPrice ?? 0),
        expiryDate: row.expiryDate || null,
        purchaseOrderItemId,
      });
    }

    const grnNumber = await generateDocumentNumber(tenantId, 'grn', 'GRN');
    const receipt = await GoodsReceipt.create({
      tenantId,
      grnNumber,
      vendorId,
      purchaseOrderId: po?._id || null,
      locationId,
      receivedDate: receivedDate || new Date(),
      notes: notes || '',
      items: builtItems,
      subtotal: calcLineSubtotal(builtItems),
      status: 'draft',
      createdBy: userId,
    });

    if (post) {
      await postGoodsReceiptInternal({
        receipt,
        po,
        tenantId,
        userId,
        io,
        createBill: !!createBill,
      });
    }

    const populated = await GoodsReceipt.findById(receipt._id)
      .populate('vendorId', 'name code')
      .populate('locationId', 'name code locationType')
      .populate('purchaseOrderId', 'poNumber status')
      .populate('billId', 'billNumber status total');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.postGoodsReceipt = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;
    const io = req.app.get('io');
    const receipt = await GoodsReceipt.findOne({ _id: req.params.id, tenantId });
    if (!receipt) return res.status(404).json({ message: 'Goods receipt not found' });
    if (receipt.status === 'posted') {
      return res.status(400).json({ message: 'Receipt already posted' });
    }

    let po = null;
    if (receipt.purchaseOrderId) {
      po = await PurchaseOrder.findOne({ _id: receipt.purchaseOrderId, tenantId });
    }

    await postGoodsReceiptInternal({
      receipt,
      po,
      tenantId,
      userId,
      io,
      createBill: !!req.body.createBill,
    });

    const populated = await GoodsReceipt.findById(receipt._id)
      .populate('vendorId', 'name code')
      .populate('locationId', 'name code locationType')
      .populate('purchaseOrderId', 'poNumber status')
      .populate('billId', 'billNumber status total');

    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

async function postGoodsReceiptInternal({
  receipt,
  po,
  tenantId,
  userId,
  io,
  createBill = false,
}) {
  for (const item of receipt.items) {
    const result = await receiveStockLine({
      tenantId,
      userId,
      productId: item.productId,
      warehouseId: receipt.locationId,
      quantity: item.quantity,
      expiryDate: item.expiryDate,
      purchasePrice: item.unitCost,
      reference: receipt.grnNumber,
      note: `Purchase receive ${receipt.grnNumber}${po ? ` / ${po.poNumber}` : ''}`,
      inventoryType: INVENTORY_TYPES.PURCHASE_RECEIVE,
      io,
    });

    item.batchId = result.batch._id;
    item.batchNumber = result.batch.batchNumber;

    if (po) {
      const poItem = po.items.id(item.purchaseOrderItemId)
        || po.items.find((i) => String(i.productId) === String(item.productId));
      if (poItem) {
        poItem.receivedQty = Number(poItem.receivedQty || 0) + Number(item.quantity);
      }
    }
  }

  receipt.status = 'posted';
  await receipt.save();

  if (po) {
    if (po.status === 'draft') po.status = 'ordered';
    refreshPoStatus(po);
    await po.save();
  }

  if (createBill && !receipt.billId) {
    const bill = await createBillFromReceipt(receipt, userId);
    receipt.billId = bill._id;
    await receipt.save();
  }
}
async function createBillFromReceipt(receipt, userId) {
  const billNumber = await generateDocumentNumber(receipt.tenantId, 'bill', 'BILL');
  const items = receipt.items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    sku: item.sku,
    quantity: item.quantity,
    unitCost: item.unitCost,
    lineTotal: Number(item.quantity) * Number(item.unitCost || 0),
  }));
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

  return Bill.create({
    tenantId: receipt.tenantId,
    billNumber,
    vendorId: receipt.vendorId,
    purchaseOrderId: receipt.purchaseOrderId,
    goodsReceiptId: receipt._id,
    items,
    subtotal,
    tax: 0,
    total: subtotal,
    amountPaid: subtotal,
    status: 'paid',
    notes: `Auto-created from ${receipt.grnNumber}`,
    createdBy: userId,
  });
}

/* =========================
   BILLS
========================= */

exports.listBills = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { status, vendorId, search } = req.query;
    const filter = { tenantId };
    if (status) filter.status = status;
    if (vendorId) filter.vendorId = vendorId;
    if (search) filter.billNumber = { $regex: search, $options: 'i' };

    // Auto-update legacy unpaid bills to paid since receive auto-pays
    await Bill.updateMany(
      { tenantId, status: 'unpaid' },
      { $set: { status: 'paid' } }
    );

    const bills = await Bill.find(filter)
      .populate('vendorId', 'name code phone address')
      .populate('purchaseOrderId', 'poNumber')
      .populate({
        path: 'goodsReceiptId',
        populate: [
          { path: 'vendorId', select: 'name code phone address' },
          { path: 'locationId', select: 'name code locationType' },
          { path: 'purchaseOrderId', select: 'poNumber' },
        ],
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bills });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBill = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, tenantId: req.auth.tenantId })
      .populate('vendorId')
      .populate('purchaseOrderId', 'poNumber')
      .populate({
        path: 'goodsReceiptId',
        populate: [
          { path: 'vendorId', select: 'name code phone address' },
          { path: 'locationId', select: 'name code locationType' },
          { path: 'purchaseOrderId', select: 'poNumber' },
        ],
      });
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json({ success: true, data: bill });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createBill = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;
    const { vendorId, purchaseOrderId, goodsReceiptId, dueDate, notes, items, tax = 0 } = req.body;

    if (!vendorId) return res.status(400).json({ message: 'Vendor is required' });
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: 'At least one line is required' });
    }

    const vendor = await Vendor.findOne({ _id: vendorId, tenantId });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    const builtItems = items.map((row) => {
      const quantity = Number(row.quantity || 0);
      const unitCost = Number(row.unitCost || 0);
      return {
        productId: row.productId || null,
        productName: row.productName || '',
        sku: row.sku || '',
        quantity,
        unitCost,
        lineTotal: quantity * unitCost,
      };
    });

    const subtotal = builtItems.reduce((sum, i) => sum + i.lineTotal, 0);
    const taxAmt = Number(tax) || 0;
    const totalAmt = subtotal + taxAmt;
    const billNumber = await generateDocumentNumber(tenantId, 'bill', 'BILL');

    const bill = await Bill.create({
      tenantId,
      billNumber,
      vendorId,
      purchaseOrderId: purchaseOrderId || null,
      goodsReceiptId: goodsReceiptId || null,
      dueDate: dueDate || null,
      notes: notes || '',
      items: builtItems,
      subtotal,
      tax: taxAmt,
      total: totalAmt,
      amountPaid: totalAmt,
      status: 'paid',
      createdBy: userId,
    });

    if (goodsReceiptId) {
      await GoodsReceipt.findOneAndUpdate(
        { _id: goodsReceiptId, tenantId },
        { billId: bill._id }
      );
    }

    res.status(201).json({ success: true, data: bill });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.recordBillPayment = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, tenantId: req.auth.tenantId });
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    if (bill.status === 'void') return res.status(400).json({ message: 'Bill is void' });

    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than 0' });
    }

    bill.amountPaid = Number(bill.amountPaid || 0) + amount;
    if (bill.amountPaid >= bill.total) {
      bill.amountPaid = bill.total;
      bill.status = 'paid';
    } else {
      bill.status = 'partial';
    }
    await bill.save();
    res.json({ success: true, data: bill });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   PURCHASE RETURNS
========================= */

exports.listPurchaseReturns = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { status, vendorId, search } = req.query;
    const filter = { tenantId };
    if (status) filter.status = status;
    if (vendorId) filter.vendorId = vendorId;
    if (search) filter.returnNumber = { $regex: search, $options: 'i' };

    const returns = await PurchaseReturn.find(filter)
      .populate('vendorId', 'name code phone')
      .populate('locationId', 'name code locationType')
      .populate('purchaseOrderId', 'poNumber')
      .populate('goodsReceiptId', 'grnNumber')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: returns });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPurchaseReturn = async (req, res) => {
  try {
    const returnDoc = await PurchaseReturn.findOne({
      _id: req.params.id,
      tenantId: req.auth.tenantId,
    })
      .populate('vendorId')
      .populate('locationId', 'name code locationType')
      .populate('purchaseOrderId', 'poNumber status')
      .populate('goodsReceiptId', 'grnNumber status')
      .populate('items.productId', 'name sku unit costPrice')
      .populate('createdBy', 'firstName lastName email');

    if (!returnDoc) return res.status(404).json({ message: 'Purchase return not found' });
    res.json({ success: true, data: returnDoc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReturnableProducts = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { warehouseId, vendorId } = req.query;

    if (!warehouseId || !vendorId) {
      return res.status(400).json({ message: 'Supplier and location are required' });
    }

    await resolveLocation(tenantId, warehouseId);
    const vendor = await Vendor.findOne({ _id: vendorId, tenantId });
    if (!vendor) return res.status(404).json({ message: 'Supplier not found' });

    const postedReceipts = await GoodsReceipt.find({
      tenantId,
      vendorId,
      status: 'posted',
    })
      .select('items locationId')
      .lean();

    const purchasedBatchIds = new Set();
    const purchasedProductIds = new Set();
    const receiptCostByBatchId = new Map();
    const receiptCostByProductId = new Map();

    for (const receipt of postedReceipts) {
      for (const item of receipt.items || []) {
        if (item.productId) {
          const pidStr = String(item.productId);
          purchasedProductIds.add(pidStr);
          if (item.unitCost != null) {
            receiptCostByProductId.set(pidStr, Number(item.unitCost));
          }
        }
        if (item.batchId) {
          const bidStr = String(item.batchId);
          purchasedBatchIds.add(bidStr);
          if (item.unitCost != null) {
            receiptCostByBatchId.set(bidStr, Number(item.unitCost));
          }
        }
      }
    }

    const activeBatches = await Batch.find({
      tenantId,
      warehouseId,
      remainingQty: { $gt: 0 },
    })
      .populate('productId', 'name sku costPrice unit supplierName')
      .sort({ receivedDate: 1 })
      .lean();

    const nameGroups = new Map();

    for (const b of activeBatches) {
      if (!b.productId?._id) continue;

      const batchId = String(b._id);
      const productId = String(b.productId._id);
      const sourceBatchId = b.sourceBatchId ? String(b.sourceBatchId) : null;

      const isPurchased =
        purchasedBatchIds.has(batchId) ||
        (sourceBatchId && purchasedBatchIds.has(sourceBatchId)) ||
        purchasedProductIds.has(productId) ||
        (vendor.name && b.productId.supplierName && vendor.name.trim().toLowerCase() === b.productId.supplierName.trim().toLowerCase());

      if (!isPurchased) continue;

      const receivedUnitCost =
        receiptCostByBatchId.get(batchId) ||
        (sourceBatchId ? receiptCostByBatchId.get(sourceBatchId) : null) ||
        receiptCostByProductId.get(productId) ||
        Number(b.purchasePrice) ||
        Number(b.productId.costPrice) ||
        0;

      const nameKey = String(b.productId.name || '').trim().toLowerCase();
      if (!nameKey) continue;

      if (!nameGroups.has(nameKey)) {
        nameGroups.set(nameKey, {
          _id: b.productId._id,
          name: b.productId.name,
          sku: b.productId.sku || '',
          costPrice: receivedUnitCost,
          unit: b.productId.unit || 'pcs',
          totalBatchQty: 0,
          batches: [],
        });
      }

      const group = nameGroups.get(nameKey);
      group.totalBatchQty += Number(b.remainingQty || 0);
      group.batches.push({
        _id: b._id,
        batchNumber: b.batchNumber,
        remainingQty: b.remainingQty,
        purchasedQty: b.quantity,
        unitCost: receivedUnitCost,
        maxUnitCost: receivedUnitCost,
        productId: b.productId._id,
        expiryDate: b.expiryDate,
        reference: b.reference,
        receivedDate: b.receivedDate,
      });

      if (!group.sku && b.productId.sku) group.sku = b.productId.sku;
    }

    const defectiveWriteOffs = await WriteOff.find({
      tenantId,
      quantity: { $gt: 0 },
    })
      .populate('productId', 'name sku costPrice unit supplierName')
      .lean();

    for (const writeOff of defectiveWriteOffs) {
      const product = writeOff.productId;
      if (!product?._id || !purchasedProductIds.has(String(product._id))) continue;

      const nameKey = String(product.name || '').trim().toLowerCase();
      let group = nameGroups.get(nameKey);
      if (!group) {
        group = {
          _id: product._id,
          name: product.name,
          sku: product.sku || '',
          costPrice: Number(product.costPrice) || 0,
          unit: product.unit || 'pcs',
          totalBatchQty: 0,
          batches: [],
        };
        nameGroups.set(nameKey, group);
      }

      group.totalBatchQty += Number(writeOff.quantity || 0);
      group.batches.push({
        _id: `pos-defective-${product._id}`,
        batchNumber: 'POS-DEFECTIVE',
        remainingQty: Number(writeOff.quantity || 0),
        purchasedQty: Number(writeOff.quantity || 0),
        unitCost: Number(writeOff.unitValue || product.costPrice || 0),
        maxUnitCost: Number(writeOff.unitValue || product.costPrice || 0),
        productId: product._id,
        reference: writeOff.originalInvoiceId || writeOff.referenceId || 'POS-RETURN',
        receivedDate: writeOff.createdAt,
        returnSource: 'pos_defective',
      });
    }

    const returnableProducts = Array.from(nameGroups.values())
      .filter((p) => p.totalBatchQty > 0 && p.batches.length > 0)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    res.json({ success: true, data: returnableProducts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createPurchaseReturn = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;
    const io = req.app.get('io');
    const {
      vendorId,
      locationId,
      purchaseOrderId,
      goodsReceiptId,
      returnDate,
      notes,
      items,
    } = req.body;

    if (!vendorId) return res.status(400).json({ message: 'Supplier is required' });
    if (!locationId) return res.status(400).json({ message: 'Location is required' });
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: 'At least one item is required to return' });
    }

    const vendor = await Vendor.findOne({ _id: vendorId, tenantId });
    if (!vendor) return res.status(404).json({ message: 'Supplier not found' });
    const location = await resolveLocation(tenantId, locationId);

    const processedItems = [];
    const executionActions = [];

    for (const row of items) {
      const quantity = Number(row.quantity);
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Return quantity must be greater than 0' });
      }
      if (!row.productId) {
        return res.status(400).json({ message: 'Product is required' });
      }

      const product = await Product.findOne({ _id: row.productId, tenantId });
      if (!product) {
        return res.status(404).json({ message: `Product not found` });
      }

      const isDefective = row.returnSource === 'pos_defective';

      if (isDefective) {
        // Find defective write-off records
        const writeOffs = await WriteOff.find({
          tenantId,
          productId: product._id,
          quantity: { $gt: 0 },
        });

        const totalDefective = writeOffs.reduce((sum, w) => sum + Number(w.quantity || 0), 0);
        if (totalDefective < quantity) {
          return res.status(400).json({
            message: `Not enough defective POS returned stock for product "${product.name}". Available defective: ${totalDefective}, Return requested: ${quantity}`,
          });
        }

        processedItems.push({
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          quantity,
          unitCost: Number(row.unitCost ?? product.costPrice ?? 0),
          originalUnitCost: Number(row.unitCost ?? product.costPrice ?? 0),
          batchNumber: row.batchNumber || 'POS-DEFECTIVE',
          reason: row.reason || 'POS Customer Defective Return',
        });

        executionActions.push({
          type: 'pos_defective',
          product,
          quantity,
          writeOffs,
        });
      } else {
        if (!row.batchNumber && !row.batchId) {
          return res.status(400).json({ message: 'Batch is required for purchase return' });
        }

        let batch;
        if (row.batchId) {
          batch = await Batch.findOne({
            _id: row.batchId,
            tenantId,
            warehouseId: location._id,
          });
        } else {
          batch = await Batch.findOne({
            tenantId,
            productId: product._id,
            warehouseId: location._id,
            batchNumber: row.batchNumber,
          });
        }

        if (!batch) {
          return res.status(404).json({
            message: `Batch not found for product "${product.name}" at location "${location.name}"`,
          });
        }

        const receivedUnitCost =
          Number(batch.purchasePrice) ||
          Number(product.costPrice) ||
          0;

        const returnUnitCost = Number(row.unitCost ?? receivedUnitCost);
        if (receivedUnitCost > 0 && returnUnitCost > receivedUnitCost) {
          return res.status(400).json({
            message: `Return unit cost (${returnUnitCost}) cannot exceed received cost (${receivedUnitCost}) for batch "${batch.batchNumber}"`,
          });
        }

        const maxReturnable = Number(batch.remainingQty || 0);
        if (quantity > maxReturnable) {
          return res.status(400).json({
            message: `Return qty ${quantity} exceeds available stock for batch "${batch.batchNumber}". Max: ${maxReturnable} (purchased/remaining at this location)`,
          });
        }

        if (quantity > Number(batch.quantity || 0)) {
          return res.status(400).json({
            message: `Cannot return ${quantity} units — batch "${batch.batchNumber}" was only received with ${batch.quantity} units`,
          });
        }

        processedItems.push({
          productId: batch.productId,
          productName: product.name,
          sku: product.sku,
          quantity,
          unitCost: returnUnitCost,
          originalUnitCost: receivedUnitCost,
          batchNumber: batch.batchNumber,
          batchId: batch._id,
          reason: row.reason || '',
        });

        executionActions.push({
          type: 'batch',
          batch,
          product: await Product.findById(batch.productId),
          quantity,
        });
      }
    }

    const totalAmount = processedItems.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0
    );

    const returnNumber = await generateDocumentNumber(tenantId, 'pr', 'PR');

    const purchaseReturn = await PurchaseReturn.create({
      tenantId,
      returnNumber,
      vendorId,
      locationId: location._id,
      purchaseOrderId: purchaseOrderId || null,
      goodsReceiptId: goodsReceiptId || null,
      returnDate: returnDate || new Date(),
      notes: notes || '',
      items: processedItems,
      totalAmount,
      status: 'posted',
      createdBy: userId,
    });

    for (const action of executionActions) {
      if (action.type === 'pos_defective') {
        const { product, quantity, writeOffs } = action;
        let qtyToDeduct = quantity;

        for (const w of writeOffs) {
          if (qtyToDeduct <= 0) break;
          const availableQuantity = Number(w.quantity) || 0;
          const deduct = Math.min(availableQuantity, qtyToDeduct);
          const remainingQuantity = availableQuantity - deduct;
          if (remainingQuantity > 0) {
            w.quantity = remainingQuantity;
            await w.save();
          } else {
            await WriteOff.deleteOne({ _id: w._id, tenantId });
          }
          qtyToDeduct -= deduct;
        }

        const activity = getInventoryActivity(INVENTORY_TYPES.PURCHASE_RETURN, quantity);

        await Inventory.create({
          tenantId,
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          warehouseId: location._id,
          type: INVENTORY_TYPES.PURCHASE_RETURN,
          quantity,
          previousQuantity: 0,
          newQuantity: 0,
          reference: returnNumber,
          note: `Returned POS customer defective stock ${returnNumber} to supplier (${vendor.name})${notes ? `: ${notes}` : ''}`,
          createdBy: userId,
          batchNumber: 'POS-DEFECTIVE',
          activityText: `Returned ${quantity} POS defective units to supplier`,
          activityIcon: activity.icon,
        });
      } else {
        const { batch, product, quantity } = action;

        // 1. Deduct from batch
        batch.remainingQty -= quantity;
        await batch.save();

        // 2. Recalculate stock for this product at location
        let stock = await Stock.findOne({
          tenantId,
          productId: product._id,
          warehouseId: location._id,
        });

        const allBatches = await Batch.find({
          tenantId,
          productId: product._id,
          warehouseId: location._id,
        });

        const totalQty = allBatches.reduce((sum, b) => sum + b.remainingQty, 0);
        const previousQuantity = stock ? stock.quantity : totalQty + quantity;

        if (!stock) {
          stock = new Stock({
            tenantId,
            productId: product._id,
            warehouseId: location._id,
            quantity: totalQty,
          });
        } else {
          stock.quantity = totalQty;
        }
        await stock.save();

        // 3. Create inventory log entry
        const activity = getInventoryActivity(INVENTORY_TYPES.PURCHASE_RETURN, quantity);

        await Inventory.create({
          tenantId,
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          warehouseId: location._id,
          type: INVENTORY_TYPES.PURCHASE_RETURN,
          quantity,
          previousQuantity,
          newQuantity: totalQty,
          reference: returnNumber,
          note: `Purchase return ${returnNumber} to supplier (${vendor.name})${notes ? `: ${notes}` : ''}`,
          createdBy: userId,
          batchNumber: batch.batchNumber,
          batchUsage: [
            {
              batchId: batch._id,
              batchNumber: batch.batchNumber,
              deductedQty: quantity,
            },
          ],
          activityText: activity.text,
          activityIcon: activity.icon,
        });

        // 4. Send low-stock alerts
        await sendAlerts({
          io,
          tenantId,
          productId: product._id,
          warehouseId: location._id,
          product,
          warehouse: location,
          totalQty,
        });
      }
    }

    const populated = await PurchaseReturn.findById(purchaseReturn._id)
      .populate('vendorId', 'name code')
      .populate('locationId', 'name code locationType')
      .populate('purchaseOrderId', 'poNumber')
      .populate('goodsReceiptId', 'grnNumber');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPurchaseSummary = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const tenantObjectId = mongoose.Types.ObjectId.isValid(tenantId)
      ? new mongoose.Types.ObjectId(tenantId)
      : tenantId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const calcAmountPipeline = (matchStage) => [
      { $match: matchStage },
      {
        $project: {
          subtotal: 1,
          items: 1,
          calculatedSubtotal: {
            $reduce: {
              input: '$items',
              initialValue: 0,
              in: {
                $add: [
                  '$$value',
                  {
                    $multiply: [
                      { $ifNull: ['$$this.quantity', 0] },
                      { $ifNull: ['$$this.unitCost', 0] },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          effectiveAmount: {
            $cond: [
              { $gt: ['$subtotal', 0] },
              '$subtotal',
              '$calculatedSubtotal',
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$effectiveAmount' },
        },
      },
    ];

    const [
      vendors,
      openPos,
      unpaidBills,
      receipts,
      returns,
      totalPurchasesAgg,
      todaysPurchasesAgg,
      todaysCount,
    ] = await Promise.all([
      Vendor.countDocuments({ tenantId, status: 'active' }),
      PurchaseOrder.countDocuments({
        tenantId,
        status: { $in: ['draft', 'ordered', 'partial'] },
      }),
      Bill.countDocuments({ tenantId, status: { $in: ['unpaid', 'partial'] } }),
      GoodsReceipt.countDocuments({ tenantId, status: 'posted' }),
      PurchaseReturn.countDocuments({ tenantId, status: 'posted' }),

      GoodsReceipt.aggregate(calcAmountPipeline({ tenantId: tenantObjectId, status: 'posted' })),

      GoodsReceipt.aggregate(
        calcAmountPipeline({
          tenantId: tenantObjectId,
          status: 'posted',
          createdAt: { $gte: startOfToday },
        })
      ),

      GoodsReceipt.countDocuments({
        tenantId,
        status: 'posted',
        createdAt: { $gte: startOfToday },
      }),
    ]);

    const totalPurchasedAmount = totalPurchasesAgg[0]?.totalAmount || 0;
    const todaysPurchasedAmount = todaysPurchasesAgg[0]?.totalAmount || 0;

    res.json({
      success: true,
      data: {
        vendors,
        openPos,
        unpaidBills,
        receipts,
        returns,
        totalPurchasesCount: receipts,
        totalPurchasedAmount,
        todaysPurchasesCount: todaysCount,
        todaysPurchasedAmount,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
