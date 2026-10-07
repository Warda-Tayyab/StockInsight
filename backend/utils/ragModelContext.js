const PurchaseOrder = require('../models/tenant/PurchaseOrder');
const GoodsReceipt = require('../models/tenant/GoodsReceipt');
const PurchaseReturn = require('../models/tenant/PurchaseReturn');
const Vendor = require('../models/tenant/Vendor');
const Product = require('../models/tenant/Product');
const StockTransfer = require('../models/tenant/StockTransfer');
const Coupon = require('../models/tenant/Coupon');
const StoreDiscount = require('../models/tenant/StoreDiscount');
const Bill = require('../models/tenant/Bill');
const LoginHistory = require('../models/tenant/LoginHistory');
const EmailConfig = require('../models/tenant/EmailConfig');
const { getPurchasesInRange, getPurchaseReturnsInRange } = require('./purchaseReportHelpers');
const { detectRangeFromQuestion } = require('./ragReportContext');
const { getDateRange } = require('./reportHelpers');

const formatCurrency = (n) => `Rs ${Number(n || 0).toLocaleString('en-PK')}`;

const buildPurchasingContext = async (tenantId, question = '') => {
  let range = detectRangeFromQuestion(question);
  const requestedRange = range;
  let { start, end } = getDateRange(range);

  let [orders, receipts, returns, purchaseStats, returnStats] = await Promise.all([
    PurchaseOrder.find({ tenantId }).sort({ createdAt: -1 }).limit(12).populate('vendorId', 'name').lean(),
    GoodsReceipt.find({ tenantId }).sort({ createdAt: -1 }).limit(12).populate('vendorId', 'name').lean(),
    PurchaseReturn.find({ tenantId, status: 'posted' }).sort({ returnDate: -1 }).limit(10).lean(),
    getPurchasesInRange(tenantId, start, end),
    getPurchaseReturnsInRange(tenantId, start, end),
  ]);

  let fallbackApplied = false;
  if (range !== 'all' && (purchaseStats.totalQty || 0) === 0 && (purchaseStats.totalAmount || 0) === 0) {
    const widerRange = 'all';
    const widerBounds = getDateRange(widerRange);
    const [wPurchaseStats, wReturnStats] = await Promise.all([
      getPurchasesInRange(tenantId, widerBounds.start, widerBounds.end),
      getPurchaseReturnsInRange(tenantId, widerBounds.start, widerBounds.end),
    ]);
    if ((wPurchaseStats.totalQty || 0) > 0 || (wPurchaseStats.totalAmount || 0) > 0) {
      range = widerRange;
      start = widerBounds.start;
      end = widerBounds.end;
      purchaseStats = wPurchaseStats;
      returnStats = wReturnStats;
      fallbackApplied = true;
    }
  }

  const postedGrn = receipts.filter((r) => r.status === 'posted');
  const grnTotal = purchaseStats.totalAmount || 0;
  const returnTotal = returnStats.totalAmount || 0;
  const netPurchases = grnTotal - returnTotal;
  const uniqueProducts = new Set();
  for (const receipt of purchaseStats.receipts || []) {
    for (const item of receipt.items || []) {
      if (item.productId) uniqueProducts.add(String(item.productId));
    }
  }

  return {
    source: 'purchasing',
    period: range,
    fallbackApplied,
    requestedRange,
    lifetimeSummary: {
      totalItemsPurchased: purchaseStats.totalQty || 0,
      purchaseReturnQty: returnStats.totalQty || 0,
      netItemsPurchased: Math.max(0, (purchaseStats.totalQty || 0) - (returnStats.totalQty || 0)),
      uniqueProductsPurchased: uniqueProducts.size,
      grnCount: (purchaseStats.receipts || []).length,
      purchaseReturnCount: (returnStats.returns || []).length,
      grossPurchaseAmount: formatCurrency(grnTotal),
      purchaseReturnCredit: formatCurrency(returnTotal),
      netPurchases: formatCurrency(netPurchases),
      netPurchasesRaw: Math.round(netPurchases),
      periodUsed: range,
      fallbackApplied,
      note: 'Use lifetimeSummary for "kitni items purchase ki" and total purchase amount questions.',
    },
    summary: {
      purchaseOrders: orders.length,
      postedGrn: postedGrn.length,
      purchaseReturns: returns.length,
      netPurchases: formatCurrency(netPurchases),
    },
    recentPurchaseOrders: orders.slice(0, 8).map((o) => ({
      poNumber: o.poNumber,
      vendor: o.vendorId?.name,
      status: o.status,
      total: formatCurrency(o.totalAmount),
      itemCount: (o.items || []).length,
    })),
    recentGoodsReceipts: receipts.slice(0, 8).map((r) => ({
      grnNumber: r.grnNumber,
      vendor: r.vendorId?.name,
      status: r.status,
      subtotal: formatCurrency(r.subtotal),
      itemCount: (r.items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0),
      lineItems: (r.items || []).length,
    })),
    recentPurchaseReturns: returns.slice(0, 5).map((r) => ({
      returnNumber: r.returnNumber,
      total: formatCurrency(r.totalAmount),
      itemCount: (r.items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0),
    })),
  };
};

