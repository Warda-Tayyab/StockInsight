const mongoose = require('mongoose');
const Product = require('../models/tenant/Product');
const Stock = require('../models/tenant/Stock');
const Sale = require('../models/tenant/Sale');
const Batch = require('../models/tenant/Batch');
const Warehouse = require('../models/tenant/Warehouse');
const Inventory = require('../models/tenant/Inventory');
const User = require('../models/tenant/User');
const Category = require('../models/tenant/Category');
const WriteOff = require('../models/tenant/WriteOff');
const PurchaseReturn = require('../models/tenant/PurchaseReturn');
const GoodsReceipt = require('../models/tenant/GoodsReceipt');
const Tenant = require('../models/shared/Tenant');
const {
  getPurchasedProductIds,
  getPurchasedInventoryValue,
  getActiveWriteOffLoss,
  mapWriteOffLossItems,
  getPurchaseReturnsInRange,
  mapPurchaseReturnItems,
  getPurchasesInRange,
  aggregatePurchasedStockByName,
  batchUnitCost,
} = require('../utils/purchaseReportHelpers');
const {
  getPurchasedLowStockReport,
  getPurchasedStockSummary,
} = require('../utils/lowStockHelpers');
const { computePeriodFinancials, remainingQty, getSalesCogs } = require('../utils/financialReportHelpers');
const StockTransfer = require('../models/tenant/StockTransfer');
const ReturnExchange = require('../models/tenant/ReturnExchange');
const LoginHistory = require('../models/tenant/LoginHistory');
const {
  getDateRange,
  getPreviousRange,
  calcGrowth,
  sumSalesTotal,
  sumSalesNetSales,
  sumSalesTax,
  sumSalesCouponDiscounts,
  sumSalesProductDiscounts,
  getSaleNetTotal,
  getSaleNetDetails,
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  formatSaleDate,
  getStockStatus,
  getExpiryStatus,
} = require('../utils/reportHelpers');

const tenantObjectId = (tenantId) => new mongoose.Types.ObjectId(tenantId);

const getTenantInfo = async (tenantId) => {
  const tenant = await Tenant.findById(tenantId).populate({
    path: 'ownerUserId',
    select: 'firstName lastName email',
  });
  return {
    name: tenant?.name,
    ownerName: tenant?.ownerUserId
      ? `${tenant.ownerUserId.firstName || ''} ${tenant.ownerUserId.lastName || ''}`.trim()
      : 'N/A',
    ownerEmail: tenant?.ownerEmail,
    contact: tenant?.primaryContact?.phone || 'N/A',
  };
};

/**
 * GET /api/reports/overview?range=month
 * Unified period KPIs: Net Sales, Net Purchases, Inventory Value, Gross/Net Profit, Loss
 */
