const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth/authMiddleware');
const {
  getOverview,
  getSalesReport,
  getInventoryReport,
  getLowStockReport,
  getProfitLossReport,
  getPurchaseReport,
  getWarehouseReport,
  getProductPerformanceReport,
  getExpiryReport,
  getUserActivityReport,
} = require('../controllers/reportController');

const reportAuth = [
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
];

router.get('/overview', ...reportAuth, getOverview);
router.get('/sales', ...reportAuth, getSalesReport);
router.get('/inventory', ...reportAuth, getInventoryReport);
router.get('/low-stock', ...reportAuth, getLowStockReport);
router.get('/profit-loss', ...reportAuth, getProfitLossReport);
router.get('/purchasing', ...reportAuth, getPurchaseReport);
router.get('/warehouse', ...reportAuth, getWarehouseReport);
router.get('/product-performance', ...reportAuth, getProductPerformanceReport);
router.get('/expiry', ...reportAuth, getExpiryReport);
router.get('/user-activity', ...reportAuth, getUserActivityReport);

module.exports = router;