const buildVendorContext = async (tenantId) => {
  const vendors = await Vendor.find({ tenantId }).sort({ name: 1 }).limit(30).lean();

  let allVendors = vendors.map((v) => ({
    name: v.name.trim(),
    code: v.code || '—',
    contactPerson: v.contactPerson || '—',
    phone: v.phone || '—',
    email: v.email || '—',
    address: v.address || '—',
    city: v.city || '—',
    status: v.status || 'active',
  }));

  if (!allVendors.length) {
    const productSuppliers = await Product.find({ tenantId, supplierName: { $exists: true, $ne: '' } }).distinct('supplierName');
    allVendors = (productSuppliers || []).map((s) => ({
      name: String(s).trim(),
      code: '—',
      contactPerson: '—',
      phone: '—',
      email: '—',
      address: '—',
      city: '—',
      status: 'active',
    }));
  }

  const supplierNames = allVendors.map((v) => v.name);

  return {
    source: 'vendors',
    summary: { total: allVendors.length, supplierNames },
    vendors: allVendors,
    supplierNames,
  };
};

const buildStockTransferContext = async (tenantId) => {
  const transfers = await StockTransfer.find({ tenantId }).sort({ createdAt: -1 }).limit(15)
    .populate('fromLocationId', 'name').populate('toLocationId', 'name').lean();
  return {
    source: 'stock_transfers',
    summary: { total: transfers.length, completed: transfers.filter((t) => t.status === 'completed').length },
    recentTransfers: transfers.map((t) => ({ transferNumber: t.transferNumber, from: t.fromLocationId?.name, to: t.toLocationId?.name, status: t.status, items: (t.items || []).length })),
  };
};

const buildCouponContext = async (tenantId) => {
  const coupons = await Coupon.find({ tenantId }).sort({ createdAt: -1 }).limit(20).lean();
  return {
    source: 'coupons',
    summary: { total: coupons.length, active: coupons.filter((c) => c.isActive).length },
    coupons: coupons.map((c) => ({
      code: c.code,
      description: c.description || '',
      discountType: c.type,
      discountValue: c.type === 'percentage' ? `${c.value}%` : formatCurrency(c.value),
      minOrderAmount: formatCurrency(c.minOrderAmount || 0),
      maxUses: c.maxUses || 'Unlimited',
      usedCount: c.usedCount || 0,
      remainingUses: c.maxUses ? Math.max(0, c.maxUses - (c.usedCount || 0)) : 'Unlimited',
      startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : null,
      endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : null,
      status: c.isActive ? 'Active' : 'Inactive',
      isActive: c.isActive,
    })),
  };
};

