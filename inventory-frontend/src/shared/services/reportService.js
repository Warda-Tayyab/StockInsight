/** @module shared/services/reportService */

import api from './api';

export const reportService = {
  getReports: (filters) => api.get('/reports', { params: filters }),
  getSalesReport: (params) => api.get('/reports/sales', { params }),
  getStockReport: (params) => api.get('/reports/stock', { params }),
  exportReport: (reportId, format) => api.get(`/reports/${reportId}/export?format=${format}`),
};

export default reportService;
