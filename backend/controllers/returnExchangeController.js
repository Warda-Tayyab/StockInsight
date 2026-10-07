const Sale = require('../models/tenant/Sale');
const Product = require('../models/tenant/Product');
const ReturnExchange = require('../models/tenant/ReturnExchange');
const WriteOff = require('../models/tenant/WriteOff');
const {
  getOrCreatePolicy,
  getNextReference,
  isWithinWindow,
  getReturnableQty,
  resolveItemCondition,
  isRestockable,
  restockItems,
  writeOffItems,
  deductExchangeItems,
  calculateSettlement,
  updateSaleReturnStatus
} = require('../utils/returnExchangeHelper');

const WRITE_OFF_CONDITIONS = ['damaged', 'defective'];

const enrichSaleItems = (sale) =>
  (sale.items || []).map((item) => ({
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,

    originalLineTotal: item.originalLineTotal || item.lineTotal,
    discountedLineTotal:
      item.discountedLineTotal || item.lineTotal,

    discountAmount: item.discountAmount || 0,
    discountPercentage: item.discountPercentage || 0,
    discountType: item.discountType || null,
    discountValue: item.discountValue || 0,

    lineTotal: item.lineTotal,

    returnedQty: item.returnedQty || 0,
    returnableQty: getReturnableQty(item)
  }));

