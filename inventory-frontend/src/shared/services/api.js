/** @module shared/services/api */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = {
  get: (url, options = {}) => fetch(`${API_BASE_URL}${url}`, { ...options, method: 'GET' }),
  post: (url, data, options = {}) =>
    fetch(`${API_BASE_URL}${url}`, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    }),
  put: (url, data, options = {}) =>
    fetch(`${API_BASE_URL}${url}`, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    }),
  delete: (url, options = {}) => fetch(`${API_BASE_URL}${url}`, { ...options, method: 'DELETE' }),
};

export default api;
