const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth/authMiddleware');
const {
  createChat,
  listChats,
  getChat,
  updateChatTitle,
  toggleArchiveChat,
  togglePinChat,
  deleteChat,
  clearChatMessages,
  deleteMessage,
  editMessage,
  sendMessage,
  query,
  getHistory,
  getRecentQueries,
  getInsights
} = require('../controllers/ragController');

const authCheck = [authenticate, authorize({ roles: ['owner', 'manager'], requireTenantActive: true })];

router.post('/chats', ...authCheck, createChat);
router.get('/chats', ...authCheck, listChats);
router.get('/chats/:chatId', ...authCheck, getChat);
router.patch('/chats/:chatId/title', ...authCheck, updateChatTitle);
router.patch('/chats/:chatId/archive', ...authCheck, toggleArchiveChat);
router.patch('/chats/:chatId/pin', ...authCheck, togglePinChat);
router.delete('/chats/:chatId', ...authCheck, deleteChat);
router.delete('/chats/:chatId/messages', ...authCheck, clearChatMessages);
router.delete('/chats/:chatId/messages/:messageId', ...authCheck, deleteMessage);
router.put('/chats/:chatId/messages/:messageId', ...authCheck, editMessage);
router.post('/chats/:chatId/messages', ...authCheck, sendMessage);

router.post('/query', ...authCheck, query);
router.get('/history', ...authCheck, getHistory);
router.get('/recent', ...authCheck, getRecentQueries);
router.get('/insights', ...authCheck, getInsights);

module.exports = router;

