const Product = require('../models/tenant/Product');
const InventoryLog = require('../models/tenant/Inventory');
const Sale = require('../models/tenant/Sale');
const Stock = require('../models/tenant/Stock');
const Counter = require('../models/tenant/Counter');
const Batch = require('../models/tenant/Batch');
const getInventoryActivity = require('../utils/inventoryActivityHelper');
const sendAlerts = require('../utils/alertEngine');
const Tenant = require('../models/shared/Tenant');
const User = require('../models/tenant/User');
const ReturnExchangePolicy = require('../models/tenant/ReturnExchangePolicy');
const StoreDiscount = require('../models/tenant/StoreDiscount');
const Coupon = require('../models/tenant/Coupon');
const { calculateSaleTax } = require('../utils/returnExchangePolicyHelpers');
const { getStoreLocationIds, getStoreStockForProduct, getDuplicateProductIds, getStoreStockForProductGroup } = require('../utils/locationStockHelper');
const { getSaleNetTotal } = require('../utils/reportHelpers');
const {
  getEligibleStoreDiscounts,
  validateCoupon,
  applyPromotions,
  formatScopeLabel
} = require('../utils/promotionHelpers');
const { enrichCartItemsWithBatchBreakdown } = require('../utils/batchAllocationHelper');

const formatPromotionLabel = (item) => {
  if (!item) return '';
  const scopePrefix = item.scope && item.scope !== 'all' ? `${formatScopeLabel(item)}: ` : '';
  if (item.type === 'percentage') {
    return `${scopePrefix}${item.name || item.code} (${item.value}%)`;
  }
  return `${scopePrefix}${item.name || item.code} ($${Number(item.value).toFixed(2)})`;
};
/**
 * ======================================================
 * ✅ CREATE SALE (MULTI-TENANT POS CHECKOUT - FIXED)
 * ======================================================
 */
