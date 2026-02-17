/** @module shared/services/inventoryService */

import api from './api';

export const inventoryService = {
  getProducts: () => api.get('/inventory/products'),
  getProductById: (id) => api.get(`/inventory/products/${id}`),
  createProduct: (data) => api.post('/inventory/products', data),
  updateProduct: (id, data) => api.put(`/inventory/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/inventory/products/${id}`),
  getBatches: (productId) => api.get(`/inventory/products/${productId}/batches`),
};

export default inventoryService;