const buildDiscountContext = async (tenantId) => {
  const discounts = await StoreDiscount.find({ tenantId })
    .populate('productIds', 'name sku')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  return {
    source: 'store_discounts',
    summary: { total: discounts.length, active: discounts.filter((d) => d.isActive).length },
    discounts: discounts.map((d) => ({
      name: d.name,
      discountType: d.type,
      discountValue: d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value),
      scope: d.scope,
      applicableProducts: (d.productIds || []).map((p) => p.name || p),
      startDate: d.startDate ? new Date(d.startDate).toISOString().split('T')[0] : null,
      endDate: d.endDate ? new Date(d.endDate).toISOString().split('T')[0] : null,
      status: d.isActive ? 'Active' : 'Inactive',
      isActive: d.isActive,
    })),
  };
};

const buildBillContext = async (tenantId) => {
  const bills = await Bill.find({ tenantId }).sort({ billDate: -1 }).limit(15).populate('vendorId', 'name').lean();
  return { source: 'bills', bills: bills.map((b) => ({ billNumber: b.billNumber, vendor: b.vendorId?.name, status: b.status, total: formatCurrency(b.totalAmount) })) };
};

const buildLoginHistoryContext = async (tenantId) => {
  const logins = await LoginHistory.find({ tenantId }).sort({ loginAt: -1 }).limit(20).populate('userId', 'firstName lastName email role').lean();
  return { source: 'login_history', logins: logins.map((l) => ({ user: l.userId?.email, role: l.userId?.role, loginAt: l.loginAt })) };
};

const buildEmailConfigContext = async (tenantId) => {
  const config = await EmailConfig.findOne({ tenantId }).lean();
  return { source: 'email_config', configured: Boolean(config), isEnabled: config?.isEnabled ?? false };
};

const MODEL_TOPIC_KEYWORDS = {
  purchasing: [
    'purchase', 'purchasing', 'grn', 'goods receipt', 'purchase order', 'kharidari', 'net purchase',
    'kharid', 'kharidi', 'items purchase', 'purchase ki', 'kitni items', 'total purchase', 'grn count',
  ],
  vendors: [
    'vendor', 'vendors', 'supplier', 'suppliers', 'supplier name', 'supplier names',
    'supplier list', 'suppliers list', 'kon se supplier', 'konsa supplier', 'konsay supplier',
    'supplier info', 'company name', 'companies', 'supplier kaun', 'supplier number',
    'supplier phone', 'supplier contact', 'vendor phone', 'vendor number', 'vendor contact',
    'contact no', 'contact number', 'phone number', 'supplier mail', 'supplier email'
  ],
  stockTransfers: ['transfer', 'stock transfer', 'move stock', 'location transfer'],
  coupons: ['coupon', 'coupons', 'promo code', 'promo', 'code', 'discount coupon', 'کوپن'],
  discounts: ['discount', 'discounts', 'store discount', 'discount rule', 'sale discount', 'offer', 'ڈسکاؤنٹ'],
  bills: ['bill', 'bills', 'vendor bill', 'payable'],
  loginHistory: ['login', 'login history', 'last login', 'who logged'],
  emailConfig: ['email config', 'smtp', 'email settings'],
  profitLoss: ['profit', 'loss', 'p&l', 'margin', 'nuksan', 'munafa', 'operating loss', 'net profit'],
  deadStock: [
    'dead stock', 'deadstock', 'no sales', 'not selling',
    'best selling', 'top selling', 'most profitable', 'profitable products',
    'slow moving', 'munafa wali', 'zyada becha',
  ],
};

const MODEL_TOPIC_FETCHERS = {
  purchasing: buildPurchasingContext,
  vendors: buildVendorContext,
  stockTransfers: buildStockTransferContext,
  coupons: buildCouponContext,
  discounts: buildDiscountContext,
  bills: buildBillContext,
  loginHistory: buildLoginHistoryContext,
  emailConfig: buildEmailConfigContext,
};

module.exports = { MODEL_TOPIC_KEYWORDS, MODEL_TOPIC_FETCHERS, buildPurchasingContext };
