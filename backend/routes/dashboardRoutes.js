const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth/authMiddleware');

const { getDashboardStats,getTopSellingProducts } = require('../controllers/dashboardController');


// ======================================================
// 📊 DASHBOARD MAIN STATS
// ======================================================
router.get(
  '/',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
  getDashboardStats
);
// ======================================================
// 🏆 TOP SELLING PRODUCTS
// ======================================================
router.get(
  '/top-products',
  authenticate,
  authorize({
    roles: ['owner', 'manager'],
    requireTenantActive: true
  }),
  getTopSellingProducts
);
module.exports = router;