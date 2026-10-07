const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth/authMiddleware');
const { getRevenueData } = require('../controllers/adminController');

router.get('/', authenticate, authorize({ requireSuperAdmin: true }), getRevenueData);

module.exports = router;
