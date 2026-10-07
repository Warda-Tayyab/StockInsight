const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth/authMiddleware');
const purchase = require('../controllers/purchaseController');

const auth = [authenticate, authorize({ roles: ['owner', 'manager'], requireTenantActive: true })];

router.get('/summary', ...auth, purchase.getPurchaseSummary);

router.get('/vendors', ...auth, purchase.listVendors);
router.post('/vendors', ...auth, purchase.createVendor);
router.get('/vendors/:id', ...auth, purchase.getVendor);
router.put('/vendors/:id', ...auth, purchase.updateVendor);

router.get('/orders', ...auth, purchase.listPurchaseOrders);
router.post('/orders', ...auth, purchase.createPurchaseOrder);
router.get('/orders/:id', ...auth, purchase.getPurchaseOrder);
router.put('/orders/:id', ...auth, purchase.updatePurchaseOrder);
router.post('/orders/:id/mark-ordered', ...auth, purchase.markPurchaseOrderOrdered);

router.get('/receipts', ...auth, purchase.listGoodsReceipts);
router.post('/receipts', ...auth, purchase.createGoodsReceipt);
router.get('/receipts/:id', ...auth, purchase.getGoodsReceipt);
router.post('/receipts/:id/post', ...auth, purchase.postGoodsReceipt);

router.get('/bills', ...auth, purchase.listBills);
router.post('/bills', ...auth, purchase.createBill);
router.get('/bills/:id', ...auth, purchase.getBill);
router.post('/bills/:id/pay', ...auth, purchase.recordBillPayment);

router.get('/returns', ...auth, purchase.listPurchaseReturns);
router.get('/returns/returnable-products', ...auth, purchase.getReturnableProducts);
router.post('/returns', ...auth, purchase.createPurchaseReturn);
router.get('/returns/:id', ...auth, purchase.getPurchaseReturn);

module.exports = router;
