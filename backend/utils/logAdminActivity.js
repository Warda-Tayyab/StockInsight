const AdminActivity = require('../models/shared/AdminActivity');

const logAdminActivity = async ({
  type,
  title,
  description = '',
  entityType = 'tenant',
  entityId,
  metadata = {}
}) => {
  try {
    return await AdminActivity.create({
      type,
      title,
      description,
      entityType,
      entityId,
      metadata
    });
  } catch (error) {
    console.error('Failed to log admin activity:', error);
    return null;
  }
};

module.exports = logAdminActivity;
