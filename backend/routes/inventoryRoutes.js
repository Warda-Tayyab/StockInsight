const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth/authMiddleware');

const {
  getInventory,
  getInventorySummary,
  createInventory,
  stockOutInventory,
  adjustInventory,
  getInventoryHistory,
   getProductUsageHistory,
   getBatchUsageHistory,
  getLowStockItems,
  getStockAlerts,
  getRecentNotifications,
  markNotificationsRead,
} = require('../controllers/inventoryController');

router.get(
  '/summary',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
  getInventorySummary
);

router.get(
  '/',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
  getInventory
);

router.post(
  '/stock-in',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
  createInventory
);
router.post(
  '/stock-out',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
  stockOutInventory
);
router.post(
  '/adjust',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
  adjustInventory
);
router.get(
  '/history',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
  getInventoryHistory
);
router.get(
  '/product/:productId/history',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
  getProductUsageHistory
);

router.get(
  '/batch/:batchId/history',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
  getBatchUsageHistory
);
router.get(
  '/low-stock',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
  getLowStockItems
);
router.get(
  '/alerts',
  authenticate,
  authorize({ roles: ['owner', 'manager'] }),
  getStockAlerts
);

router.get(
  '/notifications',
  authenticate,
  authorize({
    roles: ['owner', 'manager', 'cashier', 'staff'],
    requireTenantActive: true,
  }),
  getRecentNotifications
);

router.patch(
  '/notifications/read',
  authenticate,
  authorize({
    roles: ['owner', 'manager', 'cashier', 'staff'],
    requireTenantActive: true,
  }),
  markNotificationsRead
);

module.exports = router;

