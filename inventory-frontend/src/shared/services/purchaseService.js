/** @module shared/services/purchaseService */
import api from '../utils/api';

const purchaseService = {
  getSummary: () => api.get('/api/purchases/summary'),

  listVendors: (params) => api.get('/api/purchases/vendors', { params }),
  getVendor: (id) => api.get(`/api/purchases/vendors/${id}`),
  createVendor: (data) => api.post('/api/purchases/vendors', data),
  updateVendor: (id, data) => api.put(`/api/purchases/vendors/${id}`, data),

  listOrders: (params) => api.get('/api/purchases/orders', { params }),
  getOrder: (id) => api.get(`/api/purchases/orders/${id}`),
  createOrder: (data) => api.post('/api/purchases/orders', data),
  updateOrder: (id, data) => api.put(`/api/purchases/orders/${id}`, data),
  markOrdered: (id) => api.post(`/api/purchases/orders/${id}/mark-ordered`),

  listReceipts: (params) => api.get('/api/purchases/receipts', { params }),
  getReceipt: (id) => api.get(`/api/purchases/receipts/${id}`),
  createReceipt: (data) => api.post('/api/purchases/receipts', data),
  postReceipt: (id, data) => api.post(`/api/purchases/receipts/${id}/post`, data),

  listBills: (params) => api.get('/api/purchases/bills', { params }),
  getBill: (id) => api.get(`/api/purchases/bills/${id}`),
  createBill: (data) => api.post('/api/purchases/bills', data),
  payBill: (id, data) => api.post(`/api/purchases/bills/${id}/pay`, data),

  listReturns: (params) => api.get('/api/purchases/returns', { params }),
  getReturnableProducts: (warehouseId, vendorId) =>
    api.get('/api/purchases/returns/returnable-products', {
      params: { warehouseId, vendorId },
    }),
  getReturn: (id) => api.get(`/api/purchases/returns/${id}`),
  createReturn: (data) => api.post('/api/purchases/returns', data),

  listTransfers: (params) => api.get('/api/stock-transfers', { params }),
  getTransferSourceOptions: (fromLocationId) =>
    api.get('/api/stock-transfers/source-options', { params: { fromLocationId } }),
  getTransfer: (id) => api.get(`/api/stock-transfers/${id}`),
  createTransfer: (data) => api.post('/api/stock-transfers', data),
  completeTransfer: (id) => api.post(`/api/stock-transfers/${id}/complete`),
};

export default purchaseService;
