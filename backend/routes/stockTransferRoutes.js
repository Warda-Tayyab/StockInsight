const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth/authMiddleware');
const transfer = require('../controllers/stockTransferController');

const auth = [authenticate, authorize({ roles: ['owner', 'manager'], requireTenantActive: true })];

router.get('/', ...auth, transfer.listTransfers);
router.get('/source-options', ...auth, transfer.getTransferSourceOptions);
router.post('/', ...auth, transfer.createTransfer);
router.get('/:id', ...auth, transfer.getTransfer);
router.post('/:id/complete', ...auth, transfer.completeTransfer);

module.exports = router;
