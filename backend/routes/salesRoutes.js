
const express = require('express');
const router = express.Router();

const { createSale , getSales,getTodayStats,getTodayTransactions} = require('../controllers/salesController');
const { authenticate, authorize } = require('../middleware/auth/authMiddleware');

const posAuth = [
  authenticate,
  authorize({ roles: ['owner', 'manager', 'cashier', 'staff'], requireTenantActive: true }),
];

// POS SALE API
router.post('/', ...posAuth, createSale);
router.get('/', ...posAuth, getSales);
router.get('/today-stats', ...posAuth, getTodayStats);
router.get('/today-transactions', ...posAuth, getTodayTransactions);
module.exports = router;