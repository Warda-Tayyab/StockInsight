/** @module inventory/rag-query/pages/AIQuery */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  HiOutlineSparkles,
  HiOutlineUser,
  HiOutlinePaperAirplane,
  HiOutlineClipboardCopy,
  HiOutlineCheck,
  HiOutlineTrash,
  HiOutlineDownload,
  HiOutlineArchive,
  HiOutlinePencilAlt,
  HiOutlineX,
  HiOutlineMenuAlt2,
} from 'react-icons/hi';
import ChatSidebar from '../components/ChatSidebar';
import ragService from '../../../shared/services/ragService';
import { useAuthContext } from '../../../shared/context/AuthContext';
import { getTenantDisplayName } from '../../../shared/utils/tenantBrand';

const AIQuery = () => {
  const location = useLocation();
  const { user } = useAuthContext();
  const brandName = getTenantDisplayName(user);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'
  const [loading, setLoading] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // UI interaction states
  const [copiedId, setCopiedId] = useState(null);
  const [editingHeaderTitle, setEditingHeaderTitle] = useState(false);
  const [headerTitleText, setHeaderTitleText] = useState('');
  const [showDeleteChatConfirm, setShowDeleteChatConfirm] = useState(false);

  // Sent message editing states
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [editingLoadingId, setEditingLoadingId] = useState(null);

  const messagesEndRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeChatId);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  const loadChats = useCallback(async (isArchived = false) => {
    try {
      const res = await ragService.listChats(isArchived);
      return res.data.chats || [];
    } catch (err) {
      console.error('Failed to load chats:', err);
      return [];
    }
  }, []);

  const loadChatMessages = useCallback(async (chatId) => {
    if (!chatId) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    setError('');
    try {
      const res = await ragService.getChat(chatId);
      setMessages(res.data.messages || []);
      setHeaderTitleText(res.data.chat.title || 'New Chat');
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                title: res.data.chat.title,
                messageCount: res.data.chat.messageCount,
                isArchived: res.data.chat.isArchived,
                isPinned: res.data.chat.isPinned,
              }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to load chat:', err);
      setError('Failed to load chat messages.');
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const selectChat = useCallback(
    async (chatId) => {
      setActiveChatId(chatId);
      setSidebarOpen(false);
      await loadChatMessages(chatId);
    },
    [loadChatMessages]
  );

  const handleTabChange = useCallback(
    async (tab) => {
      setActiveTab(tab);
      setChatsLoading(true);
      const isArchived = tab === 'archived';
      const chatList = await loadChats(isArchived);
      setChats(chatList);

      if (chatList.length > 0) {
        setActiveChatId(chatList[0].id);
        await loadChatMessages(chatList[0].id);
      } else {
        setActiveChatId(null);
        setMessages([]);
      }
      setChatsLoading(false);
    },
    [loadChats, loadChatMessages]
  );

  const handleNewChat = useCallback(async () => {
    setError('');
    try {
      if (activeTab !== 'active') {
        setActiveTab('active');
      }
      const res = await ragService.createChat();
      const newChat = res.data.chat;
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setHeaderTitleText(newChat.title || 'New Chat');
      setMessages([]);
    } catch (err) {
      console.error('Failed to create chat:', err);
      setError('Failed to start new chat.');
    }
  }, [activeTab]);

  useEffect(() => {
    const init = async () => {
      setChatsLoading(true);
      const isArchived = activeTab === 'archived';
      const chatList = await loadChats(isArchived);
      setChats(chatList);

      const stateChatId = location.state?.chatId;
      const targetId =
        stateChatId && chatList.some((c) => c.id === stateChatId)
          ? stateChatId
          : chatList[0]?.id;

      if (targetId) {
        setActiveChatId(targetId);
        await loadChatMessages(targetId);
      }

      setChatsLoading(false);
    };

    init();
  }, [loadChats, loadChatMessages, location.state?.chatId, activeTab]);

  useEffect(() => {
    if (!messagesLoading) {
      const id = setTimeout(() => scrollToBottom('auto'), 80);
      return () => clearTimeout(id);
    }
  }, [messages, messagesLoading, loading, scrollToBottom]);

  useEffect(() => {
    if (loading) scrollToBottom('smooth');
  }, [loading, scrollToBottom]);

  // Chat Actions: Rename, Archive, Pin, Delete
  const handleRenameChat = async (chatId, newTitle) => {
    try {
      const res = await ragService.updateTitle(chatId, newTitle);
      const updated = res.data.chat;
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, title: updated.title } : c))
      );
      if (chatId === activeChatId) {
        setHeaderTitleText(updated.title);
      }
    } catch (err) {
      console.error('Failed to rename chat:', err);
      setError('Failed to rename conversation title.');
    }
  };

  const handleArchiveChat = async (chatId, targetIsArchived) => {
    try {
      await ragService.archiveChat(chatId, targetIsArchived);
      setChats((prev) => prev.filter((c) => c.id !== chatId));

      if (activeChatId === chatId) {
        const remaining = chats.filter((c) => c.id !== chatId);
        if (remaining.length > 0) {
          setActiveChatId(remaining[0].id);
          await loadChatMessages(remaining[0].id);
        } else {
          setActiveChatId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to archive chat:', err);
      setError('Failed to update archive status.');
    }
  };

  const handlePinChat = async (chatId, targetIsPinned) => {
    try {
      const res = await ragService.pinChat(chatId, targetIsPinned);
      const updated = res.data.chat;
      setChats((prev) => {
        const list = prev.map((c) =>
          c.id === chatId ? { ...c, isPinned: updated.isPinned } : c
        );
        return list.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
      });
    } catch (err) {
      console.error('Failed to pin chat:', err);
      setError('Failed to pin conversation.');
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await ragService.deleteChat(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      setShowDeleteChatConfirm(false);

      if (activeChatId === chatId) {
        const remaining = chats.filter((c) => c.id !== chatId);
        if (remaining.length > 0) {
          setActiveChatId(remaining[0].id);
          await loadChatMessages(remaining[0].id);
        } else {
          setActiveChatId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
      setError('Failed to delete conversation.');
    }
  };

  const handleDeleteSingleMessage = async (messageId) => {
    if (!activeChatId) return;
    try {
      await ragService.deleteMessage(activeChatId, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? { ...c, messageCount: Math.max(0, c.messageCount - 1) }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to delete message:', err);
      setError('Failed to delete message.');
    }
  };

  // Sent Message Edit Handlers
  const handleStartEditMessage = (item) => {
    setEditingMessageId(item.id);
    setEditingMessageText(item.query);
  };

  const handleCancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingMessageText('');
  };

  const handleSaveEditMessage = async (messageId) => {
    if (!activeChatId || !editingMessageText.trim()) return;

    setEditingLoadingId(messageId);
    setError('');

    try {
      const res = await ragService.editMessage(
        activeChatId,
        messageId,
        editingMessageText.trim()
      );
      const updated = res.data.message;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                query: updated.query,
                response: updated.response,
                sources: updated.sources || [],
                timestamp: new Date(updated.timestamp),
              }
            : m
        )
      );

      setEditingMessageId(null);
      setEditingMessageText('');
    } catch (err) {
      console.error('Failed to edit message:', err);
      setError(
        err.response?.data?.message || 'Failed to edit sent message. Please try again.'
      );
    } finally {
      setEditingLoadingId(null);
    }
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportChat = (format = 'txt') => {
    if (!messages.length) return;

    let content = '';
    const title = activeChat?.title || 'RAG_Chat_Export';

    if (format === 'json') {
      content = JSON.stringify({ title, date: new Date().toISOString(), messages }, null, 2);
    } else {
      content = `--- RAG AI Query Export: ${title} ---\nDate: ${new Date().toLocaleString()}\n\n`;
      messages.forEach((m) => {
        content += `[User]: ${m.query}\n`;
        content += `[${brandName} AI]: ${m.response}\n`;
        if (m.sources && m.sources.length) {
          content += `Sources: ${m.sources.join(', ')}\n`;
        }
        content += `\n----------------------------------------\n\n`;
      });
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    let chatId = activeChatId;

    if (!chatId) {
      try {
        const res = await ragService.createChat();
        const newChat = res.data.chat;
        chatId = newChat.id;
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(chatId);
      } catch (err) {
        setError('Failed to start chat. Please try again.');
        return;
      }
    }

    setLoading(true);
    setError('');
    const userQuery = query;
    setQuery('');

    try {
      const res = await ragService.sendMessage(chatId, userQuery);
      const { chat, message } = res.data;

      setChats((prev) => {
        const updated = {
          id: chat.id,
          title: chat.title,
          messageCount: chat.messageCount,
          isArchived: chat.isArchived,
          isPinned: chat.isPinned,
          updatedAt: chat.updatedAt,
          createdAt:
            prev.find((c) => c.id === chat.id)?.createdAt || chat.updatedAt,
        };
        const rest = prev.filter((c) => c.id !== chat.id);
        return [updated, ...rest];
      });

      if (activeChatId === chatId) {
        setHeaderTitleText(chat.title);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: message.id,
          query: message.query,
          response: message.response,
          sources: message.sources || [],
          timestamp: new Date(message.timestamp),
        },
      ]);
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
      setQuery(userQuery);
    } finally {
      setLoading(false);
    }
  };

  const showEmptyState = !messagesLoading && messages.length === 0;

  return (
    <div
      data-testid="ai-query-page"
      className="flex flex-col gap-2 sm:gap-3 h-[calc(100dvh-5.5rem)] sm:h-[calc(100dvh-6.5rem)] max-h-[calc(100dvh-5.5rem)] sm:max-h-[calc(100dvh-6.5rem)] overflow-hidden"
    >
   <div className="shrink-0">
        <div className="flex items-center gap-2 mb-0.5">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 -ml-1.5 text-slate-600 hover:text-indigo-600 rounded-lg border-none bg-transparent cursor-pointer"
            title="Chat history"
          >
            <HiOutlineMenuAlt2 className="w-5 h-5" />
          </button>
          <HiOutlineSparkles className="w-6 h-6 text-indigo-600" />
          <h1 className="page-title !text-xl sm:!text-2xl">AI Query Assistant</h1>
        </div>
        <p className="page-subtitle !mt-0">
          Inventory assistant — ask in English, Urdu, or Roman Urdu
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700 border-none bg-transparent cursor-pointer"
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>
      )}

<div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close chats"
            className="fixed inset-0 bg-slate-900/50 z-[55] lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

{/* Desktop: normal static sidebar, no fixed/transform at all */}
<div className="hidden lg:block shrink-0">
          <ChatSidebar
            chats={chats}
            activeChatId={activeChatId}
            loading={chatsLoading}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onNewChat={handleNewChat}
            onSelectChat={selectChat}
            onRenameChat={handleRenameChat}
            onArchiveChat={handleArchiveChat}
            onPinChat={handlePinChat}
            onDeleteChat={handleDeleteChat}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Mobile: slide-in drawer above app chrome */}
        <div
          className={`lg:hidden fixed top-0 left-0 h-full z-[60] transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <ChatSidebar
            chats={chats}
            activeChatId={activeChatId}
            loading={chatsLoading}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onNewChat={() => {
              handleNewChat();
              setSidebarOpen(false);
            }}
            onSelectChat={selectChat}
            onRenameChat={handleRenameChat}
            onArchiveChat={handleArchiveChat}
            onPinChat={handlePinChat}
            onDeleteChat={handleDeleteChat}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <div className="card flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Active Chat Control Header Bar */}
            {activeChat && (
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  {editingHeaderTitle ? (
                    <div className="flex items-center gap-1.5 flex-1 max-w-md">
                      <input
                        type="text"
                        value={headerTitleText}
                        onChange={(e) => setHeaderTitleText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameChat(activeChat.id, headerTitleText);
                            setEditingHeaderTitle(false);
                          }
                          if (e.key === 'Escape') setEditingHeaderTitle(false);
                        }}
                        className="w-full text-sm font-semibold px-2 py-1 bg-white border border-indigo-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          handleRenameChat(activeChat.id, headerTitleText);
                          setEditingHeaderTitle(false);
                        }}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded border-none bg-transparent cursor-pointer"
                      >
                        <HiOutlineCheck className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingHeaderTitle(false)}
                        className="p-1 text-slate-400 hover:bg-slate-100 rounded border-none bg-transparent cursor-pointer"
                      >
                        <HiOutlineX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <h2 className="text-sm font-bold text-slate-800 m-0 truncate">
                        {activeChat.title || 'New Chat'}
                      </h2>
                      <button
                        type="button"
                        title="Rename Chat Title"
                        onClick={() => {
                          setHeaderTitleText(activeChat.title || 'New Chat');
                          setEditingHeaderTitle(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded border-none bg-transparent cursor-pointer transition-colors"
                      >
                        <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  {messages.length > 0 && (
                    <button
                      type="button"
                      title="Export Chat Transcript (.txt)"
                      onClick={() => handleExportChat('txt')}
                      className="btn-secondary !py-1.5 !px-2.5 text-xs text-slate-600 hover:text-indigo-600 flex items-center gap-1"
                    >
                      <HiOutlineDownload className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Export</span>
                    </button>
                  )}

                  <button
                    type="button"
                    title={activeChat.isArchived ? 'Restore to Active' : 'Archive Chat'}
                    onClick={() => handleArchiveChat(activeChat.id, !activeChat.isArchived)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg border-none bg-transparent cursor-pointer transition-colors"
                  >
                    <HiOutlineArchive className="w-4 h-4" />
                  </button>

                  {showDeleteChatConfirm ? (
                    <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg border border-red-200">
                      <span className="text-[11px] text-red-700 font-bold">Delete Chat?</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteChat(activeChat.id)}
                        className="p-0.5 text-red-700 hover:bg-red-100 rounded border-none bg-transparent cursor-pointer"
                      >
                        <HiOutlineCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteChatConfirm(false)}
                        className="p-0.5 text-slate-400 hover:bg-slate-100 rounded border-none bg-transparent cursor-pointer"
                      >
                        <HiOutlineX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      title="Delete Chat"
                      onClick={() => setShowDeleteChatConfirm(true)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg border-none bg-transparent cursor-pointer transition-colors"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Chat Body & Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5 scrollbar-thin">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full text-slate-500 gap-2">
                  <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Loading conversation...</span>
                </div>
              ) : showEmptyState ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 via-indigo-700 to-purple-700
                    flex items-center justify-center mb-6 shadow-lg">
                    <HiOutlineSparkles className="w-8 h-8 text-cyan-300" />
                  </div>
                  <h3 className="mb-3 text-slate-900 font-semibold text-lg">
                    How can I help with your inventory?
                  </h3>
                  <p className="mb-4 text-sm text-slate-500">Try asking:</p>
                  <ul className="list-none p-0 m-0 text-left text-sm space-y-2 max-w-md w-full">
                    {[
                      '"What products are running low on stock?"',
                      '"Kaun se products ka stock kam hai?"',
                      '"Show me sales trends for last 3 months"',
                    ].map((example) => (
                      <li
                        key={example}
                        onClick={() => setQuery(example.replace(/"/g, ''))}
                        className="py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-900 border border-slate-100 hover:border-indigo-200 cursor-pointer transition-colors"
                      >
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                messages.map((item) => (
                  <div key={item.id} className="group/msg flex flex-col gap-4">
                    {/* User Question */}
                    <div className="flex gap-3 items-start flex-row-reverse group/user-msg">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <HiOutlineUser className="w-4 h-4 text-slate-600" />
                      </div>

                      {editingMessageId === item.id ? (
                        <div className="max-w-[85%] sm:max-w-[75%] flex flex-col gap-2 w-full">
                          <textarea
                            value={editingMessageText}
                            onChange={(e) => setEditingMessageText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEditMessage(item.id);
                              }
                              if (e.key === 'Escape') handleCancelEditMessage();
                            }}
                            className="w-full text-sm p-3 bg-white border border-indigo-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm min-h-[70px] resize-y"
                            autoFocus
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleCancelEditMessage}
                              className="btn-secondary !py-1 !px-3 text-xs cursor-pointer"
                              disabled={editingLoadingId === item.id}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditMessage(item.id)}
                              className="btn-primary !py-1 !px-3 text-xs flex items-center gap-1.5 cursor-pointer"
                              disabled={editingLoadingId === item.id || !editingMessageText.trim()}
                            >
                              {editingLoadingId === item.id ? (
                                <>
                                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <HiOutlineCheck className="w-3.5 h-3.5" />
                                  <span>Save & Submit</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-[85%] sm:max-w-[75%] flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5 opacity-0 group-hover/user-msg:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              title="Edit message"
                              onClick={() => handleStartEditMessage(item)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md border-none bg-transparent cursor-pointer"
                            >
                              <HiOutlinePencilAlt className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Delete message"
                              onClick={() => handleDeleteSingleMessage(item.id)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md border-none bg-transparent cursor-pointer"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="px-4 py-3 rounded-2xl rounded-br-md bg-gradient-to-r from-slate-800 via-indigo-700 to-purple-700 text-white shadow-sm relative">
                            <p className="m-0 leading-relaxed whitespace-pre-line text-sm">
                              {item.query}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Response */}
                    <div className="flex gap-3 items-start">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 via-indigo-700 to-purple-700
                        flex items-center justify-center shrink-0 shadow-sm">
                        <HiOutlineSparkles className="w-4 h-4 text-cyan-300" />
                      </div>
                      <div className="max-w-[85%] sm:max-w-[75%] flex flex-col gap-1.5">
                        <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-slate-50 text-slate-800 border border-slate-100 shadow-2xs relative">
                          {editingLoadingId === item.id ? (
                            <div className="flex items-center gap-2 text-slate-500 text-sm py-1">
                              <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                              <span>Updating AI response...</span>
                            </div>
                          ) : (
                            <p className="m-0 leading-relaxed whitespace-pre-line text-sm">
                              {item.response}
                            </p>
                          )}
                        </div>

                        {/* Action button: Copy response */}
                        {editingLoadingId !== item.id && (
                          <div className="flex items-center gap-1 self-start pl-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                            <button
                              type="button"
                              title="Copy response"
                              onClick={() => handleCopyText(item.id, item.response)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md border-none bg-transparent cursor-pointer transition-colors"
                            >
                              {copiedId === item.id ? (
                                <>
                                  <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-[11px] text-emerald-600 font-medium">Copied</span>
                                </>
                              ) : (
                                <>
                                  <HiOutlineClipboardCopy className="w-3.5 h-3.5" />
                                  <span className="text-[11px]">Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {loading && (
                <div className="flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 via-indigo-700 to-purple-700
                    flex items-center justify-center shrink-0">
                    <HiOutlineSparkles className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-slate-50 text-slate-600 text-sm flex items-center gap-2
                    border border-slate-100">
                    <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    <span>Generating Response...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-slate-100 bg-white shrink-0 safe-area-pb">
              <div className="flex gap-2 sm:gap-3">
                <input
                  type="text"
                  className="input-field flex-1 !py-3"
                  placeholder={`Message ${brandName} AI...`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="btn-primary !px-4 sm:!px-5 shrink-0"
                  disabled={loading || !query.trim()}
                >
                  <HiOutlinePaperAirplane className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIQuery;
