/** @module shared/services/promotionsService */

import api from '../utils/api';

export const promotionsService = {
  getDiscounts: () => api.get('/api/promotions/discounts'),
  getDiscountOptions: () => api.get('/api/promotions/discount-options'),
  createDiscount: (data) => api.post('/api/promotions/discounts', data),
  updateDiscount: (id, data) => api.patch(`/api/promotions/discounts/${id}`, data),
  deleteDiscount: (id) => api.delete(`/api/promotions/discounts/${id}`),

  getCoupons: () => api.get('/api/promotions/coupons'),
  createCoupon: (data) => api.post('/api/promotions/coupons', data),
  updateCoupon: (id, data) => api.patch(`/api/promotions/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/api/promotions/coupons/${id}`),

  getActivePromotion: (subtotal = 0) =>
    api.get(`/api/promotions/active?subtotal=${subtotal}`),
  validateCoupon: (code, subtotal, items = []) =>
    api.post('/api/promotions/validate-coupon', { code, subtotal, items }),
  previewTotals: (subtotal, couponCode, items = []) =>
    api.post('/api/promotions/preview-totals', { subtotal, couponCode, items }),
};

export default promotionsService;