const getNextInvoice = async (tenantId) => {
  const counter = await Counter.findOneAndUpdate(
    { tenantId, name: 'invoice' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `INV-${String(counter.seq).padStart(6, '0')}`;
};
exports.createSale = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;

    let {
      items,
      paymentMethod,
      cashReceived,
      changeReturned,
      couponCode
  } = req.body;

let subtotal = 0;

const enrichedItems = [];

for (const item of items) {
  const product = await Product.findOne({
    _id: item.productId,
    tenantId
  });
  const unitPrice = product.sellingPrice || 0;
  const lineTotal = unitPrice * item.quantity;

  subtotal += lineTotal;

  enrichedItems.push({
    productId: product._id,
    productName: product.name,
    quantity: item.quantity,
    unitPrice,
    lineTotal,
    categoryId: product.categoryId,
    supplierName: product.supplierName
  });
}

const cartItems = enrichedItems.map((item) => ({
  productId: item.productId,
  categoryId: item.categoryId,
  supplierName: item.supplierName,
  lineTotal: item.lineTotal,
  quantity: item.quantity
}));

const cartItemsWithBatches = await enrichCartItemsWithBatchBreakdown(tenantId, cartItems);

const policy = await ReturnExchangePolicy.findOne({ tenantId }).lean();
const taxRatePercent = policy?.taxRatePercent ?? 8;

const storeDiscounts = await StoreDiscount.find({
  tenantId,
  isActive: true
}).lean();

const eligibleDiscounts = getEligibleStoreDiscounts(
  storeDiscounts,
  cartItemsWithBatches,
  subtotal
);

let couponDoc = null;

if (couponCode) {
  const foundCoupon = await Coupon.findOne({
    tenantId,
    code: String(couponCode).trim().toUpperCase()
  }).lean();

  if (!foundCoupon) {
    return res.status(400).json({
      message: 'Coupon not found.'
    });
  }

  // Store discounts first
  const storeOnlyPreview = applyPromotions({
    subtotal,
    cartItems: cartItemsWithBatches,
    storeDiscounts: eligibleDiscounts,
    coupon: null
  });

  const afterStoreDiscount =
    storeOnlyPreview.discountedSubtotal;

  // Minimum amount check AFTER store discount
  const validation = validateCoupon(
    foundCoupon,
    afterStoreDiscount
  );

  if (!validation.valid) {
    return res.status(400).json({
      message: validation.message
    });
  }

  couponDoc = validation.coupon;
}

// Store discounts + validated coupon
const promotionResult = applyPromotions({
  subtotal,
  cartItems: cartItemsWithBatches,
  storeDiscounts: eligibleDiscounts,
  coupon: couponDoc
});
const itemPromotionMap = new Map(
  (promotionResult.itemPromotions || []).map((promotion) => [
    String(promotion.productId),
    promotion
  ])
);

const finalEnrichedItems = enrichedItems.map((item) => {
  const promotion = itemPromotionMap.get(
    String(item.productId)
  );

  if (!promotion) {
    return {
      ...item,
      originalLineTotal: item.lineTotal,
      lineTotal: item.lineTotal,
      discountAmount: 0,
      discountPercentage: 0,
      discountedLineTotal: item.lineTotal
    };
  }

  return {
    ...item,

    // Original price BEFORE product discount
    originalLineTotal: item.lineTotal,

    // IMPORTANT:
    // lineTotal is now the ACTUAL discounted line total
    lineTotal: promotion.discountedLineTotal,

    discountAmount: promotion.discountAmount,
    discountPercentage: promotion.discountPercentage,

    discountedLineTotal: promotion.discountedLineTotal,

    discountName: promotion.discountName,
    discountType: promotion.discountType,
    discountValue: promotion.discountValue
  };
});
if (couponCode && !promotionResult.appliedCoupon) {
  return res.status(400).json({ message: 'Coupon could not be applied to this order.' });
}

const itemDiscountedSubtotal = Math.max(
  subtotal - promotionResult.storeDiscountAmount,
  0
);

const couponDiscountAmount =
  promotionResult.couponDiscountAmount || 0;

const discountedSubtotal = Math.max(
  itemDiscountedSubtotal - couponDiscountAmount,
  0
);

const tax = calculateSaleTax(
  discountedSubtotal,
  taxRatePercent
);

const total = discountedSubtotal + tax;
if (
  paymentMethod === "cash" &&
  (cashReceived == null || Number(cashReceived) < total)
) {
  return res.status(400).json({
    message: "Cash received cannot be less than the total amount."
  });
}

if (Number(cashReceived) < 0) {
  return res.status(400).json({
    message: "Invalid cash amount."
  });
}
    // 🔴 Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in sale" });
    }

    // Generate backend invoice id only after request is validated
    const invoiceId = await getNextInvoice(tenantId);

    // ======================================================
    // STEP 1: VALIDATE STOCK (NO PARTIAL SALES) — store locations only
    // ======================================================
    const storeLocationIds = await getStoreLocationIds(tenantId);
    if (!storeLocationIds.length) {
      return res.status(400).json({
        message: 'No active Store location found. Add a Store in Settings → Locations.',
      });
    }

    for (const item of items) {
      const product = await Product.findOne({
        _id: item.productId,
        tenantId,
        setupStatus: 'ready',
        status: 'active',
      });

      if (!product) {
        return res.status(404).json({
          message: `Product not available for sale (complete setup or activate): ${item.productId}`,
        });
      }

      const storeStock = await getStoreStockForProductGroup(tenantId, item.productId);

      if (storeStock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient store stock for ${product.name}. Warehouse stock must be transferred to Store first.`,
        });
      }
    }

    // ======================================================
    // STEP 2: CREATE SALE
    // ======================================================
const tenant = await Tenant.findById(tenantId).lean();
const cashier = await User.findById(req.auth.userId)
  .select("firstName lastName")
  .lean();
  const sale = await Sale.create({
    tenantId,
    invoiceId,
    items: finalEnrichedItems,
  
    subtotal: itemDiscountedSubtotal,
    storeDiscountName: (promotionResult.appliedStoreDiscounts || []).map((d) => d.name).join(', '),
    appliedStoreDiscounts: (promotionResult.appliedStoreDiscounts || []).map((d) => ({
      name: d.name,
      type: d.type,
      value: d.value,
      amount: d.amount,
      scopedBase: d.scopedBase
    })),
    storeDiscountAmount: promotionResult.storeDiscountAmount,
    couponCode: promotionResult.appliedCoupon?.code || '',
    couponDiscountAmount: promotionResult.couponDiscountAmount,
    discountTotal: promotionResult.totalDiscount,
    tax,
    total,
  
    paymentMethod,
    cashReceived,
    changeReturned,
  
    receipt: {
  
      companyName: tenant.name,
  
      slug: tenant.slug,
  
      location:
        tenant.primaryContact?.address?.city || "",
  
      phone:
        tenant.primaryContact?.phone || "",
  
      cashier:
        `${cashier?.firstName || ""} ${cashier?.lastName || ""}`.trim(),
  
      returnWindow:
        policy?.returnWindowDays || 30,
  
      exchangeWindow:
        policy?.exchangeWindowDays || 30,
      
        returnsEnabled:
  policy?.returnsEnabled ?? true,

exchangesEnabled:
  policy?.exchangesEnabled ?? true,

      policyNotes:
        policy?.policyNotes || "",

      taxLabel:
        `${policy?.taxLabel || "Tax"} (${policy?.taxRatePercent ?? 8}%)`,

      workingHours:
        policy?.workingHours || "",

      workingHoursFriday:
        policy?.workingHoursFriday || "",

      receiptFooterMessage:
        policy?.receiptFooterMessage || "",
  
        receiptMessage: `Thank you for shopping at ${tenant.name}. We are pleased to serve you and look forward to providing you with excellent service. Being a valued customer, we are committed to offering quality products at the best possible prices. Your trust and support mean a lot to us, and we hope to see you again soon.`,
  
      developedBy:
        "Stock Insights",

      storeDiscountName:
        (promotionResult.appliedStoreDiscounts || []).map((d) => d.name).join(', '),
      
      storeDiscountLabel:
        (promotionResult.appliedStoreDiscounts || [])
          .map((d) => formatPromotionLabel(d))
          .join(', '),
          
appliedStoreDiscounts:
        (promotionResult.appliedStoreDiscounts || []).map((d) => ({
          name: d.name,
          label: formatPromotionLabel(d),
          amount: d.amount
        })),

      storeDiscountAmount:
        promotionResult.storeDiscountAmount,

      couponCode:
        promotionResult.appliedCoupon?.code || '',

      couponLabel:
        formatPromotionLabel(promotionResult.appliedCoupon),

      couponDiscountAmount:
        promotionResult.couponDiscountAmount,

      discountTotal:
        promotionResult.totalDiscount
    }
  });

  if (promotionResult.appliedCoupon) {
    await Coupon.updateOne(
      { _id: promotionResult.appliedCoupon._id, tenantId },
      { $inc: { usedCount: 1 }, $set: { updatedAt: new Date() } }
    );
  }
    // ======================================================
    // STEP 3: PROCESS EACH ITEM (DEDUCT STOCK + LOG)
    // ======================================================
    const itemBatchUsages = {};

   for (const item of items) {
  const productIdsGroup = await getDuplicateProductIds(tenantId, item.productId);

  const stockRecords = await Stock.find({
  productId: { $in: productIdsGroup },
  tenantId,
  warehouseId: { $in: storeLocationIds },
  quantity: { $gt: 0 }
}).sort({ createdAt: 1 });
  const previousQuantity = stockRecords.reduce(
    (sum, s) => sum + (s.quantity || 0),
    0
  );

  const product = await Product.findOne({
    _id: item.productId,
    tenantId
  });

  // ======================================================
  // 2️⃣ FIFO BATCH DEDUCTION
  // ======================================================
 const batches = await Batch.find({
  tenantId,
  productId: { $in: productIdsGroup },
  warehouseId: { $in: storeLocationIds },
  remainingQty: { $gt: 0 }
}).sort({ receivedDate: 1 });

  let qtyToDeduct = item.quantity;
  let batchUsage = [];

  for (let batch of batches) {
    if (qtyToDeduct <= 0) break;

    const deduct = Math.min(batch.remainingQty, qtyToDeduct);

    batch.remainingQty -= deduct;
    await batch.save();

    batchUsage.push({
      batchId: batch._id,
      batchNumber: batch.batchNumber,
        warehouseId: batch.warehouseId,
      deductedQty: deduct
    });

    qtyToDeduct -= deduct;
  }

  if (qtyToDeduct > 0) {
    return res.status(400).json({
      message: `Not enough batch stock for ${product.name}`
    });
  }

  // ======================================================
  // 3️⃣ FIFO STOCK DEDUCTION
  // ======================================================
  let remainingQty = item.quantity;

for (const batch of batches) {

  if (remainingQty <= 0) break;

  const stock = await Stock.findOne({
    tenantId,
    productId: batch.productId,
    warehouseId: batch.warehouseId
  });

  if (!stock || stock.quantity <= 0) continue;

  const deductQty = Math.min(stock.quantity, remainingQty);

  stock.quantity -= deductQty;

  await stock.save();

  remainingQty -= deductQty;
}

  // ======================================================
  // 4️⃣ NEW STOCK AFTER SALE
  // ======================================================
  const newStockRecords = await Stock.find({
    productId: { $in: productIdsGroup },
    tenantId,
    warehouseId: { $in: storeLocationIds },
  });

  const newQuantity = newStockRecords.reduce(
    (sum, s) => sum + (s.quantity || 0),
    0
  );
  const io = req.app.get('io');

  await sendAlerts({
      io,
      tenantId,
      productId: item.productId,
      product,
      totalQty: newQuantity
  });
  // ======================================================
  // 5️⃣ INVENTORY LOG
  // ======================================================
for (const usage of batchUsage) {
  const activity = getInventoryActivity('sale', usage.deductedQty);

  await InventoryLog.create({
    tenantId,
    productId: item.productId,
    productName: product?.name,
    sku: product?.sku,
    type: 'sale',
    warehouseId: usage.warehouseId,
    quantity: usage.deductedQty,
    previousQuantity,
    newQuantity,
    reference: invoiceId,
    note: 'POS Sale',
    batchUsage: [usage], // only one batch
    batchNumber: usage.batchNumber,
    activityText: activity.text,
    activityIcon: activity.icon
  });
}

  itemBatchUsages[String(item.productId)] = batchUsage;
}

    const saleDoc = await Sale.findById(sale._id);
    for (const saleItem of saleDoc.items) {
      const usage = itemBatchUsages[String(saleItem.productId)];
      if (usage?.length) {
        saleItem.batchUsage = usage.map((u) => ({
          batchId: u.batchId,
          batchNumber: u.batchNumber,
          warehouseId: u.warehouseId,
          deductedQty: u.deductedQty,
          returnedQty: 0
        }));
      }
    }
    await saleDoc.save();
    const finalSale = await Sale.findById(sale._id).lean();
    return res.status(201).json({
      success: true,
      sale: finalSale
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message
    });
  }
};


// ======================================================
// ✅ GET TODAY STATS (TOTAL SALES + TRANSACTIONS)
// ======================================================
exports.getTodayStats = async (req, res) => {
  try {
    // 🔐 Tenant ID (multi-tenant system)
    const tenantId = req.auth.tenantId;

    // 🕒 Aaj ke din ka start time (00:00:00)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 🕒 Aaj ke din ka end time (23:59:59)
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 📦 Aaj ki saari sales fetch karo
    const sales = await Sale.find({
      tenantId,
      createdAt: {
        $gte: startOfDay, // >= start of day
        $lte: endOfDay    // <= end of day
      }
    });

    // 💰 Total sales calculate karo (sum of net totals after returns)
    const totalSales = sales.reduce((sum, sale) => sum + getSaleNetTotal(sale), 0);

    // 🔄 Customer return amount calculate karo
    const todayReturnAmount = sales.reduce((sum, sale) => {
      const net = getSaleNetTotal(sale);
      return sum + Math.max(0, (Number(sale.total) || 0) - net);
    }, 0);

    // 📤 Response bhejo frontend ko
    res.status(200).json({
      success: true,
      date: startOfDay.toDateString(), // optional
      totalSales,        // 💰 total earning today
      todayReturnAmount, // 🔄 customer return refund amount today
      transactions: sales.length // 📊 total number of sales
    });

  } catch (err) {
    // ❌ Error handling
    res.status(500).json({
      message: err.message
    });
  }
};

// ======================================================
// ✅ GET TODAY TRANSACTIONS COUNT ONLY
// ======================================================
exports.getTodayTransactions = async (req, res) => {
  try {
    // 🔐 Tenant ID
    const tenantId = req.auth.tenantId;

    // 🕒 Start of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 🕒 End of today
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 🔢 Count documents (fast method)
    const count = await Sale.countDocuments({
      tenantId,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    // 📤 Response
    res.status(200).json({
      success: true,
      transactions: count
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};
/**
 * ======================================================
 * ✅ GET ALL SALES (HISTORY)
 * ======================================================
 */
exports.getSales = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;

    const {
      search,
      date,
      range,
      min,
      max,
      sort
    } = req.query;

    let filter = { tenantId };

    // ======================================================
    // 📅 DATE FILTER (single day)
    // ======================================================
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      filter.createdAt = { $gte: start, $lte: end };
    }

    // ======================================================
    // ⚡ QUICK RANGE FILTER
    // ======================================================
    if (range) {
      const now = new Date();
      let start = new Date();

      if (range === 'today') {
        start.setHours(0, 0, 0, 0);
      }

      if (range === 'week') {
        start.setDate(now.getDate() - 7);
      }

      if (range === 'month') {
        start.setMonth(now.getMonth() - 1);
      }

      filter.createdAt = { $gte: start, $lte: now };
    }

    // ======================================================
    // 💰 AMOUNT FILTER
    // ======================================================
    if (min || max) {
      filter.total = {};

      if (min) filter.total.$gte = Number(min);
      if (max) filter.total.$lte = Number(max);
    }

    // ======================================================
    // 🔍 SEARCH FILTER (invoice + product name)
    // ======================================================
    let searchFilter = {};

    if (search) {
      searchFilter = {
        $or: [
          { invoiceId: { $regex: search, $options: 'i' } },
          { 'items.productName': { $regex: search, $options: 'i' } }
        ]
      };
    }

    // ======================================================
    // 🔽 SORT
    // ======================================================
    let sortOption = { createdAt: -1 };

    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

       // ======================================================
    // 📦 FETCH SALES
    // ======================================================
    const sales = await Sale.find({
      ...filter,
      ...searchFilter
    })
    .sort(sortOption)
    .lean();

    // ======================================================
    // 📤 RESPONSE
    // ======================================================
    return res.status(200).json({
      success: true,
      count: sales.length,
      sales
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};