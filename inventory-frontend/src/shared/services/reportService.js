/** @module shared/services/reportService */

import api from '../../shared/utils/api';

export const reportService = {
  getOverview: (params) => api.get('/api/reports/overview', { params }),
  getSalesReport: (params) => api.get('/api/reports/sales', { params }),
  getInventoryReport: (params) => api.get('/api/reports/inventory', { params }),
  getLowStockReport: (params) => api.get('/api/reports/low-stock', { params }),
  getProfitLossReport: (params) => api.get('/api/reports/profit-loss', { params }),
  getPurchaseReport: (params) => api.get('/api/reports/purchasing', { params }),
  getWarehouseReport: (params) => api.get('/api/reports/warehouse', { params }),
  getProductPerformanceReport: (params) => api.get('/api/reports/product-performance', { params }),
  getExpiryReport: (params) => api.get('/api/reports/expiry', { params }),
  getUserActivityReport: (params) => api.get('/api/reports/user-activity', { params }),
};

export default reportService;
