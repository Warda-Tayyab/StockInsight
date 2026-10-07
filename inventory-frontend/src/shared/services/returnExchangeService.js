/** @module shared/services/returnExchangeService */

import api from '../utils/api';

export const returnExchangeService = {
  getPolicy: () => api.get('/api/return-exchange/policy'),
  updatePolicy: (data) => api.put('/api/return-exchange/policy', data),
  lookupSale: (invoiceId) =>
    api.get(`/api/return-exchange/lookup/${encodeURIComponent(invoiceId)}`),
  processReturn: (payload) => api.post('/api/return-exchange/return', payload),
  processExchange: (payload) => api.post('/api/return-exchange/exchange', payload),
  previewSettlement: (payload) => api.post('/api/return-exchange/preview-settlement', payload),
  getHistory: (limit = 50) => api.get(`/api/return-exchange/history?limit=${limit}`),
  getWriteOffs: (limit = 50) => api.get(`/api/return-exchange/write-offs?limit=${limit}`),
};

export default returnExchangeService;
