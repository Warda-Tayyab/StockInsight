const Product = require('../models/tenant/Product');
const Stock = require('../models/tenant/Stock');
const Sale = require('../models/tenant/Sale');
const Batch = require('../models/tenant/Batch');
const Category = require('../models/tenant/Category');
const Warehouse = require('../models/tenant/Warehouse');
const Vendor = require('../models/tenant/Vendor');
const StoreDiscount = require('../models/tenant/StoreDiscount');
const Coupon = require('../models/tenant/Coupon');
const Inventory = require('../models/tenant/Inventory');
const User = require('../models/tenant/User');
const Notification = require('../models/tenant/Notification');
const WriteOff = require('../models/tenant/WriteOff');
const ReturnExchange = require('../models/tenant/ReturnExchange');
const PurchaseReturn = require('../models/tenant/PurchaseReturn');
const ReturnExchangePolicy = require('../models/tenant/ReturnExchangePolicy');
const RagQuery = require('../models/tenant/RagQuery');
const RagChatSession = require('../models/tenant/RagChatSession');
const Counter = require('../models/tenant/Counter');
const { getSaleNetTotal } = require('../utils/reportHelpers');
const {
  getPurchasedLowStockReport,
  getPurchasedStockSummary,
  buildPurchasedStockByLocation,
  classifyStockItem,
} = require('../utils/lowStockHelpers');
const { buildRagReportSnapshot, toCompactReportContext, buildExpirySummary } = require('../utils/ragReportContext');
const { MODEL_TOPIC_KEYWORDS, MODEL_TOPIC_FETCHERS } = require('../utils/ragModelContext');
const {
  normalizeQueryForProductMatch,
  scoreProductMatch,
  findMatchedLocations,
  findMatchedVendors,
  buildFocusedLocationContext,
  buildWarehouseAggregate,
  serializeRagContext,
  isExpiryQuestion,
  isStockAlertQuestion,
  isProductCatalogQuestion,
} = require('../utils/ragContextHelpers');

/**
 * Topic keywords per tenant model / domain.
 * Supports English, Urdu, and Roman Urdu phrasing.
 */
const TOPIC_KEYWORDS = {
  overview: [
    'overview', 'summary', 'dashboard', 'total', 'kitna', 'kitne', 'overall',
    'mukhtasar', 'poora hisaab', 'business status', 'system status'
  ],
  lowStock: [
    'low stock', 'running low', 'reorder', 'out of stock', 'stockout', 'stock out', 'stock out products',
    'out of stock products', 'shortage', 'kam stock', 'kam hai', 'khatam', 'mukammal nahi', 'stock kam',
    'stock khatam', 'stock khatam ho', 'khatam product', 'khatam products', 'reorder karna', 'stock alert',
    'stock kam hai', 'کم اسٹاک', 'ری آرڈر', 'دوبارہ آرڈر', 'اسٹاک ختم', 'اسٹاک کم', 'ختم اسٹاک',
    'کمی', 'اسٹاک الرٹ', 'دوبارہ حاصل کرنا'
  ],
  stock: [
    'stock level', 'stock quantity', 'available stock', 'on hand', 'inventory level',
    'stock kitna', 'stock ki miqdar', 'maujood stock', 'total stock', 'stock balance'
  ],
  sales: [
    'sales', 'revenue', 'sold', 'selling', 'quarter', 'month', 'transaction',
    'income', 'profit', 'farokht', 'farokhti', 'bechna', 'sale', 'revenue',
    'mahana', 'quarterly', 'trend', 'trends', 'aaj kitni sale', 'aaj kitna maal becha',
    'today sales', 'today sale', 'aaj ki sale', 'aaj ki sales', 'aaj sale',
    'aj ki sale', 'aj sale', "today's sales", 'invoice', 'pos', 'aaj', 'today',
    'best selling', 'best sell', 'top selling', 'top sell', 'most sold', 'zyada becha',
    'profitable', 'most profitable', 'profit wali', 'munafa wali', 'top profit', 'highest profit',
  ],
  batches: [
    'batch', 'batches', 'baches', 'bache', 'sugar batch', 'sugar baches', 'bech', 'expiry', 'expire',
    'expired', 'expiring', 'expiried', 'turnover', 'lot', 'shelf life', 'expiry date', 'khatam hone',
    'khatam ho', 'khatam ho chukay', 'expire ho', 'expire wale', 'expiring soon', 'jald expire',
    'batch number', 'batch tracking', 'expired warehouse', 'expired store', 'expiring soon warehouse',
    'expiring soon store', 'city expired', 'city expiring soon', 'انقضاء', 'تاریخ انقضا', 'بیچ', 'ایکسپائر', 'ایکسپائری', 'خارجي'
  ],
  tax: [
    'tax', 'tax rate', 'tax percent', 'tax label', 'tax kitna', 'tax percentage', 'tax details',
    'tax settings', 'tax kitna hai', 'tax gather', 'tax gathered', 'tax collected', 'kitna tax gather',
    'kitna tax mila', 'kitna tax aaya', 'total tax', 'tax kitna ikatha hua', 'tax collection', 'ٹیکس'
  ],
  coupons: [
    'coupon', 'coupons', 'promo code', 'promo', 'code', 'discount coupon', 'کوپن'
  ],
  discounts: [
    'discount', 'discounts', 'store discount', 'discount rule', 'sale discount', 'offer', 'ڈسکاؤنٹ'
  ],
  categories: [
    'category', 'categories', 'compare', 'breakdown', 'type', 'qisam', 'category wise'
  ],
  warehouses: [
    'warehouse', 'location', 'godown', 'store', 'godam', 'warehouse wise', 'branch',
    'mere warehouse', 'mera warehouse', 'godam me', 'store me', 'warehouse number',
    'warehouse phone', 'warehouse contact', 'store number', 'store phone', 'store contact',
    'godam number', 'godam contact', 'branch contact', 'contact no', 'contact number', 'phone number'
  ],
  products: [
    'product', 'products', 'sku', 'price', 'supplier', 'catalog', 'item', 'items', 'cheez',
    'product list', 'products list', 'selling price', 'cost price', 'barcode', 'old product',
    'old products', 'purana', 'purane', 'inactive', 'inactive product', 'all products',
    'product catalog', 'name', 'names', 'product name', 'products name', 'naam', 'naamo',
    'maal', 'items list', 'sab products', 'saare products', 'saray products', 'sub products',
    'har product', 'konsa product', 'konsay product', 'kis kis', 'kon kon', 'kya kya hai',
    'کون سے', 'پروڈکٹس', 'نام', 'پروڈکٹ نام', 'آئٹم', 'مال'
  ],
  inventory: [
    'movement', 'history', 'adjustment', 'stock in', 'stock out', 'received',
    'activity', 'inventory history', 'stock movement', 'transfer'
  ],
  users: [
    'user', 'users', 'staff', 'employee', 'team', 'cashier', 'manager', 'owner',
    'role', 'login', 'member', 'mulazim', 'karmchari', 'team member'
  ],
  notifications: [
    'notification', 'notifications', 'alert', 'alerts', 'unread', 'notify',
    'itla', 'khabar', 'reminder', 'stock alert notification'
  ],
  writeOffs: [
    'write off', 'writeoff', 'write-off', 'write of', 'write of products', 'write off products',
    'writeoff products', 'write-off products', 'write off list', 'write-off list', 'damaged',
    'damaged product', 'damaged products', 'damaged items', 'defective', 'defective product',
    'defective products', 'wastage', 'kharab maal', 'kharab product', 'kharab products',
    'zaya', 'zaya product', 'zaya products', 'zaya maal', 'scrap', 'destroyed'
  ],
  returnExchanges: [
    'return', 'returns', 'eturn', 'eturns', 'exchange', 'exchanges', 'refund', 'refunds',
    'wapsi', 'wapas', 'wapis', 'wapas karna', 'wapis karna', 'return product', 'return products',
    'returned product', 'returned products', 'return items', 'returned items', 'return list',
    'wapsi list', 'badal', 'badalna', 'tabdeel', 'tabdeeli', 'replacement', 'return exchange',
    'customer return'
  ],
  returnPolicy: [
    'return policy', 'exchange policy', 'return window', 'exchange window',
  'restocking fee', 'refund policy', 'policy rules', 'return rules', 'wapsi policy',
  'receipt required', 'partial return', 'return kitne din', 'kitne din tak return'
  ],
  ragQueries: [
    'previous question', 'past query', 'query history', 'asked before',
    'purana sawal', 'recent question', 'ai history'
  ],
  ragSessions: [
    'chat', 'chats', 'conversation', 'session', 'chat history', 'ai chat',
    'purani chat', 'chat list'
  ],
  counters: [
    'counter', 'sequence', 'serial number', 'batch counter', 'auto number',
    'numbering', 'seq', 'counter value'
  ],
  ...MODEL_TOPIC_KEYWORDS,
};

