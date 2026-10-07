const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth/authMiddleware');

const {
  createBatch,
  getBatches,
  getProductBatches,
  getBatchById
} = require('../controllers/batchController');

/**
 * ======================================================
 * 🔒 ALL ROUTES → OWNER ONLY (TENANT ACTIVE REQUIRED)
 * ======================================================
 */

/**
 * ✅ CREATE BATCH
 * (Usually internal use - stock-in flow)
 */
router.post(
  '/',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
  createBatch
);

/**
 * ✅ GET ALL BATCHES
 */
router.get(
  '/',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
  getBatches
);

/**
 * ✅ GET PRODUCT BATCHES (Frontend ProductDetails)
 */
router.get(
  '/product/:productId',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
  getProductBatches
);

/**
 * ✅ GET SINGLE BATCH DETAILS
 */
router.get(
  '/:id',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
  getBatchById
);

module.exports = router;