const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth/authMiddleware');
const { getPolicy, updatePolicy } = require('../controllers/returnExchangePolicyController');
const {
  lookupSale,
  processReturn,
  processExchange,
  getHistory,
  getWriteOffs,
  previewSettlement
} = require('../controllers/returnExchangeController');

const posAuth = [
  authenticate,
  authorize({ roles: ['owner', 'manager', 'cashier', 'staff'], requireTenantActive: true })
];

const settingsAuth = [
  authenticate,
  authorize({ roles: ['owner'], requireTenantActive: true })
];

router.get('/policy', ...posAuth, getPolicy);
router.put('/policy', ...settingsAuth, updatePolicy);

router.get('/lookup/:invoiceId', ...posAuth, lookupSale);
router.post('/return', ...posAuth, processReturn);
router.post('/exchange', ...posAuth, processExchange);
router.post('/preview-settlement', ...posAuth, previewSettlement);
router.get('/history', ...posAuth, getHistory);
router.get('/write-offs', ...posAuth, getWriteOffs);

module.exports = router;