exports.getOverview = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { range = 'month' } = req.query;
    const { start, end } = getDateRange(range);
    const prev = getPreviousRange(start, end);

    const [fin, prevFin, stockSummary] = await Promise.all([
      computePeriodFinancials(tenantId, start, end),
      computePeriodFinancials(tenantId, prev.start, prev.end),
      getPurchasedStockSummary(tenantId),
    ]);

    const salesGrowth = calcGrowth(fin.netSales, prevFin.netSales);
    const purchaseGrowth = calcGrowth(fin.netPurchases, prevFin.netPurchases);

    res.json({
      success: true,
      range,
      period: { start, end },
      salesSummary: {
        totalSales: fin.netSales,
        netSalesInclusive: fin.netSalesInclusive,
        orderCount: fin.orderCount,
        growth: salesGrowth,
      },
      inventorySummary: {
        inStock: stockSummary.inStock,
        lowStock: stockSummary.lowStock,
        outOfStock: stockSummary.outOfStock,
        totalValue: fin.inventoryValue,
        totalProducts: stockSummary.totalProducts,
        scope: 'purchased_products',
      },
      purchasingSummary: {
        purchaseSpend: fin.purchaseSpend,
        purchaseReturns: fin.purchaseReturnCredit,
        netPurchaseSpend: fin.netPurchases,
        purchasesThisMonth: fin.purchaseSpend,
        returnsThisMonth: fin.purchaseReturnCredit,
        growth: purchaseGrowth,
      },
      profitLoss: {
        revenue: fin.netSales,
        netSales: fin.netSales,
        cost: fin.cogs,
        cogs: fin.cogs,
        grossProfit: fin.grossProfit,
        writeOffLoss: fin.writeOffLoss,
        expiredLoss: fin.expiredLoss,
        purchaseReturnLoss: fin.purchaseReturnLoss,
        totalLoss: fin.operatingLoss,
        purchaseReturnCredit: fin.purchaseReturnCredit,
        netPurchases: fin.netPurchases,
        belowCostExposure: fin.belowCostExposure,
        netProfit: fin.netProfit,
        margin: fin.margin,
      },
      kpis: {
        netSales: fin.netSales,
        netPurchases: fin.netPurchases,
        inventoryValue: fin.inventoryValue,
        grossProfit: fin.grossProfit,
        totalLoss: fin.operatingLoss,
        netProfit: fin.netProfit,
        margin: fin.margin,
      },
      lowStockCount: stockSummary.lowStockCount,
    });
  } catch (err) {
    console.error('Report overview error:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/reports/sales
 */
exports.getSalesReport = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const tenant = await Tenant.findById(tenantId)
  .populate({
    path: 'ownerUserId',
    select: 'firstName lastName email'
  });
  const tenantInfo = {
    name: tenant?.name,
    ownerName: tenant?.ownerUserId
      ? `${tenant.ownerUserId.firstName || ''} ${tenant.ownerUserId.lastName || ''}`.trim()
      : 'N/A',
    ownerEmail: tenant?.ownerEmail,
    contact: tenant?.primaryContact?.phone || 'N/A'
  };
    const { range = 'month', search } = req.query;
    const { start, end } = getDateRange(range);
    const prev = getPreviousRange(start, end);

    const filter = { tenantId, createdAt: { $gte: start, $lte: end } };
    let sales = await Sale.find(filter).sort({ createdAt: -1 });

    if (search) {
      const q = search.toLowerCase();
      sales = sales.filter(
        (s) =>
          (s.invoiceId || '').toLowerCase().includes(q) ||
          (s.items || []).some((i) => (i.productName || '').toLowerCase().includes(q))
      );
    }

    const allSales = await Sale.find({ tenantId });
    const totalSales = sumSalesTotal(allSales);

    const todayStart = startOfDay();
    const todayEnd = endOfDay();
    const dailySales = await Sale.find({
      tenantId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });
    const weeklySales = await Sale.find({
      tenantId,
      createdAt: { $gte: startOfWeek(), $lte: end },
    });
    const monthlySales = await Sale.find({
      tenantId,
      createdAt: { $gte: startOfMonth(), $lte: end },
    });

    const periodSales = await Sale.find({
      tenantId,
      createdAt: { $gte: start, $lte: end },
    });
    const previousPeriodSales = await Sale.find({
      tenantId,
      createdAt: { $gte: prev.start, $lte: prev.end },
    });

    const salesTrend = [];
    const monthsToFetch = range === 'year' ? 12 : range === 'quarter' ? 3 : 6;
    for (let i = monthsToFetch - 1; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthly = await Sale.find({
        tenantId,
        createdAt: { $gte: monthStart, $lt: monthEnd },
      });
      salesTrend.push({
        date: monthStart.toLocaleString('default', { month: 'short' }),
        revenue: sumSalesTotal(monthly),
        orders: monthly.length,
      });
    }

    const customerMap = {};
    periodSales.forEach((sale) => {
      const key = sale.paymentMethod === 'card' ? 'Card Payments' : 'Cash Sales';
      if (!customerMap[key]) customerMap[key] = { name: key, orders: 0, totalSpent: 0 };
      customerMap[key].orders += 1;
      customerMap[key].totalSpent += getSaleNetTotal(sale);
    });
    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map((c, i) => ({ id: i + 1, ...c, totalSpent: Math.round(c.totalSpent) }));

      const productAgg = await Sale.aggregate([
        {
          $match: {
            tenantId: tenantObjectId(tenantId),
            createdAt: { $gte: start, $lte: end }
          }
        },
        { $unwind: '$items' },
      
        {
          $group: {
            _id: '$items.productId',
            sold: { $sum: { $subtract: ['$items.quantity', { $ifNull: ['$items.returnedQty', 0] }] } },
            revenue: { $sum: { $multiply: [
              '$items.unitPrice',
              { $subtract: ['$items.quantity', { $ifNull: ['$items.returnedQty', 0] }] }
            ] } }
          }
        },
      
        { $sort: { sold: -1 } },
        { $limit: 5 }
      ]);
      
      const products = await Product.find({ tenantId })
        .select('_id sku name');
      
      const productMap = Object.fromEntries(
        products.map((p) => [
          p._id.toString(),
          {
            name: p.name,
            sku: p.sku
          }
        ])
      );
      
      const topSellingProducts = productAgg.map((p, i) => {
        const product = productMap[p._id?.toString()];
      
        return {
          id: i + 1,
          name: product?.name || 'Unknown',
          sku: product?.sku || '—',
          sold: p.sold,
          revenue: Math.round(p.revenue || 0)
        };
      });


    const transactions = periodSales.map((s) => ({
      id: s.invoiceId || s._id.toString(),
      date: formatSaleDate(s.createdAt),
      customer: s.paymentMethod === 'card' ? 'Card' : 'Cash',
      items: (s.items || []).length,
      payment: s.paymentMethod || 'cash',
      total: getSaleNetTotal(s),
    }));

    const warehouses = await Warehouse.find({ tenantId, isDeleted: false }).select('name');
    const categories = await Product.distinct('categoryId', { tenantId });
    const categoryDocs = await Category.find({ _id: { $in: categories } }).select('name');

    const periodNetSalesExTax = sumSalesNetSales(periodSales);
    const periodTax = sumSalesTax(periodSales);
    const periodCouponDiscounts = sumSalesCouponDiscounts(periodSales);
    const periodProductDiscounts = sumSalesProductDiscounts(periodSales);
    const periodTotalSales = sumSalesTotal(periodSales);
    const periodCustomerReturns = periodSales.reduce((sum, s) => {
      const net = getSaleNetTotal(s);
      return sum + Math.max(0, (Number(s.total) || 0) - net);
    }, 0);

    res.json({
      success: true,
      summary: {
        totalSales: Math.round(periodTotalSales),
        netSales: Math.round(periodNetSalesExTax),
        totalTax: Math.round(periodTax),
        totalCustomerReturns: Math.round(periodCustomerReturns),
        totalCouponDiscounts: Math.round(periodCouponDiscounts),
        totalProductDiscounts: Math.round(periodProductDiscounts),
        totalOrders: periodSales.length,
        avgOrderValue: periodSales.length
          ? Math.round(periodTotalSales / periodSales.length)
          : 0,
        dailyRevenue: Math.round(sumSalesTotal(dailySales)),
        weeklyRevenue: Math.round(sumSalesTotal(weeklySales)),
        monthlyRevenue: Math.round(sumSalesTotal(monthlySales)),
        allTimeSales: Math.round(totalSales),
        growth: calcGrowth(periodTotalSales, sumSalesTotal(previousPeriodSales)),
      },
      tenant: tenantInfo,
      salesTrend,
      topCustomers,
      topSellingProducts,
      transactions,
      filterOptions: {
        customers: ['All', ...topCustomers.map((c) => c.name)],
        products: ['All', ...topSellingProducts.map((p) => p.name)],
        warehouses: ['All', ...warehouses.map((w) => w.name)],
        categories: ['All', ...categoryDocs.map((c) => c.name)],
      },
    });
  } catch (err) {
    console.error('Sales report error:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/reports/inventory
 */
exports.getInventoryReport = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { status, category, search } = req.query;
    const tenant = await Tenant.findById(tenantId)
  .populate({
    path: 'ownerUserId',
    select: 'firstName lastName email'
  });
  const tenantInfo = {
    name: tenant?.name,
    ownerName: tenant?.ownerUserId
      ? `${tenant.ownerUserId.firstName || ''} ${tenant.ownerUserId.lastName || ''}`.trim()
      : 'N/A',
    ownerEmail: tenant?.ownerEmail,
    contact: tenant?.primaryContact?.phone || 'N/A'
  };
    const purchasedIds = await getPurchasedProductIds(tenantId);
    const stockMap = await aggregatePurchasedStockByName(tenantId);

    let inventoryProducts = [...stockMap.values()].map((p) => ({
      ...p,
      status: getStockStatus(p.qty, p.reorder),
      value: Math.round(p.batchValue || p.qty * p.costPrice),
      locationSummary: (p.locations || [])
        .map((l) => `${l.name}: ${l.quantity}`)
        .join(' · '),
    }));

    if (status) inventoryProducts = inventoryProducts.filter((p) => p.status === status);
    if (category) {
      inventoryProducts = inventoryProducts.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }
    if (search) {
      const q = search.toLowerCase();
      inventoryProducts = inventoryProducts.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }

    const summary = {
      inStock: inventoryProducts.filter((p) => p.status === 'in_stock').length,
      lowStock: inventoryProducts.filter((p) => p.status === 'low_stock').length,
      outOfStock: inventoryProducts.filter((p) => p.status === 'out_of_stock').length,
      totalValue: inventoryProducts.reduce((s, p) => s + p.value, 0),
      totalProducts: inventoryProducts.length,
      scope: 'purchased_products',
    };

    const stocks = await Stock.find({ tenantId })
      .populate('warehouseId', 'name locationType')
      .select('warehouseId productId quantity');

    const purchasedIdList = [...purchasedIds];
    const warehouses = await Warehouse.find({ tenantId, isDeleted: false });
    const locationStock = [];

    for (const wh of warehouses) {
      const whStocks = stocks.filter(
        (s) =>
          s.warehouseId?._id?.toString() === wh._id.toString() &&
          purchasedIdList.includes(String(s.productId))
      );
      const totalQty = whStocks.reduce((sum, s) => sum + (s.quantity || 0), 0);
      const skus = new Set(whStocks.filter((s) => s.quantity > 0).map((s) => s.productId?._id?.toString())).size;
      locationStock.push({
        id: wh._id,
        name: wh.name,
        locationType: wh.locationType || 'store',
        totalQty,
        skus,
      });
    }

    const categories = [...new Set(inventoryProducts.map((p) => p.category))];

    res.json({
      success: true,
      tenant: tenantInfo,
      summary,
      inventoryProducts,
      locationStock,
      warehouseStock: locationStock,
      filterOptions: {
        categories: ['All', ...categories],
      },
    });
  } catch (err) {
    console.error('Inventory report error:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/reports/low-stock
 */
exports.getLowStockReport = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { search, locationId } = req.query;
    const tenant = await Tenant.findById(tenantId)
    .populate({
      path: 'ownerUserId',
      select: 'firstName lastName email'
    });
    const tenantInfo = {
      name: tenant?.name,
      ownerName: tenant?.ownerUserId
        ? `${tenant.ownerUserId.firstName || ''} ${tenant.ownerUserId.lastName || ''}`.trim()
        : 'N/A',
      ownerEmail: tenant?.ownerEmail,
      contact: tenant?.primaryContact?.phone || 'N/A'
    };
    const { items: reportItems, locations } = await getPurchasedLowStockReport(tenantId, {
      locationId: locationId || undefined,
    });
    let items = reportItems;

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          (i.destination || '').toLowerCase().includes(q) ||
          (i.locationSummary || '').toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      tenant: tenantInfo,
      items,
      locations,
      scope: 'purchased_products',
      stats: {
        total: items.length,
        critical: items.filter((i) => i.severity === 'critical').length,
        high: items.filter((i) => i.severity === 'high').length,
        suggestedReorderUnits: items.reduce((s, i) => s + i.suggested, 0),
      },
      filterOptions: {
        locations: [
          { id: '', label: 'All Locations' },
          ...(locations || []).map((l) => ({ id: l.id, label: l.label })),
        ],
      },
    });
  } catch (err) {
    console.error('Low stock report error:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/reports/profit-loss?range=
 * Net Sales − COGS = Gross Profit; − Write-offs − Expired = Net Profit
 * Net Purchases shown separately (GRN − Purchase Returns)
 * Below-cost sales are informational only (already in Gross Profit)
 */
exports.getProfitLossReport = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { range = 'month' } = req.query;
    const { start, end } = getDateRange(range);
    const tenantInfo = await getTenantInfo(tenantId);

    const fin = await computePeriodFinancials(tenantId, start, end);

    const lossProducts = [
      ...fin.writeOffItems,
      ...fin.expiredItems,
      ...fin.belowCostItems,
      ...fin.purchaseReturnItems,
    ].sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

    const lossBreakdown = [
      { name: 'Damaged / Write-offs', value: fin.writeOffLoss, categoryKey: 'write_off' },
      { name: 'Expired Stock', value: fin.expiredLoss, categoryKey: 'expired' },
      {
        name: 'Below-Cost (in GP)',
        value: fin.belowCostExposure,
        categoryKey: 'below_cost_sale',
      },
      {
        name: 'Purchase Return Loss',
        value: fin.purchaseReturnLoss,
        categoryKey: 'purchase_return',
      },
    ];

    const profitLossChart = [
      { name: 'Net Sales', value: fin.netSales },
      { name: 'COGS', value: fin.cogs },
      { name: 'Gross Profit', value: fin.grossProfit },
      { name: 'Operating Loss', value: fin.operatingLoss },
      { name: 'Net Profit', value: fin.netProfit },
      { name: 'Net Purchases', value: fin.netPurchases },
    ];

    const monthsToFetch = range === 'year' ? 12 : range === 'quarter' ? 3 : range === 'all' ? 12 : 6;
    const monthlyProfit = [];

    for (let i = monthsToFetch - 1; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const mFin = await computePeriodFinancials(tenantId, monthStart, monthEnd);
      monthlyProfit.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        revenue: mFin.netSales,
        cost: mFin.cogs,
        grossProfit: mFin.grossProfit,
        loss: mFin.operatingLoss,
        profit: mFin.netProfit,
        netPurchases: mFin.netPurchases,
      });
    }

    res.json({
      success: true,
      tenant: tenantInfo,
      range,
      period: { start, end },
      profitLoss: {
        revenue: fin.netSales,
        netSales: fin.netSales,
        netSalesInclusive: fin.netSalesInclusive,
        cost: fin.cogs,
        cogs: fin.cogs,
        grossProfit: fin.grossProfit,
        writeOffLoss: fin.writeOffLoss,
        expiredLoss: fin.expiredLoss,
        purchaseReturnLoss: fin.purchaseReturnLoss,
        salesLoss: fin.belowCostExposure,
        purchaseReturnRecovery: fin.purchaseReturnCredit,
        purchaseSpend: fin.purchaseSpend,
        netPurchases: fin.netPurchases,
        inventoryValue: fin.inventoryValue,
        totalLoss: fin.operatingLoss,
        netProfit: fin.netProfit,
        margin: fin.margin,
      },
      profitLossChart,
      lossBreakdown,
      monthlyProfit,
      lossProducts,
      purchaseReturnItems: fin.purchaseReturnItems,
      filterOptions: {
        lossCategories: [
          { label: 'All Items', key: 'all' },
          { label: 'Write-Offs (Damaged/Defective)', key: 'write_off' },
          { label: 'Expired Stock', key: 'expired' },
          { label: 'Below-Cost Sales (in GP)', key: 'below_cost_sale' },
          { label: 'Purchase Returns', key: 'purchase_return' },
        ],
      },
    });
  } catch (err) {
    console.error('Profit loss report error:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/reports/purchasing
 */
exports.getPurchaseReport = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { range = 'month', search } = req.query;
    const { start, end } = getDateRange(range);

    const tenant = await Tenant.findById(tenantId).populate({
      path: 'ownerUserId',
      select: 'firstName lastName email',
    });
    const tenantInfo = {
      name: tenant?.name,
      ownerName: tenant?.ownerUserId
        ? `${tenant.ownerUserId.firstName || ''} ${tenant.ownerUserId.lastName || ''}`.trim()
        : 'N/A',
      ownerEmail: tenant?.ownerEmail,
      contact: tenant?.primaryContact?.phone || 'N/A',
    };

    const { receipts, totalAmount: purchaseSpend, totalQty: purchaseQty } =
      await getPurchasesInRange(tenantId, start, end);
    const { returns, totalAmount: returnCredit, totalQty: returnQty } =
      await getPurchaseReturnsInRange(tenantId, start, end);
    const { totalValue: inventoryValue, batchCount, productCount } =
      await getPurchasedInventoryValue(tenantId);

    const vendorMap = {};
    for (const gr of receipts) {
      const vName = gr.vendorId?.name || 'Unknown Vendor';
      const vId = gr.vendorId?._id?.toString() || vName;
      if (!vendorMap[vId]) {
        vendorMap[vId] = { name: vName, spend: 0, qty: 0, receipts: 0 };
      }
      vendorMap[vId].spend += Number(gr.subtotal) || 0;
      vendorMap[vId].receipts += 1;
      vendorMap[vId].qty += (gr.items || []).reduce(
        (s, i) => s + (Number(i.quantity) || 0),
        0
      );
    }

    const productMap = {};
    for (const gr of receipts) {
      for (const item of gr.items || []) {
        const key = String(item.productName || item.productId || 'unknown').trim().toLowerCase();
        if (!productMap[key]) {
          productMap[key] = {
            name: item.productName || '—',
            sku: item.sku || '—',
            qty: 0,
            spend: 0,
          };
        }
        productMap[key].qty += Number(item.quantity) || 0;
        productMap[key].spend +=
          (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
      }
    }

    let topProducts = Object.values(productMap)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 15)
      .map((p, idx) => ({
        rank: idx + 1,
        ...p,
        spend: Math.round(p.spend),
      }));

    let receiveLines = receipts.flatMap((gr) =>
      (gr.items || []).map((item, idx) => ({
        id: `${gr._id}-${idx}`,
        type: 'receive',
        reference: gr.grnNumber || 'GRN',
        date: formatSaleDate(gr.receivedDate),
        rawDate: gr.receivedDate,
        vendor: gr.vendorId?.name || '—',
        location: gr.locationId?.name || '—',
        product: item.productName || '—',
        sku: item.sku || '—',
        quantity: item.quantity,
        unitCost: Math.round(Number(item.unitCost) || 0),
        total: Math.round((Number(item.quantity) || 0) * (Number(item.unitCost) || 0)),
        batchNumber: item.batchNumber || '—',
      }))
    );

    let returnLines = returns.flatMap((pr) =>
      (pr.items || []).map((item, idx) => ({
        id: `${pr._id}-${idx}`,
        type: 'return',
        reference: pr.returnNumber,
        date: formatSaleDate(pr.returnDate),
        rawDate: pr.returnDate,
        vendor: pr.vendorId?.name || '—',
        location: pr.locationId?.name || '—',
        product: item.productName || '—',
        sku: item.sku || '—',
        quantity: item.quantity,
        unitCost: Math.round(Number(item.unitCost) || 0),
        total: Math.round((Number(item.quantity) || 0) * (Number(item.unitCost) || 0)),
        batchNumber: item.batchNumber || '—',
      }))
    );

    let activity = [...receiveLines, ...returnLines].sort(
      (a, b) => new Date(b.rawDate) - new Date(a.rawDate)
    );

    if (search) {
      const q = search.toLowerCase();
      activity = activity.filter(
        (row) =>
          row.product.toLowerCase().includes(q) ||
          row.reference.toLowerCase().includes(q) ||
          row.vendor.toLowerCase().includes(q)
      );
      topProducts = topProducts.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)
      );
    }

    const vendorBreakdown = Object.values(vendorMap)
      .map((v) => ({ ...v, spend: Math.round(v.spend) }))
      .sort((a, b) => b.spend - a.spend);

    res.json({
      success: true,
      tenant: tenantInfo,
      summary: {
        purchaseSpend: Math.round(purchaseSpend),
        returnCredit: Math.round(returnCredit),
        netPurchaseSpend: Math.round(purchaseSpend - returnCredit),
        purchaseQty,
        returnQty,
        receiptCount: receipts.length,
        returnCount: returns.length,
        inventoryValue,
        batchCount,
        productCount,
        scope: 'purchased_products',
      },
      vendorBreakdown,
      topProducts,
      activity,
      purchaseChart: [
        { name: 'Purchases', value: Math.round(purchaseSpend) },
        { name: 'Returns', value: Math.round(returnCredit) },
        { name: 'Net Spend', value: Math.round(purchaseSpend - returnCredit) },
        { name: 'Inventory Value', value: inventoryValue },
      ],
    });
  } catch (err) {
    console.error('Purchase report error:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/reports/warehouse
 */
exports.getWarehouseReport = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { range = 'month' } = req.query;
    const { start, end } = getDateRange(range);
    const tenant = await Tenant.findById(tenantId)
    .populate({
      path: 'ownerUserId',
      select: 'firstName lastName email'
    });
    const tenantInfo = {
      name: tenant?.name,
      ownerName: tenant?.ownerUserId
        ? `${tenant.ownerUserId.firstName || ''} ${tenant.ownerUserId.lastName || ''}`.trim()
        : 'N/A',
      ownerEmail: tenant?.ownerEmail,
      contact: tenant?.primaryContact?.phone || 'N/A'
    };
    const stocks = await Stock.find({ tenantId }).populate('warehouseId', 'name locationType');
    const purchasedIds = await getPurchasedProductIds(tenantId);
    const purchasedIdList = [...purchasedIds];
    const warehouses = await Warehouse.find({ tenantId, isDeleted: false });
    const warehouseStock = warehouses.map((wh) => {
      const whStocks = stocks.filter(
        (s) =>
          s.warehouseId?._id?.toString() === wh._id.toString() &&
          (!purchasedIdList.length || purchasedIdList.includes(String(s.productId)))
      );

      const totalQty = whStocks.reduce((sum, s) => sum + (s.quantity || 0), 0);
      const skus = new Set(
        whStocks.filter((s) => s.quantity > 0).map((s) => s.productId?.toString())
      ).size;

      return {
        id: wh._id,
        name: wh.name,
        locationType: wh.locationType || 'store',
        totalQty,
        skus,
      };
    });

    const history = await Inventory.find({
      tenantId,
      type: {
        $in: [
          'stock_in',
          'stock_out',
          'adjust',
          'purchase_receive',
          'purchase_return',
          'transfer_in',
          'transfer_out',
        ],
      },
      createdAt: { $gte: start, $lte: end },
    })
      .populate('warehouseId', 'name locationType')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(50);
    
    // Get current product names
    const productIds = [
      ...new Set(
        history
          .map((h) => h.productId?.toString())
          .filter(Boolean)
      )
    ];
    
    const products = await Product.find({
      tenantId,
      _id: { $in: productIds }
    }).select('_id name');
    
    const productMap = Object.fromEntries(
      products.map((p) => [
        p._id.toString(),
        p.name
      ])
    );
    
    const warehouseTransfers = history.map((h, i) => ({
      id: i + 1,
      type: h.type,
      product: productMap[h.productId?.toString()] || h.productName || '—',
      warehouse: h.warehouseId?.name || '—',
      locationType: h.warehouseId?.locationType || 'store',
      qty: h.quantity,
      previousQuantity: h.previousQuantity,
      newQuantity: h.newQuantity,
      user: h.createdBy
        ? `${h.createdBy.firstName || ''} ${h.createdBy.lastName || ''}`.trim() || 'System'
        : 'System',
      date: formatSaleDate(h.createdAt),
    }));

    const completedTransfers = await StockTransfer.find({
      tenantId,
      status: 'completed',
      transferDate: { $gte: start, $lte: end },
    })
      .populate('fromLocationId', 'name locationType')
      .populate('toLocationId', 'name locationType')
      .populate('createdBy', 'firstName lastName')
      .sort({ transferDate: -1 })
      .limit(30)
      .lean();

    const stockTransfers = completedTransfers.map((t, i) => ({
      id: `st-${t._id}`,
      transferNumber: t.transferNumber,
      from: t.fromLocationId?.name || '—',
      to: t.toLocationId?.name || '—',
      lines: (t.items || []).length,
      qty: (t.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0),
      user: t.createdBy
        ? `${t.createdBy.firstName || ''} ${t.createdBy.lastName || ''}`.trim()
        : 'System',
      date: formatSaleDate(t.transferDate || t.createdAt),
    }));

    const productAgg = await Sale.aggregate([
      {
        $match: {
          tenantId: tenantObjectId(tenantId),
          createdAt: { $gte: start, $lte: end }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          sold: { $sum: '$items.quantity' }
        }
      },
      { $sort: { sold: -1 } },
      { $limit: 5 }
    ]);
    
    const fastMovingProducts = await Product.find({
      tenantId,
      _id: { $in: productAgg.map((p) => p._id).filter(Boolean) }
    }).select('_id name');
    
    const fastMovingProductMap = Object.fromEntries(
      fastMovingProducts.map((p) => [
        p._id.toString(),
        p.name
      ])
    );
    
    const fastMoving = productAgg.map((p) => ({
      name: (fastMovingProductMap[p._id?.toString()] || 'Item').slice(0, 12),
      sold: p.sold
    }));

  

    res.json({
      success: true,
      tenant: tenantInfo,
      warehouseStock,
      locationStock: warehouseStock,
      warehouseTransfers,
      stockTransfers,
      fastMoving,
      stats: {
        warehouseCount: warehouseStock.length,
        locationCount: warehouseStock.length,
        transferCount: stockTransfers.length,
        movementCount: warehouseTransfers.length,
        totalStockQty: warehouseStock.reduce((s, w) => s + w.totalQty, 0),
      },
    });
  } catch (err) {
    console.error('Warehouse report error:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/reports/product-performance
 */
exports.getProductPerformanceReport = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { range = 'month' } = req.query;
    const { start, end } = getDateRange(range);
    const tenant = await Tenant.findById(tenantId)
    .populate({
      path: 'ownerUserId',
      select: 'firstName lastName email'
    });
    const tenantInfo = {
      name: tenant?.name,
      ownerName: tenant?.ownerUserId
        ? `${tenant.ownerUserId.firstName || ''} ${tenant.ownerUserId.lastName || ''}`.trim()
        : 'N/A',
      ownerEmail: tenant?.ownerEmail,
      contact: tenant?.primaryContact?.phone || 'N/A'
    };
    const purchasedIds = await getPurchasedProductIds(tenantId);
    const purchasedIdList = [...purchasedIds];

    const productAgg = await Sale.aggregate([
      { $match: { tenantId: tenantObjectId(tenantId), createdAt: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      ...(purchasedIdList.length
        ? [{ $match: { 'items.productId': { $in: purchasedIdList.map((id) => tenantObjectId(id)) } } }]
        : [{ $match: { 'items.productId': null } }]),
      {
        $addFields: {
          netQty: {
            $max: [
              0,
              {
                $subtract: [
                  '$items.quantity',
                  { $ifNull: ['$items.returnedQty', 0] },
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$items.productId',
          sold: { $sum: '$netQty' },
          revenue: {
            $sum: {
              $multiply: [{ $ifNull: ['$items.unitPrice', 0] }, '$netQty'],
            },
          },
        },
      },
    ]);

    const products = await Product.find({
      tenantId,
      status: 'active',
      ...(purchasedIdList.length ? { _id: { $in: purchasedIdList } } : { _id: null }),
    }).select('name sku costPrice sellingPrice');
    const costMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));
    const skuMap = Object.fromEntries(products.map((p) => [p._id.toString(), p.sku]));
    const withProfit = productAgg.map((p, i) => {
      const prod = costMap[p._id?.toString()];
      const unitCost = prod?.costPrice || 0;
      const profit = Math.round(
        (p.revenue || 0) - unitCost * (p.sold || 0)
      );
    
      return {
        id: i + 1,
        productId: p._id,
    
        // CURRENT UPDATED PRODUCT NAME
        name: prod?.name || 'Unknown',
    
        sku: skuMap[p._id?.toString()] || '—',
        sold: p.sold,
        revenue: Math.round(p.revenue || 0),
        profit,
      };
    });
      
    const bestSelling = [...withProfit].sort((a, b) => b.sold - a.sold).slice(0, 5);
    const slowMoving = [...withProfit].filter((p) => p.sold > 0).sort((a, b) => a.sold - b.sold).slice(0, 5);
    const mostProfitable = [...withProfit].sort((a, b) => b.profit - a.profit).slice(0, 5);

    const soldIds = new Set(productAgg.map((p) => p._id?.toString()));
    const deadStock = products
      .filter((p) => !soldIds.has(p._id.toString()))
      .slice(0, 10)
      .map((p, i) => ({
        id: i + 1,
        name: p.name,
        sku: p.sku,
        sold: 0,
        revenue: 0,
        profit: 0,
      }));

    res.json({
      success: true,
      tenant: tenantInfo,
      productPerformance: {
        bestSelling,
        slowMoving,
        deadStock,
        mostProfitable,
      },
    });
  } catch (err) {
    console.error('Product performance report error:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/reports/expiry
 */
exports.getExpiryReport = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { filter } = req.query;
    const tenant = await Tenant.findById(tenantId)
    .populate({
      path: 'ownerUserId',
      select: 'firstName lastName email'
    });
    const tenantInfo = {
      name: tenant?.name,
      ownerName: tenant?.ownerUserId
        ? `${tenant.ownerUserId.firstName || ''} ${tenant.ownerUserId.lastName || ''}`.trim()
        : 'N/A',
      ownerEmail: tenant?.ownerEmail,
      contact: tenant?.primaryContact?.phone || 'N/A'
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Expiring Soon = next 6 months
const sixMonthsLater = new Date(today);
sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    const purchasedIds = await getPurchasedProductIds(tenantId);
    const purchasedIdList = [...purchasedIds];

    const batches = await Batch.find({
      tenantId,
      remainingQty: { $gt: 0 },
      expiryDate: { $ne: null },
      ...(purchasedIdList.length ? { productId: { $in: purchasedIdList } } : { productId: null }),
    })
      .populate('productId', 'name')
      .populate('warehouseId', 'name')
      .sort({ expiryDate: 1 });

    const expiryBatches = batches.map((b, i) => {
      const expiry = new Date(b.expiryDate);
      const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      const status = getExpiryStatus(daysLeft);
      return {
        id: i + 1,
        batch: b.batchNumber,
        product: b.productId?.name || '—',
        warehouse: b.warehouseId?.name || '—',
        location: b.warehouseId?.name || '—',
        qty: b.remainingQty,
        expiry: expiry.toISOString().split('T')[0],
        daysLeft,
        status,
      };
    });

    let filtered = expiryBatches;

    if (filter === 'expired') {
      filtered = expiryBatches.filter(
        (b) => b.status === 'expired'
      );
    } else if (filter === 'expiring') {
      filtered = expiryBatches.filter(
        (b) =>
          b.status === 'expiring' &&
          new Date(b.expiry) >= today &&
          new Date(b.expiry) <= sixMonthsLater
      );
    } else {
      // Default: show expired + batches expiring within next 6 months
      filtered = expiryBatches.filter(
        (b) =>
          b.status === 'expired' ||
          (
            new Date(b.expiry) >= today &&
            new Date(b.expiry) <= sixMonthsLater
          )
      );
    }
    res.json({
      success: true,
      tenant: tenantInfo,
      batches: filtered,
      allBatches: expiryBatches,
      stats: {
        total: expiryBatches.length,
        expiring: expiryBatches.filter((b) => ['critical', 'expiring'].includes(b.status)).length,
        expired: expiryBatches.filter((b) => b.status === 'expired').length,
      },
    });
  } catch (err) {
    console.error('Expiry report error:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/reports/user-activity?range=
 * Combined staff activity: sales, purchase receive/return, transfers, write-offs, inventory, logins
 */
exports.getUserActivityReport = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { range = 'month' } = req.query;
    const tenantInfo = await getTenantInfo(tenantId);

    let start;
    let end;
    if (range === 'all') {
      ({ start, end } = getDateRange('all'));
    } else {
      ({ start, end } = getDateRange(range));
    }
    const dateFilter = { createdAt: { $gte: start, $lte: end } };

    const [
      history,
      users,
      sales,
      receipts,
      purchaseReturns,
      transfers,
      writeOffs,
      returnExchanges,
      logins,
    ] = await Promise.all([
      Inventory.find({ tenantId, ...dateFilter })
        .populate('createdBy', 'firstName lastName')
        .populate('warehouseId', 'name locationType')
        .sort({ createdAt: -1 })
        .limit(80)
        .lean(),
      User.find({ tenantId }).select('firstName lastName email role status lastLoginAt').lean(),
      Sale.find({ tenantId, ...dateFilter }).select('invoiceId total createdAt receipt items paymentMethod').lean(),
      GoodsReceipt.find({ tenantId, status: 'posted', receivedDate: { $gte: start, $lte: end } })
        .populate('createdBy', 'firstName lastName')
        .populate('vendorId', 'name')
        .populate('locationId', 'name locationType')
        .lean(),
      PurchaseReturn.find({ tenantId, status: 'posted', returnDate: { $gte: start, $lte: end } })
        .populate('createdBy', 'firstName lastName')
        .populate('vendorId', 'name')
        .populate('locationId', 'name locationType')
        .lean(),
      StockTransfer.find({
        tenantId,
        status: 'completed',
        transferDate: { $gte: start, $lte: end },
      })
        .populate('createdBy', 'firstName lastName')
        .populate('fromLocationId', 'name locationType')
        .populate('toLocationId', 'name locationType')
        .lean(),
      WriteOff.find({ tenantId, ...dateFilter })
        .populate('processedBy', 'firstName lastName')
        .populate('productId', 'name')
        .lean(),
      ReturnExchange.find({ tenantId, ...dateFilter })
        .populate('processedBy', 'firstName lastName')
        .lean(),
      LoginHistory.find({ tenantId, ...dateFilter })
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(40)
        .lean(),
    ]);

    const userName = (u) =>
      u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Staff' : 'System';

    const activityTimeline = [];

    for (const h of history) {
      activityTimeline.push({
        id: `inv-${h._id}`,
        time: formatSaleDate(h.createdAt),
        rawDate: h.createdAt,
        user: userName(h.createdBy),
        type: h.type,
        action:
          h.type === 'adjust'
            ? `Adjust ${h.previousQuantity ?? 0} → ${h.newQuantity ?? 0}`
            : h.activityText || h.type,
        product: h.productName || '—',
        qty: h.quantity ?? '—',
        destination: h.warehouseId
          ? `${h.warehouseId.name} (${h.warehouseId.locationType || 'store'})`
          : '—',
      });
    }

    for (const s of sales) {
      activityTimeline.push({
        id: `sale-${s._id}`,
        time: formatSaleDate(s.createdAt),
        rawDate: s.createdAt,
        user: s.receipt?.cashier || 'POS',
        type: 'sale',
        action: `Sale ${s.invoiceId || ''} · ${s.paymentMethod || 'cash'}`,
        product: `${(s.items || []).length} item(s)`,
        qty: (s.items || []).reduce((a, i) => a + (Number(i.quantity) || 0), 0),
        destination: 'Store / POS',
        amount: Math.round(Number(s.total) || 0),
      });
    }

    for (const gr of receipts) {
      activityTimeline.push({
        id: `grn-${gr._id}`,
        time: formatSaleDate(gr.receivedDate || gr.createdAt),
        rawDate: gr.receivedDate || gr.createdAt,
        user: userName(gr.createdBy),
        type: 'purchase_receive',
        action: `GRN ${gr.grnNumber} · ${gr.vendorId?.name || 'Vendor'}`,
        product: `${(gr.items || []).length} line(s)`,
        qty: (gr.items || []).reduce((a, i) => a + (Number(i.quantity) || 0), 0),
        destination: gr.locationId
          ? `${gr.locationId.name} (${gr.locationId.locationType || 'store'})`
          : '—',
        amount: Math.round(Number(gr.subtotal) || 0),
      });
    }

    for (const pr of purchaseReturns) {
      activityTimeline.push({
        id: `pr-${pr._id}`,
        time: formatSaleDate(pr.returnDate || pr.createdAt),
        rawDate: pr.returnDate || pr.createdAt,
        user: userName(pr.createdBy),
        type: 'purchase_return',
        action: `Purchase Return ${pr.returnNumber} · ${pr.vendorId?.name || 'Vendor'}`,
        product: `${(pr.items || []).length} line(s)`,
        qty: (pr.items || []).reduce((a, i) => a + (Number(i.quantity) || 0), 0),
        destination: pr.locationId
          ? `${pr.locationId.name} (${pr.locationId.locationType || 'store'})`
          : '—',
        amount: Math.round(Number(pr.totalAmount) || 0),
      });
    }

    for (const t of transfers) {
      const from = t.fromLocationId?.name || t.fromWarehouseId?.name || '—';
      const to = t.toLocationId?.name || t.toWarehouseId?.name || '—';
      activityTimeline.push({
        id: `xfer-${t._id}`,
        time: formatSaleDate(t.transferDate || t.createdAt),
        rawDate: t.transferDate || t.createdAt,
        user: userName(t.createdBy),
        type: 'transfer',
        action: `Transfer ${t.transferNumber || ''} · ${from} → ${to}`,
        product: `${(t.items || []).length} line(s)`,
        qty: (t.items || []).reduce((a, i) => a + (Number(i.quantity) || 0), 0),
        destination: `${from} → ${to}`,
      });
    }

    for (const w of writeOffs) {
      activityTimeline.push({
        id: `wo-${w._id}`,
        time: formatSaleDate(w.createdAt),
        rawDate: w.createdAt,
        user: userName(w.processedBy),
        type: 'write_off',
        action: `Write-off (${w.condition || 'damaged'})`,
        product: w.productName || w.productId?.name || '—',
        qty: w.quantity ?? '—',
        destination: 'Write-off',
        amount: Math.round(Number(w.lineValue) || 0),
      });
    }

    for (const re of returnExchanges) {
      activityTimeline.push({
        id: `re-${re._id}`,
        time: formatSaleDate(re.createdAt),
        rawDate: re.createdAt,
        user: userName(re.processedBy),
        type: re.type || 'return',
        action: `${re.type === 'exchange' ? 'Exchange' : 'Customer Return'} ${re.originalInvoiceId || ''}`,
        product: `${(re.returnedItems || []).length} item(s)`,
        qty: (re.returnedItems || []).reduce((a, i) => a + (Number(i.quantity) || 0), 0),
        destination: 'POS Returns',
        amount: Math.round(Number(re.refundAmount) || 0),
      });
    }

    for (const login of logins) {
      activityTimeline.push({
        id: `login-${login._id}`,
        time: formatSaleDate(login.createdAt || login.loginAt),
        rawDate: login.createdAt || login.loginAt,
        user: userName(login.userId),
        type: 'login',
        action: 'User login',
        product: '—',
        qty: '—',
        destination: '—',
      });
    }

    activityTimeline.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
    const timeline = activityTimeline.slice(0, 150);

    const staffUsers = users.map((u, i) => ({
      id: i + 1,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      email: u.email,
      role: u.role,
      status: u.status === 'active' ? 'active' : u.status,
      lastLogin: u.lastLoginAt
        ? new Date(u.lastLoginAt).toLocaleString('en-PK', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '—',
    }));

    const countType = (type) => timeline.filter((a) => a.type === type).length;

    res.json({
      success: true,
      tenant: tenantInfo,
      range,
      users: staffUsers,
      activityTimeline: timeline,
      stats: {
        staffCount: staffUsers.length,
        sales: sales.length,
        purchaseReceives: receipts.length,
        purchaseReturns: purchaseReturns.length,
        transfers: transfers.length,
        writeOffs: writeOffs.length,
        customerReturns: returnExchanges.length,
        stockIn: countType('stock_in') + countType('purchase_receive') + countType('transfer_in'),
        stockOut: countType('stock_out') + countType('transfer_out'),
        logins: logins.length,
        totalEvents: timeline.length,
      },
    });
  } catch (err) {
    console.error('User activity report error:', err);
    res.status(500).json({ message: err.message });
  }
};