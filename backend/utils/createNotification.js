const Notification = require('../models/tenant/Notification');
const User = require('../models/tenant/User');

const toTenantRoom = (tenantId) => String(tenantId);

const shouldEmitInApp = async (tenantId, type) => {
  try {
    const owners = await User.find({
      tenantId,
      role: 'owner',
      status: 'active',
    }).select('notificationPrefs');

    if (!owners.length) return true;

    const isLowStock = ['low-stock', 'out-of-stock', 'expiring', 'expired'].includes(type);
    const isSales = type === 'sale' || type === 'sales';

    return owners.some((u) => {
      const prefs = u.notificationPrefs || {};
      if (isLowStock) return prefs.lowStockInApp !== false;
      if (isSales) return prefs.salesInApp !== false;
      return true;
    });
  } catch {
    return true;
  }
};

const createNotification = async (io, data) => {
  if (!data?.tenantId) {
    throw new Error('tenantId is required to create a notification');
  }

  const tenantId = data.tenantId;
  const tenantRoom = toTenantRoom(tenantId);
  const allowEmit = await shouldEmitInApp(tenantId, data.type);

  const dedupeQuery = {
    tenantId,
    type: data.type,
    productId: data.productId,
    isRead: false,
  };

  if (data.batchId) {
    dedupeQuery.batchId = data.batchId;
  }

  const existing = await Notification.findOne(dedupeQuery);

  const emitPayload = (notification, dataExtra = {}) => {
    const locName = notification.warehouseId?.name || dataExtra.locationName || data.locationName || '';
    const locType = notification.warehouseId?.locationType || dataExtra.locationType || data.locationType || 'store';
    const dest = dataExtra.destination || data.destination || (locName ? `${locName} (${locType === 'warehouse' ? 'Warehouse' : 'Store'})` : '');

    return {
      id: notification._id || notification.id,
      tenantId: tenantRoom,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      destination: dest,
      locationName: locName,
      locationType: locType,
      createdAt: notification.createdAt,
    };
  };

  if (existing) {
    existing.title = data.title;
    existing.message = data.message;
    existing.priority = data.priority;

    await existing.save();

    const populatedExisting = await Notification.findById(existing._id)
      .populate('productId', 'name sku')
      .populate('warehouseId', 'name locationType')
      .populate('batchId', 'batchNumber expiryDate');

    if (io && allowEmit) {
      io.to(tenantRoom).emit('new-alert', {
        ...emitPayload(populatedExisting, data),
        product: populatedExisting.productId,
        warehouse: populatedExisting.warehouseId,
        batch: populatedExisting.batchId,
      });
    }

    return existing;
  }

  const notification = await Notification.create({
    ...data,
    tenantId,
  });

  const populatedNotification = await Notification.findById(notification._id)
    .populate('productId', 'name sku')
    .populate('warehouseId', 'name locationType')
    .populate('batchId', 'batchNumber expiryDate');

  if (io && allowEmit) {
    io.to(tenantRoom).emit('new-alert', {
      ...emitPayload(populatedNotification, data),
      product: populatedNotification.productId,
      warehouse: populatedNotification.warehouseId,
      batch: populatedNotification.batchId,
    });
  }

  return notification;
};

module.exports = createNotification;
