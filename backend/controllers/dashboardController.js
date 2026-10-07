/**
 * ======================================================
 * ✅ DASHBOARD CONTROLLER (DYNAMIC ANALYTICS + STATS)
 * ======================================================
 */
const mongoose = require("mongoose");
const Product = require('../models/tenant/Product');
const Stock = require('../models/tenant/Stock');
const Sale = require('../models/tenant/Sale');
const Batch = require('../models/tenant/Batch');
const { getSaleNetTotal, getSaleNetDetails } = require('../utils/reportHelpers');
const { getPurchasedStockSummary, getPurchasedExpiryAlerts, buildPurchasedStockByName, classifyStockItem, getPurchasedStockAlerts } = require('../utils/lowStockHelpers');
exports.getDashboardStats = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;

    // ======================================================
    // 📌 GET RANGE FROM FRONTEND
    // Default = 6 months
    // ======================================================
    const range = req.query.range || "6months";

    let monthsToFetch = 6;

    if (range === "3months") monthsToFetch = 3;
    if (range === "12months") monthsToFetch = 12;

    // ======================================================
    // 📦 TOTAL ACTIVE PRODUCTS
    // ======================================================
    const totalProducts = await Product.countDocuments({
      tenantId,
      status: "active"
    });

    // ======================================================
    // 📈 PRODUCT TREND
    // ======================================================
    const lastWeekProducts = await Product.countDocuments({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      status: "active",
      createdAt: {
        $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    });

    let productTrend = 0;

    if (lastWeekProducts === 0 && totalProducts > 0) {
      productTrend = 100;
    } else if (lastWeekProducts > 0) {
      productTrend =
        ((totalProducts - lastWeekProducts) / lastWeekProducts) * 100;
    }

    const sales = await Sale.find({ tenantId });

    let netSales = 0;
    let totalTax = 0;
    let couponDiscounts = 0;

    sales.forEach((sale) => {
      const details = getSaleNetDetails(sale);
      netSales += details.netSales;
      totalTax += details.tax;
      couponDiscounts += details.couponDiscount;
    });

    const totalSales = netSales + totalTax;
    const totalTransactions = sales.length;

   

    // ======================================================
    // ⚠️ STOCK ANALYSIS (purchased products, merged by name)
    // ======================================================
    const stockSummary = await getPurchasedStockSummary(tenantId);
    const lowStockCount = stockSummary.lowStock;
    const outOfStockCount = stockSummary.outOfStock;
    const inStockCount = stockSummary.inStock;
    let overstockCount = 0;

    const { items: stockItems } = await buildPurchasedStockByName(tenantId);
    stockItems.forEach((item) => {
      const classified = classifyStockItem(item);
      if (
        !classified.alertType &&
        classified.min > 0 &&
        classified.current > classified.min * 3
      ) {
        overstockCount++;
      }
    });

    const totalAlerts = stockSummary.lowStockCount;

    // ======================================================
    // 📉 LOW STOCK TREND
    // ======================================================
    const lastWeekStocks = await Stock.find({
      tenantId,
      updatedAt: {
        $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }).populate("productId", "reorderLevel");

    let lastWeekLowStock = 0;

    lastWeekStocks.forEach(stock => {
      const reorderLevel = stock.productId?.reorderLevel || 0;

      if (stock.quantity <= reorderLevel) {
        lastWeekLowStock++;
      }
    });

    let lowStockTrend = 0;

    if (lastWeekLowStock === 0 && lowStockCount > 0) {
      lowStockTrend = 100;
    } else if (lastWeekLowStock > 0) {
      lowStockTrend =
        ((lowStockCount - lastWeekLowStock) / lastWeekLowStock) * 100;
    }
 // ==========================
    // ⚠️ STOCK DATA (USED FOR ALERT LOGIC)
    // ==========================
   
 // ==========================
// ⏰ EXPIRY ALERTS
// ==========================
const today = new Date();

// Expiring Soon = next 6 months
const sixMonthsLater = new Date(today);
sixMonthsLater.setMonth(
  sixMonthsLater.getMonth() + 6
);

// ==========================
// 🟠 EXPIRING SOON COUNT
// ==========================
const expiringCount = await Batch.countDocuments({
  tenantId,
  expiryDate: {
    $gte: today,
    $lte: sixMonthsLater
  },
  remainingQty: { $gt: 0 }
});

// ==========================
// 🔴 EXPIRED COUNT
// ==========================
const expiredCount = await Batch.countDocuments({
  tenantId,
  expiryDate: { $lt: today },
  remainingQty: { $gt: 0 }
});

    // ==========================
    // ⚡ ACTIVE ALERTS (same logic as stock alerts page)
    // ==========================
    const [{ alerts: purchasedStockAlerts }, purchasedExpiryAlerts] = await Promise.all([
      getPurchasedStockAlerts(tenantId, { byLocation: true }),
      getPurchasedExpiryAlerts(tenantId),
    ]);

    const activeAlerts = purchasedStockAlerts.length + purchasedExpiryAlerts.length;
    // ======================================================
    // 📊 ANALYTICS CHART DATA
    // Monthly Sales + Monthly Stock Count
    // ======================================================
    const analyticsData = [];

    for (let i = monthsToFetch - 1; i >= 0; i--) {

      // 🔹 Month start
      const start = new Date();
      start.setMonth(start.getMonth() - i);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      // 🔹 Month end
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      // ======================================================
      // 💰 MONTHLY SALES
      // ======================================================
      const monthlySales = await Sale.find({
        tenantId,
        createdAt: {
          $gte: start,
          $lt: end
        }
      });

      const salesTotal = monthlySales.reduce((sum, sale) => sum + getSaleNetTotal(sale), 0);

      // ======================================================
      // 📦 MONTHLY STOCK COUNT
      // Total quantity added/available that month
      // ======================================================
      const monthlyStocks = await Stock.find({
        tenantId,
        createdAt: {
          $gte: start,
          $lt: end
        }
      });

      const stockTotal = monthlyStocks.reduce(
        (sum, stock) => sum + (stock.quantity || 0),
        0
      );

      // ======================================================
      // 📌 PUSH MONTH DATA
      // ======================================================
      analyticsData.push({
        month: start.toLocaleString("default", {
          month: "short"
        }),
        sales: salesTotal,
        stock: stockTotal
      });
    }

    // ======================================================
    // 📈 SALES TREND (90 DAYS) — weekly buckets
    // ======================================================
    const days90Ago = new Date();
    days90Ago.setDate(days90Ago.getDate() - 90);
    days90Ago.setHours(0, 0, 0, 0);

    const salesLast90 = await Sale.find({
      tenantId,
      createdAt: { $gte: days90Ago }
    })
      .select("total tax items createdAt")
      .lean();

    const weekBuckets = {};
    for (let i = 0; i < 13; i++) {
      const weekStart = new Date(days90Ago);
      weekStart.setDate(days90Ago.getDate() + i * 7);
      const key = weekStart.toISOString().slice(0, 10);
      weekBuckets[key] = {
        label: weekStart.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit"
        }),
        revenue: 0,
        sortKey: weekStart.getTime()
      };
    }

    salesLast90.forEach((sale) => {
      const d = new Date(sale.createdAt);
      const daysFromStart = Math.floor((d - days90Ago) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.min(12, Math.max(0, Math.floor(daysFromStart / 7)));
      const weekStart = new Date(days90Ago);
      weekStart.setDate(days90Ago.getDate() + weekIndex * 7);
      const key = weekStart.toISOString().slice(0, 10);
      if (weekBuckets[key]) {
        weekBuckets[key].revenue += getSaleNetTotal(sale);
      }
    });

    const salesTrend90 = Object.values(weekBuckets)
      .sort((a, b) => a.sortKey - b.sortKey)
      .map((w) => ({
        label: w.label,
        revenue: Math.round(w.revenue)
      }));

    const stockHealth = {
      healthy: inStockCount,
      low: lowStockCount,
      out: outOfStockCount,
      overstock: overstockCount
    };

    // ======================================================
    // 🚀 FINAL RESPONSE
    // ======================================================
    res.json({
      totalProducts,
      lowStockCount,
      inStockCount,
      outOfStockCount,
      overstockCount,
      activeAlerts,
      expiringCount,
      expiredCount,
      totalSales: Math.round(totalSales),
      netSales: Math.round(netSales),
      totalTax: Math.round(totalTax),
      couponDiscounts: Math.round(couponDiscounts),
      totalTransactions,

      productTrend: Number(productTrend.toFixed(1)),
      lowStockTrend: Number(lowStockTrend.toFixed(1)),

      analyticsData,
      salesTrend90,
      stockHealth
    });

  } catch (err) {
    console.error("Dashboard Error:", err);

    res.status(500).json({
      message: err.message
    });
  }
};



