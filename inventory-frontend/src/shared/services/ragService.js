/** @module shared/services/ragService */

import api from './api';

export const ragService = {
  query: (question) => api.post('/rag/query', { question }),
  getHistory: () => api.get('/rag/history'),
  getInsights: () => api.get('/rag/insights'),
};

export default ragService;
