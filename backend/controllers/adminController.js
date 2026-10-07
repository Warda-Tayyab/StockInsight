const Tenant = require('../models/shared/Tenant');
const User = require('../models/tenant/User');
const Plan = require('../models/shared/Plan');
const { getRecentActivities } = require('../utils/recentActivityHelper');

const buildPlanPricingMap = (plans) => {
  const map = {};
  plans.forEach((plan) => {
    map[plan.name.toLowerCase()] = {
      displayName: plan.displayName,
      price: plan.price,
      color: plan.color
    };
  });
  return map;
};

const getPlanRevenue = (planSlug, planPricingMap) => {
  const key = (planSlug || 'free').toLowerCase();
  return planPricingMap[key]?.price ?? 0;
};

const getPlanDisplayName = (planSlug, planPricingMap) => {
  const key = (planSlug || 'free').toLowerCase();
  return planPricingMap[key]?.displayName ?? planSlug ?? 'Unknown';
};

const getLastMonths = (count) => {
  const now = new Date();
  const months = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: date.toLocaleString('default', { month: 'short' }),
      year: date.getFullYear(),
      month: date.getMonth(),
      date
    });
  }

  return months;
};

const isSameMonth = (date, monthInfo) => {
  if (!date) return false;
  return (
    date.getFullYear() === monthInfo.year &&
    date.getMonth() === monthInfo.month
  );
};

exports.getAdminDashboard = async (req, res) => {
  try {
    const [tenants, users, totalUsers, plans] = await Promise.all([
      Tenant.find().lean(),
      User.find({}, 'createdAt').lean(),
      User.countDocuments(),
      Plan.find({ isActive: true }).sort({ sortOrder: 1 }).lean()
    ]);

    const planPricingMap = buildPlanPricingMap(plans);

    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((tenant) => tenant.status === 'active').length;
    const totalRevenue = tenants.reduce((sum, tenant) => {
      if (tenant.status !== 'active') return sum;
      return sum + getPlanRevenue(tenant.plan, planPricingMap);
    }, 0);

    const planDistribution = plans.map((plan) => ({
      name: plan.displayName,
      value: 0,
      color: plan.color
    }));

    tenants.forEach((tenant) => {
      const planKey = (tenant.plan || 'free').toLowerCase();
      const displayName = getPlanDisplayName(tenant.plan, planPricingMap);
      let item = planDistribution.find(
        (p) => p.name.toLowerCase() === displayName.toLowerCase()
      );
      if (!item) {
        item = planDistribution.find(
          (p) => plans.some((pl) => pl.displayName === p.name && pl.name === planKey)
        );
      }
      if (item) item.value += 1;
    });

    const months = getLastMonths(6);

    const growthTrends = months.map((monthInfo) => ({
      month: monthInfo.label,
      users: users.filter((user) => isSameMonth(new Date(user.createdAt), monthInfo)).length,
      orders: tenants.filter((tenant) => isSameMonth(new Date(tenant.createdAt), monthInfo)).length
    }));

    const revenueTrend = months.map((monthInfo) => {
      const monthEnd = new Date(monthInfo.year, monthInfo.month + 1, 1);
      const revenue = tenants
        .filter((tenant) => tenant.status === 'active' && new Date(tenant.createdAt) < monthEnd)
        .reduce((sum, tenant) => sum + getPlanRevenue(tenant.plan, planPricingMap), 0);

      return {
        month: monthInfo.label,
        revenue
      };
    });

    const recentActivities = await getRecentActivities(15);
console.log("RAW recentActivities:", recentActivities);
    res.json({
      dashboardSummary: {
        totalTenants,
        totalUsers,
        totalRevenue
      },
      activeSubscriptions: activeTenants,
      growthTrends,
      planDistribution,
      revenueTrend,
      recentActivities
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Failed to load admin dashboard data' });
  }
};

exports.getRevenueData = async (req, res) => {
  try {
    const [tenants, plans] = await Promise.all([
      Tenant.find().lean(),
      Plan.find({ isActive: true }).sort({ sortOrder: 1 }).lean()
    ]);

    const planPricingMap = buildPlanPricingMap(plans);

    const activeSubscriptions = tenants.filter((tenant) => tenant.status === 'active').length;
    const totalRevenue = tenants.reduce((sum, tenant) => {
      if (tenant.status !== 'active') return sum;
      return sum + getPlanRevenue(tenant.plan, planPricingMap);
    }, 0);

    const months = getLastMonths(6);

    const revenueTrendFull = months.map((monthInfo) => {
      const monthEnd = new Date(monthInfo.year, monthInfo.month + 1, 1);
      const revenue = tenants
        .filter((tenant) => tenant.status === 'active' && new Date(tenant.createdAt) < monthEnd)
        .reduce((sum, tenant) => sum + getPlanRevenue(tenant.plan, planPricingMap), 0);

      return {
        month: monthInfo.label,
        revenue
      };
    });

    const subscriptionsTable = tenants
      .map((tenant) => ({
        id: tenant._id,
        tenant: tenant.name,
        plan: getPlanDisplayName(tenant.plan, planPricingMap),
        mrr: getPlanRevenue(tenant.plan, planPricingMap),
        status: tenant.status === 'active' ? 'Active' : tenant.status === 'trial' ? 'Trial' : 'Suspended'
      }))
      .sort((a, b) => b.mrr - a.mrr);

    res.json({
      revenueData: {
        totalRevenue,
        activeSubscriptions
      },
      revenueTrendFull,
      subscriptionsTable
    });
  } catch (error) {
    console.error('Admin revenue error:', error);
    res.status(500).json({ message: 'Failed to load revenue data' });
  }
};