exports.getTopSellingProducts = async (req, res) => {
  try {
    const tenantId = new mongoose.Types.ObjectId(req.auth.tenantId);

    // ======================================================
    // RANGE
    // ======================================================
    const range = req.query.range || "month";

    let startDate = new Date();

    if (range === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (range === "3months") {
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      startDate = new Date("2000-01-01");
    }

    // ======================================================
    // CURRENT PERIOD
    // ======================================================
    const current = await Sale.aggregate([
      {
        $match: {
          tenantId,
          createdAt: { $gte: startDate }
        }
      },

      { $unwind: "$items" },

      {
        $group: {
          _id: "$items.productId",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.lineTotal" }
        }
      },

      // ======================================================
      // GET CURRENT PRODUCT NAME FROM PRODUCT COLLECTION
      // ======================================================
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },

      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $project: {
          _id: 1,
          productName: "$product.name",
          totalSold: 1,
          totalRevenue: 1
        }
      }
    ]);

    // ======================================================
    // PREVIOUS PERIOD (same length)
    // ======================================================
    const previousStart = new Date(startDate);

    if (range === "week") {
      previousStart.setDate(previousStart.getDate() - 7);
    } else if (range === "month") {
      previousStart.setMonth(previousStart.getMonth() - 1);
    } else if (range === "3months") {
      previousStart.setMonth(previousStart.getMonth() - 3);
    } else {
      previousStart.setFullYear(previousStart.getFullYear() - 1);
    }

    const previous = await Sale.aggregate([
      {
        $match: {
          tenantId,
          createdAt: {
            $gte: previousStart,
            $lt: startDate
          }
        }
      },

      { $unwind: "$items" },

      {
        $group: {
          _id: "$items.productId",
          totalSold: { $sum: "$items.quantity" }
        }
      }
    ]);

    // ======================================================
    // MAP PREVIOUS DATA
    // ======================================================
    const prevMap = {};

    previous.forEach((p) => {
      prevMap[p._id.toString()] = p.totalSold;
    });

    // ======================================================
    // SORT TOP PRODUCTS
    // ======================================================
    const sorted = current
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 3);

    // ======================================================
    // FORMAT RESPONSE
    // ======================================================
    const maxSold = sorted[0]?.totalSold || 1;

    const formattedProducts = sorted.map((product, index) => {
      const prevSold =
        prevMap[product._id.toString()] || 0;

      let growth = 0;

      if (prevSold === 0 && product.totalSold > 0) {
        growth = 100;
      } else if (prevSold > 0) {
        growth =
          ((product.totalSold - prevSold) / prevSold) * 100;
      }

      return {
        id: index + 1,
        productId: product._id,

        // CURRENT NAME FROM PRODUCT COLLECTION
        name: product.productName,

        sold: product.totalSold,

        revenue: `Rs ${
          product.totalRevenue?.toLocaleString() || 0
        }`,

        percentage: Math.round(
          (product.totalSold / maxSold) * 100
        ),

        growth:
          prevSold === 0 && product.totalSold > 0
            ? "New"
            : `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`
      };
    });

    // ======================================================
    // RESPONSE
    // ======================================================
    res.status(200).json({
      success: true,
      products: formattedProducts
    });

  } catch (err) {
    console.error("Top Products Error:", err);

    res.status(500).json({
      message: err.message
    });
  }
};