exports.lookupSale = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const invoiceId = String(req.params.invoiceId || '').trim();

    if (!invoiceId) {
      return res.status(400).json({ message: 'Invoice ID is required' });
    }

    const sale = await Sale.findOne({ tenantId, invoiceId });
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found for this invoice' });
    }

    const policy = await getOrCreatePolicy(tenantId);

    res.json({
      success: true,
      sale: {
        _id: sale._id,
        invoiceId: sale.invoiceId,
        createdAt: sale.createdAt,
        subtotal: sale.subtotal,
        couponCode: sale.couponCode || null,
        couponDiscountAmount: sale.couponDiscountAmount || 0,
        storeDiscountAmount: sale.storeDiscountAmount || 0,
        hasCoupon: Boolean(
          (sale.couponCode && String(sale.couponCode).trim()) ||
          (sale.couponDiscountAmount && Number(sale.couponDiscountAmount) > 0)
        ),
        tax: sale.tax,
        total: sale.total,
        paymentMethod: sale.paymentMethod,
        returnStatus: sale.returnStatus || 'none',
        items: enrichSaleItems(sale)
      },
      policy: {
        returnsEnabled: policy.returnsEnabled,
        exchangesEnabled: policy.exchangesEnabled,
        allowDiscountedProductReturns:
          policy.allowDiscountedProductReturns,
        allowDiscountedProductExchanges:
          policy.allowDiscountedProductExchanges,
        allowCouponSaleReturns: policy.allowCouponSaleReturns ?? false,
        allowCouponSaleExchanges: policy.allowCouponSaleExchanges ?? false,
        returnWindowDays: policy.returnWindowDays,
        exchangeWindowDays: policy.exchangeWindowDays,
        allowPartialReturn: policy.allowPartialReturn,
        allowedReasons: policy.allowedReasons,
        autoWriteOffReasons: policy.autoWriteOffReasons,
        restockingFeePercent: policy.restockingFeePercent,
        refundMethods: policy.refundMethods,
        collectionMethods: policy.collectionMethods,
        defaultRefundMethod: policy.defaultRefundMethod,
        defaultCollectionMethod: policy.defaultCollectionMethod,
        exchangePricePolicy: policy.exchangePricePolicy,
        policyNotes: policy.policyNotes,
        taxLabel: `${policy.taxLabel} (${policy.taxRatePercent}%)`,
        taxRatePercent: policy.taxRatePercent
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const validateReturnItems = (sale, returnItems, policy, type) => {
  const windowDays =
    type === 'exchange'
      ? policy.exchangeWindowDays
      : policy.returnWindowDays;

  if (type === 'return' && !policy.returnsEnabled) {
    throw Object.assign(
      new Error('Returns are disabled in policy settings'),
      { status: 403 }
    );
  }

  if (type === 'exchange' && !policy.exchangesEnabled) {
    throw Object.assign(
      new Error('Exchanges are disabled in policy settings'),
      { status: 403 }
    );
  }

  // ======================================================
  // COUPON SALE RETURN / EXCHANGE CHECK
  // ======================================================
  const hasCoupon = Boolean(
    (sale.couponCode && String(sale.couponCode).trim()) ||
    (sale.couponDiscountAmount && Number(sale.couponDiscountAmount) > 0)
  );

  if (hasCoupon) {
    const allowed =
      type === 'exchange'
        ? policy.allowCouponSaleExchanges
        : policy.allowCouponSaleReturns;

    if (!allowed) {
      throw Object.assign(
        new Error(
          `This sale was made using a coupon (${sale.couponCode || 'Coupon Applied'}) and ${type}s on coupon sales are disabled in policy settings`
        ),
        { status: 403 }
      );
    }
  }

  if (!isWithinWindow(sale.createdAt, windowDays)) {
    throw Object.assign(
      new Error(
        `${type === 'exchange' ? 'Exchange' : 'Return'} window of ${windowDays} days has expired`
      ),
      { status: 400 }
    );
  }

  if (!returnItems?.length) {
    throw Object.assign(
      new Error('Select at least one item to return'),
      { status: 400 }
    );
  }

  const processed = [];

  for (const reqItem of returnItems) {
    const saleItem = sale.items.find(
      (i) => String(i.productId) === String(reqItem.productId)
    );

    if (!saleItem) {
      throw Object.assign(
        new Error('Item not found on original sale'),
        { status: 400 }
      );
    }

    const returnable = getReturnableQty(saleItem);
    const qty = Number(reqItem.quantity);

    if (!qty || qty <= 0) {
      throw Object.assign(
        new Error('Invalid return quantity'),
        { status: 400 }
      );
    }

    if (qty > returnable) {
      throw Object.assign(
        new Error(
          `Cannot return more than ${returnable} units of ${saleItem.productName}`
        ),
        { status: 400 }
      );
    }

    if (!policy.allowPartialReturn && qty < returnable) {
      throw Object.assign(
        new Error('Partial returns are not allowed by your policy'),
        { status: 400 }
      );
    }

    // ======================================================
    // DISCOUNTED PRODUCT RETURN / EXCHANGE CHECK
    // ======================================================

    const discountAmount = Number(saleItem.discountAmount || 0);

    const isDiscounted =
      discountAmount > 0 ||
      Number(saleItem.discountPercentage || 0) > 0 ||
      Number(saleItem.discountValue || 0) > 0 ||
      (
        saleItem.originalLineTotal != null &&
        saleItem.discountedLineTotal != null &&
        Number(saleItem.originalLineTotal) >
          Number(saleItem.discountedLineTotal)
      );

    if (isDiscounted) {
      const allowed =
        type === 'exchange'
          ? policy.allowDiscountedProductExchanges
          : policy.allowDiscountedProductReturns;

      if (!allowed) {
        throw Object.assign(
          new Error(
            `This product was sold with a discount and discounted product ${type}s are disabled in policy settings`
          ),
          { status: 403 }
        );
      }
    }

    const reason = reqItem.reason || '';
    const condition = resolveItemCondition(
      reason,
      reqItem.condition,
      policy
    );

    const originalUnitPrice = Number(saleItem.unitPrice || 0);

    const originalLineTotal = Number(
      saleItem.originalLineTotal ||
      originalUnitPrice * Number(saleItem.quantity || 0)
    );
    
    const discountedLineTotal = Number(
      saleItem.discountedLineTotal ??
      saleItem.lineTotal ??
      originalLineTotal
    );
    
    const discountedUnitPrice =
      Number(saleItem.quantity || 0) > 0
        ? discountedLineTotal / Number(saleItem.quantity)
        : originalUnitPrice;
    
    processed.push({
      productId: saleItem.productId,
      productName: saleItem.productName,
      quantity: qty,
    
      // IMPORTANT: return/exchange uses actual paid discounted price
      unitPrice: discountedUnitPrice,
    
      lineTotal: discountedUnitPrice * qty,
    
      // Keep discount information in history
      originalUnitPrice,
      originalLineTotal,
      discountedLineTotal,
    
      discountAmount: Number(saleItem.discountAmount || 0),
      discountPercentage: Number(saleItem.discountPercentage || 0),
      discountType: saleItem.discountType || null,
      discountValue: Number(saleItem.discountValue || 0),
    
      reason,
      condition
    });
  }

  return processed;
};

const applyReturnsToSale = (sale, processed) => {
  for (const item of processed) {
    const saleItem = sale.items.find(
      (i) => String(i.productId) === String(item.productId)
    );
    if (saleItem) {
      saleItem.returnedQty = (saleItem.returnedQty || 0) + item.quantity;
    }
  }
};

const processReturnedInventory = async ({
  tenantId,
  userId,
  items,
  reference,
  returnExchangeId,
  sale,
  note
}) => {
  const restockable = items.filter((i) => isRestockable(i.condition));
  const writtenOff = items.filter((i) => !isRestockable(i.condition));

  if (restockable.length) {
    await restockItems({
      tenantId,
      userId,
      items: restockable,
      reference,
      note,
      sale
    });
  }

  if (writtenOff.length) {
    await writeOffItems({
      tenantId,
      userId,
      items: writtenOff,
      reference,
      returnExchangeId,
      originalSaleId: sale._id,
      originalInvoiceId: sale.invoiceId,
      note
    });
  }

  return {
    restockedCount: restockable.reduce((s, i) => s + i.quantity, 0),
    writtenOffCount: writtenOff.reduce((s, i) => s + i.quantity, 0)
  };
};

const validateSettlement = (settlement, policy, body, type) => {
  const { refundMethod, collectionMethod, amountCollected } = body;

  if (type === 'exchange' && settlement.settlementType === 'collect') {
    const method = collectionMethod || policy.defaultCollectionMethod;
    if (!policy.collectionMethods.includes(method)) {
      throw Object.assign(new Error('Collection method not allowed by policy'), { status: 400 });
    }
    const collected = Number(amountCollected);
    if (!collected || collected < settlement.amountDue - 0.01) {
      throw Object.assign(
        new Error(`Collect Rs.${settlement.amountDue.toFixed(2)} from customer (cash/card)`),
        { status: 400 }
      );
    }
    return { collectionMethod: method, amountCollected: collected };
  }

  const needsRefund = type === 'return'
    ? settlement.returnedNet > 0
    : settlement.settlementType === 'refund';

  if (needsRefund) {
    const refundAmt = type === 'return' ? settlement.returnedNet : settlement.refundAmount;
    const method = refundMethod || policy.defaultRefundMethod;
    if (!policy.refundMethods.includes(method)) {
      throw Object.assign(new Error('Refund method not allowed by policy'), { status: 400 });
    }
    return { refundMethod: method, refundAmount: refundAmt };
  }

  return {};
};

exports.processReturn = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;
    const { saleId, invoiceId, items, refundMethod, notes } = req.body;

    const policy = await getOrCreatePolicy(tenantId);

    const sale = saleId
      ? await Sale.findOne({ _id: saleId, tenantId })
      : await Sale.findOne({ tenantId, invoiceId });

    if (!sale) {
      return res.status(404).json({ message: 'Original sale not found' });
    }

    const returnedItems = validateReturnItems(sale, items, policy, 'return');
    const subtotalReturned = returnedItems.reduce((s, i) => s + i.lineTotal, 0);
    const settlement = calculateSettlement(subtotalReturned, 0, policy.restockingFeePercent);

    const payment = validateSettlement(
      settlement,
      policy,
      { refundMethod },
      'return'
    );

    const referenceId = await getNextReference(tenantId, 'return');

    const counts = await processReturnedInventory({
      tenantId,
      userId,
      items: returnedItems,
      reference: referenceId,
      returnExchangeId: null,
      sale,
      note: `Customer return — ${sale.invoiceId}`
    });

    applyReturnsToSale(sale, returnedItems);
    updateSaleReturnStatus(sale);
    await sale.save();

    const record = await ReturnExchange.create({
      tenantId,
      referenceId,
      type: 'return',
      status: 'completed',
      originalSaleId: sale._id,
      originalInvoiceId: sale.invoiceId,
      returnedItems,
      subtotalReturned,
      restockingFee: settlement.restockingFee,
      returnedNet: settlement.returnedNet,
      settlementType: 'refund',
      refundAmount: settlement.returnedNet,
      refundMethod: payment.refundMethod,
      restockedCount: counts.restockedCount,
      writtenOffCount: counts.writtenOffCount,
      notes: notes || '',
      processedBy: userId,
      policySnapshot: policy
    });

    if (counts.writtenOffCount > 0) {
      await WriteOff.updateMany(
        { tenantId, referenceId, returnExchangeId: null },
        { returnExchangeId: record._id }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Return processed successfully',
      returnExchange: record,
      settlement: {
        refundAmount: settlement.returnedNet,
        refundMethod: payment.refundMethod,
        restockedCount: counts.restockedCount,
        writtenOffCount: counts.writtenOffCount
      }
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.processExchange = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;
    const {
      saleId,
      invoiceId,
      returnedItems: returnItemsBody,
      exchangeItems,
      refundMethod,
      collectionMethod,
      amountCollected,
      notes
    } = req.body;

    const policy = await getOrCreatePolicy(tenantId);

    const sale = saleId
      ? await Sale.findOne({ _id: saleId, tenantId })
      : await Sale.findOne({ tenantId, invoiceId });

    if (!sale) {
      return res.status(404).json({ message: 'Original sale not found' });
    }

    if (!exchangeItems?.length) {
      return res.status(400).json({ message: 'Select at least one exchange item' });
    }

    const processedReturnItems = validateReturnItems(sale, returnItemsBody, policy, 'exchange');

    const processedExchangeItems = [];
    for (const ex of exchangeItems) {
      const product = await Product.findOne({ _id: ex.productId, tenantId, status: 'active' });
      if (!product) {
        return res.status(404).json({ message: `Exchange product not found` });
      }

      const qty = Number(ex.quantity);
      if (!qty || qty <= 0) {
        return res.status(400).json({ message: 'Invalid exchange quantity' });
      }

      const stockRecords = await require('../models/tenant/Stock').find({ tenantId, productId: product._id });
      const available = stockRecords.reduce((s, r) => s + (r.quantity || 0), 0);
      if (available < qty) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      const unitPrice = policy.exchangePricePolicy === 'current_price'
        ? product.sellingPrice
        : (processedReturnItems.find((r) => String(r.productId) === String(ex.productId))?.unitPrice
          || product.sellingPrice);

      processedExchangeItems.push({
        productId: product._id,
        productName: product.name,
        quantity: qty,
        unitPrice,
        lineTotal: unitPrice * qty,
        condition: 'sellable'
      });
    }

    const subtotalReturned = processedReturnItems.reduce((s, i) => s + i.lineTotal, 0);
    const subtotalExchanged = processedExchangeItems.reduce((s, i) => s + i.lineTotal, 0);
    const settlement = calculateSettlement(
      subtotalReturned,
      subtotalExchanged,
      policy.restockingFeePercent
    );

    const payment = validateSettlement(settlement, policy, {
      refundMethod,
      collectionMethod,
      amountCollected
    }, 'exchange');

    const referenceId = await getNextReference(tenantId, 'exchange');

    const counts = await processReturnedInventory({
      tenantId,
      userId,
      items: processedReturnItems,
      reference: referenceId,
      returnExchangeId: null,
      sale,
      note: `Exchange return — ${sale.invoiceId}`
    });

    await deductExchangeItems({
      tenantId,
      userId,
      items: processedExchangeItems,
      reference: referenceId
    });

    applyReturnsToSale(sale, processedReturnItems);
    updateSaleReturnStatus(sale);
    await sale.save();

    const record = await ReturnExchange.create({
      tenantId,
      referenceId,
      type: 'exchange',
      status: 'completed',
      originalSaleId: sale._id,
      originalInvoiceId: sale.invoiceId,
      returnedItems: processedReturnItems,
      exchangeItems: processedExchangeItems,
      subtotalReturned,
      subtotalExchanged,
      restockingFee: settlement.restockingFee,
      returnedNet: settlement.returnedNet,
      priceDifference: settlement.priceDifference,
      settlementType: settlement.settlementType,
      refundAmount: settlement.refundAmount,
      amountDue: settlement.amountDue,
      amountCollected: payment.amountCollected || 0,
      refundMethod: payment.refundMethod || null,
      collectionMethod: payment.collectionMethod || null,
      restockedCount: counts.restockedCount,
      writtenOffCount: counts.writtenOffCount,
      notes: notes || '',
      processedBy: userId,
      policySnapshot: policy
    });

    if (counts.writtenOffCount > 0) {
      await WriteOff.updateMany(
        { tenantId, referenceId, returnExchangeId: null },
        { returnExchangeId: record._id }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Exchange processed successfully',
      returnExchange: record,
      settlement: {
        settlementType: settlement.settlementType,
        amountDue: settlement.amountDue,
        refundAmount: settlement.refundAmount,
        amountCollected: payment.amountCollected || 0,
        collectionMethod: payment.collectionMethod,
        refundMethod: payment.refundMethod,
        restockedCount: counts.restockedCount,
        writtenOffCount: counts.writtenOffCount
      }
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const records = await ReturnExchange.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getWriteOffs = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const records = await WriteOff.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.previewSettlement = async (req, res) => {
  try {
    const policy = await getOrCreatePolicy(req.auth.tenantId);
    const { subtotalReturned, subtotalExchanged } = req.body;
    const settlement = calculateSettlement(
      Number(subtotalReturned) || 0,
      Number(subtotalExchanged) || 0,
      policy.restockingFeePercent
    );
    res.json({ success: true, settlement, policy: {
      refundMethods: policy.refundMethods,
      collectionMethods: policy.collectionMethods,
      defaultRefundMethod: policy.defaultRefundMethod,
      defaultCollectionMethod: policy.defaultCollectionMethod
    }});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