const matchesTopic = (question, keywords) => {
  const q = question.toLowerCase();
  return keywords.some((kw) => q.includes(kw));
};

const detectTopics = (question) => {
  const topics = new Set(['overview']);
  const q = String(question).toLowerCase();

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (topic === 'overview') continue;
    if (matchesTopic(question, keywords)) {
      topics.add(topic);
    }
  }

  if (/\b(best\s*sell|top\s*sell|most\s*profit|profitable|slow\s*mov|zyada\s*bech|munafa\s*wali)\b/i.test(q)) {
    topics.add('sales');
    topics.add('deadStock');
    topics.add('profitLoss');
  }
  if (isExpiryQuestion(q)) {
    topics.add('batches');
  }
  if (/\b(low\s*stock|out\s*of\s*stock|stock\s*out|stockout|stock\s*kam|kam\s*stock|khatam\s*stock)\b/i.test(q)) {
    topics.add('lowStock');
  }

  return [...topics];
};

const formatCurrency = (amount) => `Rs ${Number(amount || 0).toLocaleString('en-PK')}`;

const truncate = (text, max = 120) => {
  if (!text) return '';
  const value = String(text);
  return value.length <= max ? value : `${value.slice(0, max)}...`;
};

const buildLowStockContext = async (tenantId) => {
  const [summary, lowStockReport, alerts, allProducts, allStocks] = await Promise.all([
    getPurchasedStockSummary(tenantId),
    getPurchasedLowStockReport(tenantId),
    require('../utils/lowStockHelpers').getPurchasedStockAlerts(tenantId),
    Product.find({ tenantId, status: 'active' }).select('name sku reorderLevel').lean(),
    Stock.find({ tenantId }).lean(),
  ]);

  const stockMap = {};
  allStocks.forEach((s) => {
    const pid = s.productId?.toString();
    if (pid) stockMap[pid] = (stockMap[pid] || 0) + (s.quantity || 0);
  });

  const zeroStockProducts = allProducts
    .filter((p) => (stockMap[p._id.toString()] || 0) === 0)
    .map((p) => ({
      name: p.name,
      sku: p.sku,
      quantity: 0,
      reorderLevel: p.reorderLevel || 0,
    }));

  const { items: locationItems } = await buildPurchasedStockByLocation(tenantId);
  const outOfStockLocationItems = locationItems
    .map(classifyStockItem)
    .filter((item) => item.alertType === 'out-of-stock')
    .map((item) => ({
      name: item.name,
      sku: item.sku,
      quantity: item.current,
      reorderLevel: item.min,
      destination: item.destination,
    }));

  const combinedOutOfStockMap = new Map();
  zeroStockProducts.forEach((p) => combinedOutOfStockMap.set(p.name, p));
  outOfStockLocationItems.forEach((p) => combinedOutOfStockMap.set(p.name, p));

  const outOfStock = Array.from(combinedOutOfStockMap.values());

  return {
    source: 'stock_levels',
    scope: 'purchased_products_per_location',
    summary: {
      lowStockProducts: summary.lowStock,
      outOfStockProducts: outOfStock.length,
      note: 'lowStockProducts = qty>0 at/below reorder. outOfStockProducts = qty=0.',
    },
    lowStock: lowStockReport.items.slice(0, 15),
    outOfStock,
    outOfStockProductsList: outOfStock,
    locations: lowStockReport.locations,
    alerts: alerts.alerts.slice(0, 12).map((a) => ({
      type: a.type,
      destination: a.destination,
      quantity: a.quantity,
      severity: a.severity,
    })),
  };
};

const buildStockContext = async (tenantId) => {
  const stocks = await Stock.find({ tenantId })
    .populate('productId', 'name sku unit status')
    .populate('warehouseId', 'name code')
    .lean();

  const totalUnits = stocks.reduce((sum, row) => sum + (row.quantity || 0), 0);
  const inStockRows = stocks.filter((row) => (row.quantity || 0) > 0);

  const warehouseTotals = {};
  inStockRows.forEach((row) => {
    const whId = row.warehouseId?._id?.toString() || 'unknown';
    if (!warehouseTotals[whId]) {
      warehouseTotals[whId] = {
        warehouse: row.warehouseId?.name || 'Unknown',
        code: row.warehouseId?.code || '',
        totalUnits: 0,
        productLines: 0
      };
    }
    warehouseTotals[whId].totalUnits += row.quantity || 0;
    warehouseTotals[whId].productLines += 1;
  });

  const topStockLines = [...inStockRows]
    .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
    .slice(0, 15)
    .map((row) => ({
      product: row.productId?.name || 'Unknown',
      sku: row.productId?.sku || '',
      warehouse: row.warehouseId?.name || 'Unknown',
      quantity: row.quantity || 0,
      unit: row.productId?.unit || ''
    }));

  return {
    source: 'stock',
    summary: {
      totalStockLines: stocks.length,
      linesWithStock: inStockRows.length,
      totalUnits,
      warehousesWithStock: Object.keys(warehouseTotals).length
    },
    warehouseTotals: Object.values(warehouseTotals)
      .sort((a, b) => b.totalUnits - a.totalUnits)
      .slice(0, 10),
    topStockLines
  };
};

const startOfLocalDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfLocalDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const buildSalesContext = async (tenantId) => {
  const now = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(now.getMonth() - 3);
  const todayStart = startOfLocalDay(now);
  const todayEnd = endOfLocalDay(now);

  let [sales, todaySales] = await Promise.all([
    Sale.find({
      tenantId,
      createdAt: { $gte: threeMonthsAgo }
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
    Sale.find({
      tenantId,
      createdAt: { $gte: todayStart, $lte: todayEnd }
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
  ]);

  let periodLabel = 'Last 3 months';
  let fallbackApplied = false;

  if (!sales.length) {
    sales = await Sale.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    if (sales.length) {
      periodLabel = 'Lifetime (fallback)';
      fallbackApplied = true;
    }
  }

  const monthlyTotals = {};
  const productSales = {};

  sales.forEach((sale) => {
    const monthKey = new Date(sale.createdAt).toLocaleString('en-US', {
      month: 'short',
      year: 'numeric'
    });

    if (!monthlyTotals[monthKey]) {
      monthlyTotals[monthKey] = { revenue: 0, transactions: 0 };
    }

    monthlyTotals[monthKey].revenue += getSaleNetTotal(sale);
    monthlyTotals[monthKey].transactions += 1;

    (sale.items || []).forEach((item) => {
      const key = item.productName || 'Unknown';
      if (!productSales[key]) {
        productSales[key] = { quantity: 0, revenue: 0 };
      }
      const remainingQty = Math.max(0, (item.quantity || 0) - (item.returnedQty || 0));
      productSales[key].quantity += remainingQty;
      productSales[key].revenue += (item.unitPrice || 0) * remainingQty;
    });
  });

  const soldProductsList = Object.entries(productSales)
    .map(([name, data]) => ({ name, quantitySold: data.quantity, revenue: formatCurrency(data.revenue) }))
    .sort((a, b) => b.quantitySold - a.quantitySold);

  const topProducts = soldProductsList.slice(0, 10);

  const totalRevenue = sales.reduce((sum, sale) => sum + getSaleNetTotal(sale), 0);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + getSaleNetTotal(sale), 0);
  const todayItemsSold = todaySales.reduce(
    (sum, s) => sum + (s.items || []).reduce((n, item) => n + (item.quantity || 0), 0),
    0
  );

  return {
    source: 'sales_db',
    today: {
      date: todayStart.toISOString().slice(0, 10),
      totalTransactions: todaySales.length,
      totalRevenue: formatCurrency(todayRevenue),
      itemsSold: todayItemsSold,
      invoices: todaySales.slice(0, 8).map((sale) => ({
        invoiceId: sale.invoiceId,
        time: sale.createdAt,
          total: formatCurrency(getSaleNetTotal(sale)),
        items: (sale.items || []).slice(0, 5).map((item) => ({
          product: item.productName,
          qty: Math.max(0, (item.quantity || 0) - (item.returnedQty || 0)),
          lineTotal: formatCurrency((item.unitPrice || 0) * Math.max(0, (item.quantity || 0) - (item.returnedQty || 0)))
        })),
        paymentMethod: sale.paymentMethod
      }))
    },
    summary: {
      period: periodLabel,
      fallbackApplied,
      totalTransactions: sales.length,
      totalRevenue: formatCurrency(totalRevenue),
      averageOrderValue: sales.length
        ? formatCurrency(totalRevenue / sales.length)
        : formatCurrency(0),
      totalUniqueSoldProducts: soldProductsList.length
    },
    monthlyBreakdown: monthlyTotals,
    topSellingProducts: topProducts,
    soldProductsList: soldProductsList.slice(0, 30),
    recentSales: sales.slice(0, 5).map((sale) => ({
      invoiceId: sale.invoiceId,
      date: sale.createdAt,
      total: formatCurrency(getSaleNetTotal(sale)),
      items: (sale.items || []).length,
      paymentMethod: sale.paymentMethod
    }))
  };
};

const buildBatchContext = async (tenantId) => {
  const [expiry, allBatches] = await Promise.all([
    buildExpirySummary(tenantId),
    Batch.find({ tenantId, remainingQty: { $gt: 0 } })
      .populate('productId', 'name sku sellingPrice costPrice')
      .populate('warehouseId', 'name locationType code')
      .sort({ expiryDate: 1 })
      .lean()
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeBatchesList = (allBatches || []).map((b) => {
    const expDate = b.expiryDate ? new Date(b.expiryDate) : null;
    let status = 'Valid';
    let daysLeft = null;
    if (expDate) {
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      daysLeft = diffDays;
      if (diffDays <= 0) status = 'Expired';
      else if (diffDays <= 180) status = 'Expiring Soon';
    }

    const locName = b.warehouseId?.name || 'Unknown Location';
    const locType = b.warehouseId?.locationType || 'store';
    const destination = `${locName} (${locType})`;
    const unitCost = Number(b.productId?.costPrice) || 0;
    const unitSelling = Number(b.productId?.sellingPrice) || 0;
    const remainingQty = b.remainingQty || 0;

    return {
      batchNumber: b.batchNumber,
      productName: b.productId?.name || 'Unknown Product',
      sku: b.productId?.sku || '—',
      warehouseName: locName,
      locationType: locType,
      destination,
      remainingQty,
      costPrice: `Rs ${unitCost}`,
      sellingPrice: `Rs ${unitSelling}`,
      totalCostValue: `Rs ${Math.round(remainingQty * unitCost)}`,
      totalSellingValue: `Rs ${Math.round(remainingQty * unitSelling)}`,
      expiryDate: b.expiryDate ? new Date(b.expiryDate).toISOString().split('T')[0] : 'No Expiry Date',
      daysLeft,
      status
    };
  });

  return {
    source: 'batches',
    summary: {
      totalActiveBatches: activeBatchesList.length,
      expiredProductCount: expiry.expiredProductCount,
      expiringSoonProductCount: expiry.expiringSoonProductCount,
      expiredBatchCount: expiry.expiredBatchCount,
      expiringSoonBatchCount: expiry.expiringSoonBatchCount,
      expiredTotalCostValue: expiry.expiredTotalCostValue,
      expiredTotalSellingValue: expiry.expiredTotalSellingValue,
      expiringSoonTotalCostValue: expiry.expiringSoonTotalCostValue,
      expiringSoonTotalSellingValue: expiry.expiringSoonTotalSellingValue,
      storeTotals: expiry.storeTotals,
      warehouseTotals: expiry.warehouseTotals,
      note: 'storeTotals and warehouseTotals provide separate totals for Stores vs Warehouses/Godowns. Check locationExpiryBreakdown for per-location amounts.',
    },
    storeTotals: expiry.storeTotals,
    warehouseTotals: expiry.warehouseTotals,
    byLocation: expiry.byLocation,
    locationExpiryBreakdown: expiry.byLocation,
    allActiveBatches: activeBatchesList.slice(0, 40),
    expiredBatches: expiry.expiredBatches.slice(0, 30),
    expiringSoonBatches: expiry.expiringSoonBatches.slice(0, 30),
    expiredProductsList: expiry.expiredProductsList.slice(0, 30),
    expiringSoonProductsList: expiry.expiringSoonProductsList.slice(0, 30),
  };
};

const buildCategoryContext = async (tenantId) => {
  const categories = await Category.find({ tenantId, status: 'active' }).lean();
  const products = await Product.find({ tenantId, status: 'active' })
    .select('name sku categoryId costPrice sellingPrice reorderLevel')
    .lean();

  const stocks = await Stock.find({ tenantId }).lean();
  const stockByProduct = {};

  stocks.forEach((s) => {
    const pid = s.productId.toString();
    stockByProduct[pid] = (stockByProduct[pid] || 0) + (s.quantity || 0);
  });

  const categoryMap = {};
  categories.forEach((c) => {
    categoryMap[c._id.toString()] = {
      name: c.name,
      productCount: 0,
      totalStock: 0,
      products: []
    };
  });

  products.forEach((p) => {
    const catId = p.categoryId?.toString();
    if (!catId || !categoryMap[catId]) return;

    const qty = stockByProduct[p._id.toString()] || 0;
    categoryMap[catId].productCount += 1;
    categoryMap[catId].totalStock += qty;
    categoryMap[catId].products.push({
      name: p.name,
      sku: p.sku,
      stock: qty,
      sellingPrice: p.sellingPrice
    });
  });

  return {
    source: 'categories',
    categories: Object.values(categoryMap).map((c) => ({
      name: c.name,
      productCount: c.productCount,
      totalStock: c.totalStock,
      topProducts: c.products.sort((a, b) => b.stock - a.stock).slice(0, 5)
    }))
  };
};

const buildWarehouseContext = async (tenantId) => {
  const warehouses = await Warehouse.find({ tenantId, isDeleted: false, status: 'active' })
    .populate('manager', 'firstName lastName email phone')
    .lean();
  const stocks = await Stock.find({ tenantId })
    .populate('productId', 'name sku')
    .lean();

  const warehouseStats = warehouses.map((wh) => {
    const whStocks = stocks.filter(
      (s) => s.warehouseId?.toString() === wh._id.toString()
    );

    const totalUnits = whStocks.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const productCount = whStocks.filter((s) => s.quantity > 0).length;
    const mgrName = wh.manager
      ? [wh.manager.firstName, wh.manager.lastName].filter(Boolean).join(' ').trim()
      : '—';

    return {
      name: wh.name,
      code: wh.code,
      locationType: wh.locationType || 'store',
      contactPerson: wh.contactPerson || '—',
      phone: wh.phone || '—',
      email: wh.email || '—',
      address: wh.address || '—',
      city: wh.city || '—',
      manager: mgrName,
      totalUnits,
      productsInStock: productCount,
      topItems: whStocks
        .filter((s) => s.quantity > 0)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
        .map((s) => ({
          product: s.productId?.name,
          sku: s.productId?.sku,
          quantity: s.quantity
        }))
    };
  });

  return {
    source: 'warehouses',
    warehouses: warehouseStats
  };
};


/**
 * Find products the question is actually asking about by name/SKU/barcode,
 * regardless of whether they'd fall inside a generic "top 25 / top 15" slice.
 * This fixes wrong answers where a specific product wasn't in the recent/top-N
 * list built by the topic fetchers below.
 */
const findMatchedProducts = async (tenantId, question) => {
  const rawQuery = String(question || '').toLowerCase();
  const normalizedQuery = normalizeQueryForProductMatch(question);
  if (rawQuery.trim().length < 2 && normalizedQuery.length < 2) return [];

  const allProducts = await Product.find({ tenantId })
    .select('name sku barcode status')
    .lean();

  const scored = allProducts
    .map((p) => ({ product: p, score: scoreProductMatch(p, rawQuery, normalizedQuery) }))
    .filter((row) => row.score >= 50)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return scored.map((row) => row.product._id);
};

/**
 * Build exact, complete data for the specific product(s) the question named —
 * not a top-N slice. This is what the AI should treat as authoritative when
 * the user asks about a named product.
 */
const buildMatchedProductContext = async (tenantId, productIds, question = '') => {
  if (!productIds.length) return null;

  const includeDepleted = /\ball\b/i.test(String(question));
  const batchFilter = includeDepleted
    ? { tenantId, productId: { $in: productIds } }
    : { tenantId, productId: { $in: productIds }, remainingQty: { $gt: 0 } };

  const [products, stocks, batches] = await Promise.all([
    Product.find({ tenantId, _id: { $in: productIds } })
      .populate('categoryId', 'name')
      .lean(),
    Stock.find({ tenantId, productId: { $in: productIds } })
      .populate('warehouseId', 'name')
      .lean(),
    Batch.find(batchFilter)
      .populate('warehouseId', 'name')
      .sort({ expiryDate: 1 })
      .lean()
  ]);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  let sales = await Sale.find({
    tenantId,
    createdAt: { $gte: ninetyDaysAgo },
    'items.productId': { $in: productIds }
  })
    .sort({ createdAt: -1 })
    .limit(200)
    .select('items createdAt')
    .lean();

  let salesPeriodUsed = '90_days';
  let salesFallbackApplied = false;

  if (!sales.length) {
    sales = await Sale.find({
      tenantId,
      'items.productId': { $in: productIds }
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .select('items createdAt')
      .lean();
    if (sales.length) {
      salesPeriodUsed = 'lifetime';
      salesFallbackApplied = true;
    }
  }

  return products.map((p) => {
    const pid = p._id.toString();

    const stockRows = stocks.filter((s) => s.productId?.toString() === pid);
    const totalStock = stockRows.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const stockByWarehouse = stockRows.map((s) => ({
      warehouse: s.warehouseId?.name || 'Unknown',
      quantity: s.quantity || 0
    }));

    const productBatches = batches
      .filter((b) => b.productId?.toString() === pid)
      .map((b) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sixMonthsLater = new Date(today);
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
        const expiry = b.expiryDate ? new Date(b.expiryDate) : null;
        let daysLeft = null;
        let status = 'Valid';
        if (expiry) {
          expiry.setHours(0, 0, 0, 0);
          daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 0) status = 'Expired';
          else if (daysLeft <= 180) status = 'Expiring Soon';
        }

        return {
          batchNumber: b.batchNumber,
          warehouse: b.warehouseId?.name || 'Unknown',
          locationType: b.warehouseId?.locationType || 'store',
          remainingQty: b.remainingQty || 0,
          costPrice: `Rs ${Number(p.costPrice || 0)}`,
          sellingPrice: `Rs ${Number(p.sellingPrice || 0)}`,
          expiryDate: b.expiryDate ? new Date(b.expiryDate).toISOString().split('T')[0] : null,
          daysLeft,
          status,
          isExpired: expiry ? expiry < today : false,
          isExpiringSoon: expiry ? expiry >= today && expiry <= sixMonthsLater : false
        };
      });

    let recentQtySold = 0;
    let recentRevenue = 0;
    let lastSoldAt = null;

    sales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        if (item.productId?.toString() !== pid) return;
        recentQtySold += item.quantity || 0;
        recentRevenue += item.lineTotal || 0;
        if (!lastSoldAt || new Date(sale.createdAt) > new Date(lastSoldAt)) {
          lastSoldAt = sale.createdAt;
        }
      });
    });

    return {
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || null,
      status: p.status || 'active',
      category: p.categoryId?.name || 'Uncategorized',
      unit: p.unit,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      reorderLevel: p.reorderLevel,
      supplier: p.supplierName,
      totalStock,
      stockByWarehouse,
      activeBatches: productBatches,
      salesSummary: {
        periodUsed: salesPeriodUsed,
        fallbackApplied: salesFallbackApplied,
        quantitySold: recentQtySold,
        revenue: formatCurrency(recentRevenue),
        lastSoldAt
      }
    };
  });
};

const buildProductContext = async (tenantId) => {
  const [products, stocks, batches] = await Promise.all([
    Product.find({ tenantId })
      .populate('categoryId', 'name')
      .sort({ name: 1 })
      .limit(200)
      .lean(),
    Stock.find({ tenantId }).lean(),
    Batch.find({ tenantId, remainingQty: { $gt: 0 } })
      .populate('warehouseId', 'name locationType')
      .sort({ expiryDate: 1 })
      .lean()
  ]);

  const stockByProduct = {};
  stocks.forEach((s) => {
    const pid = s.productId?.toString();
    if (pid) stockByProduct[pid] = (stockByProduct[pid] || 0) + (s.quantity || 0);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const batchesByProduct = {};
  batches.forEach((b) => {
    const pid = b.productId?.toString();
    if (!pid) return;
    if (!batchesByProduct[pid]) batchesByProduct[pid] = [];

    const expDate = b.expiryDate ? new Date(b.expiryDate) : null;
    let status = 'Valid';
    let daysLeft = null;
    if (expDate) {
      expDate.setHours(0, 0, 0, 0);
      const diff = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      daysLeft = diff;
      if (diff <= 0) status = 'Expired';
      else if (diff <= 180) status = 'Expiring Soon';
    }

    batchesByProduct[pid].push({
      batchNumber: b.batchNumber,
      warehouse: b.warehouseId?.name || 'Unknown',
      locationType: b.warehouseId?.locationType || 'store',
      remainingQty: b.remainingQty || 0,
      expiryDate: b.expiryDate ? new Date(b.expiryDate).toISOString().split('T')[0] : 'No Expiry Date',
      daysLeft,
      status
    });
  });

  const mapped = products.map((p) => {
    const pid = p._id.toString();
    return {
      name: p.name,
      sku: p.sku,
      status: p.status || 'active',
      category: p.categoryId?.name || 'Uncategorized',
      stock: stockByProduct[pid] || 0,
      reorderLevel: p.reorderLevel,
      costPrice: p.costPrice ? `Rs ${p.costPrice}` : undefined,
      sellingPrice: p.sellingPrice ? `Rs ${p.sellingPrice}` : undefined,
      unit: p.unit,
      supplier: p.supplierName,
      activeBatches: batchesByProduct[pid] || [],
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    };
  });

  const active = mapped.filter((p) => p.status === 'active');
  const inactive = mapped.filter((p) => p.status !== 'active');

  return {
    source: 'products',
    summary: {
      totalListed: mapped.length,
      active: active.length,
      inactiveOrOld: inactive.length
    },
    products: mapped,
    inactiveOrOldProducts: inactive
  };
};

const buildInventoryContext = async (tenantId) => {
  const movements = await Inventory.find({ tenantId })
    .sort({ createdAt: -1 })
    .limit(15)
    .lean();

  return {
    source: 'inventory_movements',
    recentMovements: movements.map((m) => ({
      product: m.productName,
      sku: m.sku,
      type: m.type,
      quantity: m.quantity,
      previousQuantity: m.previousQuantity,
      newQuantity: m.newQuantity,
      note: m.note,
      date: m.createdAt
    }))
  };
};

const buildUserContext = async (tenantId) => {
  const users = await User.find({ tenantId })
    .select('firstName lastName email role status lastLoginAt createdAt')
    .sort({ updatedAt: -1 })
    .limit(25)
    .lean();

  const roleCounts = { owner: 0, manager: 0, cashier: 0, staff: 0 };
  const statusCounts = { active: 0, invited: 0, suspended: 0 };

  users.forEach((user) => {
    if (roleCounts[user.role] !== undefined) roleCounts[user.role] += 1;
    if (statusCounts[user.status] !== undefined) statusCounts[user.status] += 1;
  });

  return {
    source: 'users',
    summary: {
      totalUsers: users.length,
      roleCounts,
      statusCounts
    },
    users: users.map((user) => ({
      name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      joinedAt: user.createdAt
    }))
  };
};

const buildNotificationContext = async (tenantId) => {
  const notifications = await Notification.find({ tenantId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const typeCounts = {};

  notifications.forEach((n) => {
    typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
  });

  return {
    source: 'notifications',
    summary: {
      recentCount: notifications.length,
      unreadCount,
      typeCounts
    },
    recentNotifications: notifications.map((n) => ({
      type: n.type,
      title: n.title,
      message: n.message,
      priority: n.priority,
      isRead: n.isRead,
      date: n.createdAt
    }))
  };
};

const buildWriteOffContext = async (tenantId) => {
  const writeOffs = await WriteOff.find({ tenantId })
    .populate('productId', 'name sku costPrice')
    .sort({ createdAt: -1 })
    .limit(25)
    .lean();

  const totalValue = writeOffs.reduce((sum, row) => sum + (row.lineValue || (row.unitValue || 0) * row.quantity), 0);
  const conditionCounts = { damaged: 0, defective: 0 };

  const writeOffProductsMap = new Map();

  writeOffs.forEach((row) => {
    if (conditionCounts[row.condition] !== undefined) {
      conditionCounts[row.condition] += 1;
    }
    const name = row.productName || row.productId?.name || 'Unknown Item';
    if (!writeOffProductsMap.has(name)) {
      writeOffProductsMap.set(name, {
        productName: name,
        sku: row.productId?.sku || row.sku || '',
        quantity: 0,
        totalValue: 0,
        conditions: new Set(),
      });
    }
    const item = writeOffProductsMap.get(name);
    item.quantity += row.quantity || 1;
    item.totalValue += row.lineValue || (row.unitValue || 0) * (row.quantity || 1);
    if (row.condition) item.conditions.add(row.condition);
    if (row.reason) item.conditions.add(row.reason);
  });

  const writeOffProductsList = Array.from(writeOffProductsMap.values()).map((item) => ({
    name: item.productName,
    productName: item.productName,
    sku: item.sku,
    quantity: item.quantity,
    totalValue: formatCurrency(item.totalValue),
    conditions: Array.from(item.conditions).filter(Boolean).join(', '),
  }));

  return {
    source: 'write_offs',
    summary: {
      writeOffRecordsCount: writeOffs.length,
      totalLineValue: formatCurrency(totalValue),
      conditionCounts,
      writeOffProductsCount: writeOffProductsList.length,
    },
    writeOffProductNames: Array.from(writeOffProductsMap.keys()),
    writeOffProductsList,
    recentWriteOffs: writeOffs.map((row) => ({
      referenceId: row.referenceId,
      name: row.productName || row.productId?.name || 'Unknown Item',
      productName: row.productName || row.productId?.name || 'Unknown Item',
      sku: row.productId?.sku || '',
      quantity: row.quantity,
      condition: row.condition,
      reason: row.reason || '',
      lineValue: formatCurrency(row.lineValue || (row.unitValue || 0) * row.quantity),
      date: row.createdAt,
    })),
  };
};

const buildReturnExchangeContext = async (tenantId) => {
  const [records, purchaseReturns] = await Promise.all([
    ReturnExchange.find({ tenantId }).sort({ createdAt: -1 }).limit(25).lean(),
    PurchaseReturn.find({ tenantId }).sort({ returnDate: -1, createdAt: -1 }).limit(25).lean()
  ]);

  const typeCounts = { return: 0, exchange: 0 };
  let totalRefunds = 0;
  let totalCollected = 0;
  const returnedProductsList = [];

  records.forEach((row) => {
    if (typeCounts[row.type] !== undefined) typeCounts[row.type] += 1;
    totalRefunds += row.refundAmount || 0;
    totalCollected += row.amountCollected || 0;
    (row.returnedItems || []).forEach((item) => {
      returnedProductsList.push({
        productName: item.productName || 'Unknown Item',
        quantity: item.quantity || 1,
        reason: item.reason || '',
        condition: item.condition || 'sellable',
        refund: formatCurrency(item.lineTotal || ((item.unitPrice || 0) * item.quantity))
      });
    });
  });

  const vendorReturnedProducts = [];
  let vendorReturnTotalAmount = 0;

  purchaseReturns.forEach((pr) => {
    vendorReturnTotalAmount += pr.totalAmount || 0;
    (pr.items || []).forEach((item) => {
      vendorReturnedProducts.push({
        returnNumber: pr.returnNumber,
        productName: item.productName || 'Unknown Item',
        quantity: item.quantity || 1,
        unitPrice: formatCurrency(item.unitPrice || 0),
        lineTotal: formatCurrency(item.totalPrice || ((item.unitPrice || 0) * item.quantity)),
        reason: item.reason || pr.reason || '',
        date: pr.returnDate || pr.createdAt
      });
    });
  });

  return {
    source: 'return_exchanges',
    summary: {
      customerReturnCount: records.length,
      customerReturnRefunds: formatCurrency(totalRefunds),
      customerReturnedItemsCount: returnedProductsList.length,
      vendorPurchaseReturnCount: purchaseReturns.length,
      vendorPurchaseReturnAmount: formatCurrency(vendorReturnTotalAmount),
      vendorReturnedItemsCount: vendorReturnedProducts.length
    },
    returnedProductsList: returnedProductsList.slice(0, 20),
    customerReturnedProductsList: returnedProductsList.slice(0, 20),
    vendorReturnedProducts: vendorReturnedProducts.slice(0, 20),
    recentRecords: records.map((row) => ({
      referenceId: row.referenceId,
      type: row.type,
      status: row.status,
      originalInvoiceId: row.originalInvoiceId,
      returnedItems: (row.returnedItems || []).map((item) => ({
        productName: item.productName || 'Unknown Item',
        quantity: item.quantity || 1,
        reason: item.reason || '',
        condition: item.condition || 'sellable'
      })),
      exchangeItems: (row.exchangeItems || []).map((item) => ({
        productName: item.productName || 'Unknown Item',
        quantity: item.quantity || 1
      })),
      refundAmount: formatCurrency(row.refundAmount),
      amountCollected: formatCurrency(row.amountCollected),
      settlementType: row.settlementType,
      date: row.createdAt
    })),
    recentPurchaseReturns: purchaseReturns.slice(0, 10).map((pr) => ({
      returnNumber: pr.returnNumber,
      status: pr.status,
      totalAmount: formatCurrency(pr.totalAmount),
      itemCount: (pr.items || []).length,
      date: pr.returnDate || pr.createdAt
    }))
  };
};

const buildTaxContext = async (tenantId) => {
  const [policy, reportSnapshot] = await Promise.all([
    ReturnExchangePolicy.findOne({ tenantId }).lean(),
    buildRagReportSnapshot(tenantId, 'tax')
  ]);
  const totalTaxGathered = reportSnapshot.answerKey?.totalTaxGathered || 'Rs 0';

  return {
    source: 'tax_settings',
    summary: {
      taxRatePercent: policy?.taxRatePercent ?? 8,
      taxLabel: policy?.taxLabel || 'Tax',
      taxRate: `${policy?.taxRatePercent ?? 8}%`,
      taxFormatted: `Tax Rate is ${policy?.taxRatePercent ?? 8}% (${policy?.taxLabel || 'Tax'})`,
      totalTaxGathered,
      taxCollected: totalTaxGathered,
    },
    policy: policy ? {
      taxRatePercent: policy.taxRatePercent,
      taxLabel: policy.taxLabel,
      taxRate: `${policy.taxRatePercent}%`
    } : null
  };
};

const buildReturnPolicyContext = async (tenantId) => {
  const policy = await ReturnExchangePolicy.findOne({ tenantId }).lean();

  if (!policy) {
    return {
      source: 'return_policy',
      summary: { configured: false },
      policy: null
    };
  }

  return {
    source: 'return_policy',
    summary: {
      configured: true,
      returnsEnabled: policy.returnsEnabled,
      exchangesEnabled: policy.exchangesEnabled,
      taxRatePercent: policy.taxRatePercent,
      taxLabel: policy.taxLabel
    },
    policy: {
      returnWindowDays: policy.returnWindowDays,
      exchangeWindowDays: policy.exchangeWindowDays,
      requireReceipt: policy.requireReceipt,
      allowPartialReturn: policy.allowPartialReturn,
      restockingFeePercent: policy.restockingFeePercent,
      refundMethods: policy.refundMethods,
      collectionMethods: policy.collectionMethods,
      defaultRefundMethod: policy.defaultRefundMethod,
      defaultCollectionMethod: policy.defaultCollectionMethod,
      exchangePricePolicy: policy.exchangePricePolicy,
      allowedReasons: policy.allowedReasons,
      autoWriteOffReasons: policy.autoWriteOffReasons,
      taxRatePercent: policy.taxRatePercent,
      taxLabel: policy.taxLabel,
      taxRate: `${policy.taxRatePercent}%`,
      policyNotes: policy.policyNotes
    }
  };
};

const buildRagQueryContext = async (tenantId) => {
  const queries = await RagQuery.find({ tenantId })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('question response sources createdAt')
    .lean();

  return {
    source: 'rag_queries',
    summary: {
      recentCount: queries.length
    },
    recentQueries: queries.map((row) => ({
      question: truncate(row.question, 160),
      responsePreview: truncate(row.response, 180),
      sources: row.sources || [],
      date: row.createdAt
    }))
  };
};

const buildRagSessionContext = async (tenantId) => {
  const sessions = await RagChatSession.find({ tenantId })
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('title messageCount createdAt updatedAt')
    .lean();

  const totalMessages = sessions.reduce((sum, row) => sum + (row.messageCount || 0), 0);

  return {
    source: 'rag_sessions',
    summary: {
      recentSessions: sessions.length,
      totalMessagesInRecentSessions: totalMessages
    },
    sessions: sessions.map((row) => ({
      title: row.title,
      messageCount: row.messageCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }))
  };
};

const buildCounterContext = async (tenantId) => {
  const counters = await Counter.find({ tenantId })
    .sort({ seq: -1 })
    .limit(20)
    .lean();

  const batchCounters = counters.filter((row) => row.type === 'batch');

  return {
    source: 'counters',
    summary: {
      totalCounters: counters.length,
      batchCounters: batchCounters.length
    },
    counters: counters.map((row) => ({
      name: row.name,
      type: row.type,
      productId: row.productId,
      seq: row.seq
    }))
  };
};

const buildOverviewContext = async (tenantId) => {
  const today = new Date();
  const sixMonthsLater = new Date(today);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

  const [
    productCount,
    warehouseCount,
    saleCount,
    batchCount,
    categoryCount,
    stockLineCount,
    inventoryMovementCount,
    userCount,
    notificationCount,
    writeOffCount,
    returnExchangeCount,
    ragQueryCount,
    ragSessionCount,
    counterCount,
    expiredBatchesCount,
    expiringSoonBatchesCount
  ] = await Promise.all([
    Product.countDocuments({ tenantId, status: 'active' }),
    Warehouse.countDocuments({ tenantId, isDeleted: false, status: 'active' }),
    Sale.countDocuments({ tenantId }),
    Batch.countDocuments({ tenantId, remainingQty: { $gt: 0 } }),
    Category.countDocuments({ tenantId, status: 'active' }),
    Stock.countDocuments({ tenantId }),
    Inventory.countDocuments({ tenantId }),
    User.countDocuments({ tenantId }),
    Notification.countDocuments({ tenantId }),
    WriteOff.countDocuments({ tenantId }),
    ReturnExchange.countDocuments({ tenantId }),
    RagQuery.countDocuments({ tenantId }),
    RagChatSession.countDocuments({ tenantId }),
    Counter.countDocuments({ tenantId }),
    Batch.countDocuments({ tenantId, remainingQty: { $gt: 0 }, expiryDate: { $lt: today } }),
    Batch.countDocuments({ tenantId, remainingQty: { $gt: 0 }, expiryDate: { $gte: today, $lte: sixMonthsLater } })
  ]);

  const sales = await Sale.find({ tenantId }).select('total').lean();
  const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);

  const lowStockData = await buildLowStockContext(tenantId);
  const returnPolicy = await ReturnExchangePolicy.findOne({ tenantId })
    .select('returnsEnabled exchangesEnabled returnWindowDays exchangeWindowDays')
    .lean();

  return {
    source: 'inventory_overview',
    summary: {
      activeProducts: productCount,
      activeCategories: categoryCount,
      activeWarehouses: warehouseCount,
      stockLines: stockLineCount,
      totalSalesTransactions: saleCount,
      totalRevenue: formatCurrency(totalRevenue),
      activeBatches: batchCount,
      alreadyExpiredBatches: expiredBatchesCount,
      expiringSoonBatches: expiringSoonBatchesCount,
      totalExpiryAlerts: expiredBatchesCount + expiringSoonBatchesCount,
      inventoryMovements: inventoryMovementCount,
      users: userCount,
      notifications: notificationCount,
      writeOffs: writeOffCount,
      returnExchanges: returnExchangeCount,
      ragQueries: ragQueryCount,
      ragSessions: ragSessionCount,
      counters: counterCount,
      lowStockProducts: lowStockData.summary.lowStockCount,
      outOfStockProducts: lowStockData.summary.outOfStockCount,
      returnPolicyConfigured: Boolean(returnPolicy),
      returnsEnabled: returnPolicy?.returnsEnabled ?? null,
      exchangesEnabled: returnPolicy?.exchangesEnabled ?? null
    }
  };
};

const buildProfitLossContext = async (tenantId, question = '') => {
  const snapshot = await buildRagReportSnapshot(tenantId, question);
  return { source: 'profit_loss', answerKey: snapshot.answerKey, financials: snapshot.financials, lossBreakdown: snapshot.lossBreakdown, todayLoss: snapshot.todayLoss };
};

const buildDeadStockContext = async (tenantId, question = '') => {
  const snapshot = await buildRagReportSnapshot(tenantId, question);
  return {
    source: 'product_performance',
    deadStockCount: snapshot.productPerformance?.deadStockCount,
    deadStock: snapshot.productPerformance?.deadStock || [],
    bestSelling: snapshot.productPerformance?.bestSelling || [],
    mostProfitable: snapshot.productPerformance?.mostProfitable || [],
    slowMoving: snapshot.productPerformance?.slowMoving || [],
    period: snapshot.period,
    note: 'bestSelling = by qty sold; mostProfitable = by profit Rs. Use full arrays for list questions.',
  };
};

/** One fetcher per topic; covers all models under models/tenant/. */
const TOPIC_FETCHERS = {
  overview: (tenantId, question) => buildRagReportSnapshot(tenantId, question).then((s) => ({
    source: 'inventory_overview',
    answerKey: s.answerKey,
    financials: s.financials,
    inventory: s.inventory,
    expiry: { expiredProducts: s.answerKey.expiredProducts, expiringSoonProducts: s.answerKey.expiringSoonProducts },
    locationBreakdown: s.locationBreakdown,
  })),
  lowStock: buildLowStockContext,
  stock: buildStockContext,
  sales: buildSalesContext,
  batches: buildBatchContext,
  categories: buildCategoryContext,
  warehouses: buildWarehouseContext,
  products: buildProductContext,
  inventory: buildInventoryContext,
  users: buildUserContext,
  notifications: buildNotificationContext,
  writeOffs: buildWriteOffContext,
  returnExchanges: buildReturnExchangeContext,
  returnPolicy: buildReturnPolicyContext,
  tax: buildTaxContext,
  ragQueries: buildRagQueryContext,
  ragSessions: buildRagSessionContext,
  counters: buildCounterContext,
  profitLoss: buildProfitLossContext,
  deadStock: buildDeadStockContext,
  ...MODEL_TOPIC_FETCHERS,
};

const collectSourcesFromData = (data) => {
  const sources = new Set();
  if (!data) return sources;

  if (data.source) sources.add(data.source);

  if (Array.isArray(data.categories)) sources.add('categories');
  if (Array.isArray(data.warehouses)) sources.add('warehouses');
  if (Array.isArray(data.products)) sources.add('products');
  if (data.recentMovements) sources.add('inventory_movements');
  if (Array.isArray(data.users)) sources.add('users');
  if (data.recentNotifications) sources.add('notifications');
  if (data.recentWriteOffs) sources.add('write_offs');
  if (data.recentRecords) sources.add('return_exchanges');
  if (data.policy) sources.add('return_policy');
  if (data.recentQueries) sources.add('rag_queries');
  if (Array.isArray(data.sessions)) sources.add('rag_sessions');
  if (Array.isArray(data.counters)) sources.add('counters');
  if (data.topStockLines || data.warehouseTotals) sources.add('stock');

  return sources;
};

const retrieveContext = async (tenantId, question) => {
  const topics = detectTopics(question);
  const sources = new Set(['reports_aligned']);

  const [reportSnapshot, matchedProductIds, matchedLocations, matchedVendors] = await Promise.all([
    buildRagReportSnapshot(tenantId, question),
    findMatchedProducts(tenantId, question),
    findMatchedLocations(tenantId, question),
    findMatchedVendors(tenantId, question),
  ]);

  if (matchedVendors?.length) sources.add('matched_vendors');

  const focusedLocation = buildFocusedLocationContext(
    reportSnapshot.locationBreakdown,
    matchedLocations
  );
  const warehouseSummary =
    /\b(warehouse|godown|godam)\b/i.test(String(question)) && !focusedLocation
      ? buildWarehouseAggregate(reportSnapshot.locationBreakdown)
      : null;

  let matchedProducts = null;
  const qLower = String(question).toLowerCase();
  const isGlobalListQuestion =
    /\b(best\s*sell|top\s*sell|most\s*profit|profitable|dead\s*stock|all\s*products|saare\s*products|products\s*list|out\s*of\s*stock|stock\s*out|stockout|low\s*stock|total\s*products)\b/i.test(
      qLower
    ) ||
    isProductCatalogQuestion(qLower) ||
    (isExpiryQuestion(qLower) &&
      /\b(sab|sare|saare|all|list|poori|poora|naam|name|names)\b/i.test(qLower)) ||
    (isStockAlertQuestion(qLower) &&
      /\b(sab|sare|saare|all|list|poori|poora|naam|name|names|batao|kon)\b/i.test(qLower));

  if (matchedProductIds.length && !isGlobalListQuestion) {
    matchedProducts = await buildMatchedProductContext(tenantId, matchedProductIds, question);
    if (matchedProducts?.length) sources.add('matched_products');
  } else if (matchedProductIds.length && isGlobalListQuestion) {
    // Skip single-product override for global list questions (avoids chat-history pollution)
  }

  const topicData = {};
  const topicList = [...new Set([
    ...topics,
    ...(isStockAlertQuestion(qLower) ? ['lowStock'] : []),
    ...(isProductCatalogQuestion(qLower) ? ['products'] : []),
    ...(matchedProductIds.length && !isGlobalListQuestion ? ['batches', 'products'] : []),
    ...(matchedVendors.length ? ['vendors'] : [])
  ])];

  for (const topic of topicList) {
    if (topic === 'overview') continue;
    const fetcher = TOPIC_FETCHERS[topic];
    if (!fetcher) continue;
    const data = await fetcher(tenantId, question);
    topicData[topic] = data;
    collectSourcesFromData(data).forEach((source) => sources.add(source));
  }

  const purchaseSummary =
    topicData.purchasing?.lifetimeSummary ||
    (/\bpurchase|kharid|grn\b/i.test(String(question))
      ? {
          totalItemsPurchased: reportSnapshot.answerKey.totalItemsPurchased,
          netItemsPurchased: reportSnapshot.answerKey.netItemsPurchased,
          netPurchases: reportSnapshot.answerKey.netPurchases,
          grnCount: reportSnapshot.answerKey.grnCount,
          period: reportSnapshot.period?.range,
        }
      : null);

  const wantsCatalogQ = isProductCatalogQuestion(question);
  const productCatalogDocs = await Product.find({ tenantId, status: 'active' })
    .select('name sku sellingPrice supplierName')
    .sort({ name: 1 })
    .limit(wantsCatalogQ ? 300 : 40)
    .lean();

  const productCatalog = productCatalogDocs.map((p) => ({
    name: p.name,
    sku: p.sku,
    price: p.sellingPrice ? `Rs ${p.sellingPrice}` : undefined,
    supplier: p.supplierName || undefined,
  }));

  const compactReport = toCompactReportContext(reportSnapshot, question);
  const wantsExpiryQ = isExpiryQuestion(question);
  const wantsStockAlertQ = isStockAlertQuestion(question);

  const slimBatch = (row) => ({
    name: row.name || row.productName || row.product || 'Unknown',
    sku: row.sku || '—',
    batchNumber: row.batchNumber || '—',
    destination: row.destination || '—',
    locationType: row.locationType,
    remainingQty: row.remainingQty,
    expiryDate: row.expiryDate,
    daysLeft: row.daysLeft,
  });

  const expiryFocus =
    wantsExpiryQ || compactReport.expiryFocus
      ? (() => {
          const focus =
            compactReport.expiryFocus || {
              counts: {
                expiredProducts: reportSnapshot.answerKey.expiredProducts,
                expiringSoonProducts: reportSnapshot.answerKey.expiringSoonProducts,
                warehouseExpiredProducts: reportSnapshot.answerKey.warehouseExpiredProducts,
                warehouseExpiringSoonProducts: reportSnapshot.answerKey.warehouseExpiringSoonProducts,
                storeExpiredProducts: reportSnapshot.answerKey.storeExpiredProducts,
                storeExpiringSoonProducts: reportSnapshot.answerKey.storeExpiringSoonProducts,
              },
              storeTotals: reportSnapshot.expiry?.storeTotals,
              warehouseTotals: reportSnapshot.expiry?.warehouseTotals,
              byLocation: (reportSnapshot.expiry?.byLocation || []).map((l) => ({
                destination: l.destination,
                name: l.name,
                locationType: l.locationType,
                expiredProductCount: l.expiredProductCount,
                expiringSoonProductCount: l.expiringSoonProductCount,
                expiredProducts: (l.expired || []).map(slimBatch),
                expiringSoonProducts: (l.expiringSoon || []).map(slimBatch),
              })),
              expiredBatches: (reportSnapshot.expiry?.expiredBatches || []).map(slimBatch),
              expiringSoonBatches: (reportSnapshot.expiry?.expiringSoonBatches || []).map(slimBatch),
            };
          focus.expiredProductNames = [
            ...new Set(
              (focus.expiredBatches || [])
                .map((r) => r.name)
                .filter(Boolean)
            ),
          ];
          focus.expiringSoonProductNames = [
            ...new Set(
              (focus.expiringSoonBatches || [])
                .map((r) => r.name)
                .filter(Boolean)
            ),
          ];
          focus.note =
            'ALWAYS list expiredProductNames / expiringSoonProductNames when user asks for names. Do not say names unavailable if these arrays are non-empty.';
          return focus;
        })()
      : undefined;

  const context = {
    answerKey: reportSnapshot.answerKey,
    expiryFocus,
    purchaseSummary,
    focusedLocation,
    warehouseSummary,
    matchedProducts: matchedProducts || undefined,
    matchedVendors: matchedVendors?.length ? matchedVendors : undefined,
    productCatalog: productCatalog.length ? productCatalog : undefined,
    reports: {
      period: reportSnapshot.period,
      answerKey: reportSnapshot.answerKey,
      financials: reportSnapshot.financials,
      growth: reportSnapshot.growth,
      inventory: reportSnapshot.inventory,
      expiry: wantsExpiryQ
        ? {
            expiredProductCount: reportSnapshot.expiry?.expiredProductCount,
            expiringSoonProductCount: reportSnapshot.expiry?.expiringSoonProductCount,
            storeTotals: reportSnapshot.expiry?.storeTotals,
            warehouseTotals: reportSnapshot.expiry?.warehouseTotals,
            expiredBatches: (reportSnapshot.expiry?.expiredBatches || []).map(slimBatch),
            expiringSoonBatches: (reportSnapshot.expiry?.expiringSoonBatches || []).map(slimBatch),
            byLocation: (reportSnapshot.expiry?.byLocation || []).map((l) => ({
              destination: l.destination,
              locationType: l.locationType,
              expiredProductCount: l.expiredProductCount,
              expiringSoonProductCount: l.expiringSoonProductCount,
              expiredProducts: (l.expired || []).map(slimBatch),
              expiringSoonProducts: (l.expiringSoon || []).map(slimBatch),
            })),
          }
        : {
            expiredProductCount: reportSnapshot.expiry?.expiredProductCount,
            expiringSoonProductCount: reportSnapshot.expiry?.expiringSoonProductCount,
          },
      productPerformance: {
        bestSelling: reportSnapshot.productPerformance?.bestSelling || [],
        mostProfitable: reportSnapshot.productPerformance?.mostProfitable || [],
        slowMoving: reportSnapshot.productPerformance?.slowMoving || [],
        deadStockCount: reportSnapshot.productPerformance?.deadStockCount,
        deadStock: reportSnapshot.productPerformance?.deadStock || [],
      },
      locationBreakdown: wantsExpiryQ
        ? undefined
        : (reportSnapshot.locationBreakdown || []).map((l) => ({
            destination: l.destination,
            locationType: l.locationType,
            lowStockCount: l.lowStockCount,
            outOfStockCount: l.outOfStockCount,
            expiredProductCount: l.expiredProductCount,
            expiringSoonProductCount: l.expiringSoonProductCount,
            ...(wantsStockAlertQ
              ? {
                  lowStock: (l.lowStock || []).slice(0, 40),
                  outOfStock: (l.outOfStock || []).slice(0, 40),
                }
              : {}),
          })),
      lossBreakdown: reportSnapshot.lossBreakdown,
      todayLoss: reportSnapshot.todayLoss,
    },
    topics: topicData,
  };

  const contextText = serializeRagContext(context, 14000, question);

  return { topics: topicList, context, contextText, sources: [...sources], reportSnapshot };
};

/** Compact context for AI Insights */
const retrieveInsightsContext = async (tenantId) => {
  const { buildAdvancedAnalytics, toAiContext } = require('./ragAdvancedAnalytics');
  const [reportSnapshot, analytics, vendorDocs, warehouseDocs, discountDocs, couponDocs] = await Promise.all([
    buildRagReportSnapshot(tenantId, 'overview sales inventory profit loss expiry'),
    buildAdvancedAnalytics(tenantId),
    Vendor.find({ tenantId, isDeleted: false }).select('name vendorCode phone email status').lean(),
    Warehouse.find({ tenantId, isDeleted: false, status: 'active' }).select('name code managerName phone email address city').lean(),
    StoreDiscount.find({ tenantId, isActive: true }).select('name code discountType discountValue').lean(),
    Coupon.find({ tenantId, status: 'active' }).select('code discountType discountValue').lean()
  ]);

  const slimBatchRow = (b) => ({
    name: b.name || b.productName || 'Unknown',
    sku: b.sku || '—',
    batchNumber: b.batchNumber || '—',
    destination: b.destination || '—',
    remainingQty: b.remainingQty || 0,
    daysLeft: b.daysLeft
  });

  const compact = {
    reports: {
      answerKey: reportSnapshot.answerKey,
      financials: reportSnapshot.financials,
      locationBreakdown: (reportSnapshot.locationBreakdown || []).map((l) => ({
        destination: l.destination,
        locationType: l.locationType,
        expiredProductCount: l.expiredProductCount,
        expiringSoonProductCount: l.expiringSoonProductCount,
        lowStockCount: l.lowStockCount,
        outOfStockCount: l.outOfStockCount,
      })),
      expirySummary: {
        expiredProductCount: reportSnapshot.expiry?.expiredProductCount || 0,
        expiringSoonProductCount: reportSnapshot.expiry?.expiringSoonProductCount || 0,
        warehouseExpiredProducts: reportSnapshot.expiry?.warehouseTotals?.expiredProductCount || 0,
        storeExpiredProducts: reportSnapshot.expiry?.storeTotals?.expiredProductCount || 0,
        warehouseExpiringSoonProducts: reportSnapshot.expiry?.warehouseTotals?.expiringSoonProductCount || 0,
        storeExpiringSoonProducts: reportSnapshot.expiry?.storeTotals?.expiringSoonProductCount || 0,
        topExpired: (reportSnapshot.expiry?.expiredBatches || []).slice(0, 5).map(slimBatchRow),
        topExpiringSoon: (reportSnapshot.expiry?.expiringSoonBatches || []).slice(0, 5).map(slimBatchRow),
      },
      productPerformance: {
        bestSelling: reportSnapshot.productPerformance?.bestSelling?.slice(0, 5),
        deadStock: reportSnapshot.productPerformance?.deadStock?.slice(0, 8),
      },
      registeredSuppliers: (vendorDocs || []).map((v) => ({
        name: v.name,
        code: v.vendorCode,
        phone: v.phone,
        email: v.email,
        status: v.status
      })),
      warehouses: (warehouseDocs || []).map((w) => ({
        name: w.name,
        code: w.code,
        manager: w.managerName,
        phone: w.phone,
        email: w.email,
        address: w.address,
        city: w.city
      })),
      tax: {
        totalTaxGathered: reportSnapshot.answerKey?.totalTaxGathered,
        taxCollected: reportSnapshot.answerKey?.taxCollected
      },
      promotions: {
        activeDiscounts: (discountDocs || []).length,
        activeCoupons: (couponDocs || []).length
      }
    },
    analytics: JSON.parse(toAiContext(analytics)),
  };

  let contextText = JSON.stringify(compact);
  if (contextText.length > 5000) {
    compact.analytics = {
      kpis: compact.analytics.kpis,
      stockHealth: compact.analytics.stockHealth,
      salesTrend: compact.analytics.salesTrend?.slice(-4),
      lowStock: compact.analytics.lowStock?.slice(0, 3),
      outOfStock: compact.analytics.outOfStock?.slice(0, 3),
      expiry: compact.analytics.expiry?.slice(0, 3),
      returns: compact.analytics.returns,
      suppliers: compact.analytics.suppliers?.slice(0, 3)
    };
    contextText = JSON.stringify(compact);
  }

  return { context: compact, contextText, sources: ['insights_ai', 'reports_aligned'] };
};

module.exports = {
  retrieveContext,
  detectTopics,
  TOPIC_KEYWORDS,
  TOPIC_FETCHERS,
  retrieveInsightsContext
};