const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth/authMiddleware');
const {
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getActivePromotion,
  validateCouponCode,
  previewTotals,
  getDiscountOptions
} = require('../controllers/promotionsController');

const posAuth = [
  authenticate,
  authorize({ roles: ['owner', 'manager', 'cashier', 'staff'], requireTenantActive: true })
];

const settingsAuth = [
  authenticate,
  authorize({ roles: ['owner'], requireTenantActive: true })
];

router.get('/discounts', ...settingsAuth, getDiscounts);
router.get('/discount-options', ...settingsAuth, getDiscountOptions);
router.post('/discounts', ...settingsAuth, createDiscount);
router.patch('/discounts/:id', ...settingsAuth, updateDiscount);
router.delete('/discounts/:id', ...settingsAuth, deleteDiscount);

router.get('/coupons', ...settingsAuth, getCoupons);
router.post('/coupons', ...settingsAuth, createCoupon);
router.patch('/coupons/:id', ...settingsAuth, updateCoupon);
router.delete('/coupons/:id', ...settingsAuth, deleteCoupon);

router.get('/active', ...posAuth, getActivePromotion);
router.post('/validate-coupon', ...posAuth, validateCouponCode);
router.post('/preview-totals', ...posAuth, previewTotals);

module.exports = router;
