const AdminActivity = require('../models/shared/AdminActivity');
const Tenant = require('../models/shared/Tenant');
const Plan = require('../models/shared/Plan');

const { PROFESSIONAL_ACTIVITY_TYPES } = AdminActivity;

const formatActivity = (activity) => ({
  id: activity._id?.toString() || activity.id,
  type: activity.type,
  title: activity.title,
  description: activity.description || '',
  entityType: activity.entityType,
  entityId: activity.entityId?.toString?.() || activity.entityId,
  metadata: activity.metadata || {},
  timestamp: activity.timestamp || activity.createdAt
});

const isNewRecord = (record) =>
  !record.updatedAt ||
  Math.abs(new Date(record.createdAt) - new Date(record.updatedAt)) < 1000;

const buildFallbackActivities = async () => {
  const [tenants, plans] = await Promise.all([
    Tenant.find().sort({ createdAt: -1 }).limit(3).lean(),
    Plan.find().sort({ updatedAt: -1 }).limit(8).lean()
  ]);

  const activities = [];

  tenants.forEach((tenant) => {
    activities.push(
      formatActivity({
        id: `fallback-tenant-created-${tenant._id}`,
        type: 'tenant_created',
        title: 'New tenant created',
        description: `${tenant.name} was onboarded to the platform`,
        entityType: 'tenant',
        entityId: tenant._id,
        metadata: { tenantName: tenant.name, status: tenant.status, plan: tenant.plan },
        timestamp: tenant.createdAt
      })
    );
  });

  plans.forEach((plan) => {
    const isNew = isNewRecord(plan);

    if (isNew) {
      activities.push(
        formatActivity({
          id: `fallback-plan-created-${plan._id}`,
          type: 'plan_created',
          title: 'Pricing plan created',
          description: `${plan.displayName} plan was added ($${plan.price}/mo)`,
          entityType: 'plan',
          entityId: plan._id,
          metadata: { planName: plan.displayName, price: plan.price },
          timestamp: plan.createdAt
        })
      );
    } else {
      activities.push(
        formatActivity({
          id: `fallback-plan-updated-${plan._id}-${plan.updatedAt}`,
          type: 'plan_updated',
          title: 'Pricing plan updated',
          description: `${plan.displayName} plan was modified ($${plan.price}/mo)`,
          entityType: 'plan',
          entityId: plan._id,
          metadata: { planName: plan.displayName, price: plan.price },
          timestamp: plan.updatedAt
        })
      );
    }
  });

  return activities;
};

const getRecentActivities = async (limit = 15) => {
  const logged = await AdminActivity.find({ type: { $in: PROFESSIONAL_ACTIVITY_TYPES } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  if (logged.length >= limit) {
    return logged.map(formatActivity);
  }

  const loggedFormatted = logged.map(formatActivity);
  const seenIds = new Set(loggedFormatted.map((item) => item.id));

  const fallback = await buildFallbackActivities();
  const merged = [...loggedFormatted];

  fallback
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach((item) => {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        merged.push(item);
      }
    });

  return merged
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
};

module.exports = { getRecentActivities, formatActivity, PROFESSIONAL_ACTIVITY_TYPES };
