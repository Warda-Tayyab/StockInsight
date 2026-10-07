const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth/authMiddleware');
const { getAdminDashboard } = require('../controllers/adminController');

router.get('/', authenticate, authorize({ requireSuperAdmin: true }), getAdminDashboard);

module.exports = router;
