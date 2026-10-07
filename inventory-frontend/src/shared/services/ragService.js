/** @module shared/services/ragService */

import api from '../utils/api';

export const ragService = {
  createChat: () => api.post('/api/rag/chats'),
  listChats: (archived = false) => api.get('/api/rag/chats', { params: { archived } }),
  getChat: (chatId) => api.get(`/api/rag/chats/${chatId}`),
  updateTitle: (chatId, title) => api.patch(`/api/rag/chats/${chatId}/title`, { title }),
  archiveChat: (chatId, isArchived) => api.patch(`/api/rag/chats/${chatId}/archive`, { isArchived }),
  pinChat: (chatId, isPinned) => api.patch(`/api/rag/chats/${chatId}/pin`, { isPinned }),
  deleteChat: (chatId) => api.delete(`/api/rag/chats/${chatId}`),
  clearMessages: (chatId) => api.delete(`/api/rag/chats/${chatId}/messages`),
  deleteMessage: (chatId, messageId) =>
    api.delete(`/api/rag/chats/${chatId}/messages/${messageId}`),
  editMessage: (chatId, messageId, question) =>
    api.put(`/api/rag/chats/${chatId}/messages/${messageId}`, { question }),
  sendMessage: (chatId, question) =>
    api.post(`/api/rag/chats/${chatId}/messages`, { question }),
  query: (question) => api.post('/api/rag/query', { question }),
  getHistory: (limit = 20) => api.get(`/api/rag/history?limit=${limit}`),
  getRecentQueries: (limit = 5) => api.get(`/api/rag/recent?limit=${limit}`),
  getInsights: () => api.get('/api/rag/insights'),
};

export default ragService;

