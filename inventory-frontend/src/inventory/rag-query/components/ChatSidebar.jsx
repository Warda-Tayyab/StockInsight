/** @module inventory/rag-query/components/ChatSidebar */

import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineArchive,
  HiOutlineTrash,
  HiOutlinePencilAlt,
  HiOutlineCheck,
  HiOutlineX,
  HiStar,
  HiOutlineStar,
  HiOutlineInbox,
  HiDotsHorizontal,
  HiArrowLeft,
} from 'react-icons/hi';

const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

const ChatSidebar = ({
  chats,
  activeChatId,
  loading,
  activeTab,
  onTabChange,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onArchiveChat,
  onPinChat,
  onDeleteChat,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingChatId, setDeletingChatId] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    chat: null,
  });

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => closeContextMenu();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeContextMenu();
    };

    if (contextMenu.visible) {
      window.addEventListener('click', handleGlobalClick);
      window.addEventListener('contextmenu', handleGlobalClick);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('contextmenu', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu.visible, closeContextMenu]);

  const filteredChats = chats.filter((c) =>
    (c.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleStartRename = (e, chat) => {
    if (e) e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title || 'New Chat');
  };

  const handleSaveRename = (e, chatId) => {
    if (e) e.stopPropagation();
    if (editingTitle.trim()) {
      onRenameChat(chatId, editingTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleCancelRename = (e) => {
    if (e) e.stopPropagation();
    setEditingChatId(null);
  };

  const handleDeleteConfirm = (e, chatId) => {
    if (e) e.stopPropagation();
    onDeleteChat(chatId);
    setDeletingChatId(null);
  };

  const handleContextMenu = (e, chat) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 190;
    const menuHeight = 180;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }

    setContextMenu({ visible: true, x, y, chat });
  };

  const handleDotsClick = (e, chat) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
    const menuHeight = 190;

    // Open beside the clicked row (to the right of the dots button)
    let x = rect.right + 6;
    let y = rect.top;

    // If no space on the right, flip to the left side of the row
    if (x + menuWidth > window.innerWidth) {
      x = rect.left - menuWidth - 6;
    }
    // If still off-screen (very narrow layout), clamp inside viewport
    if (x < 10) x = 10;

    // Keep menu inside viewport vertically
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }

    setContextMenu({ visible: true, x, y, chat });
  };

  return (
    <aside
      data-testid="chat-sidebar"
      className="card flex flex-col h-full min-h-0
        w-[min(300px,88vw)] lg:w-[300px] lg:min-w-[300px] overflow-hidden relative
        shadow-2xl lg:shadow-none bg-white rounded-none lg:rounded-2xl"
    >
      {/* Top Header & New Chat */}
      <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col gap-3">
      <div className="flex items-center justify-between lg:hidden">
          <span className="text-sm font-semibold text-slate-800">Chats</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg border-none bg-transparent cursor-pointer"
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={onNewChat}
          className="btn-secondary w-full justify-center shadow-xs hover:shadow-sm transition-all"
        >
          <HiOutlinePlus className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-slate-800 text-sm">New Chat</span>
        </button>

        {/* Search Bar */}
        <div className="relative">
          <HiOutlineSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {/* WhatsApp-Style Archived Button / Back Navigation */}
        {activeTab === 'active' ? (
          <button
            type="button"
            onClick={() => onTabChange('archived')}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-between transition-colors border-none cursor-pointer mb-2"
          >
            <div className="flex items-center gap-2">
              <HiOutlineArchive className="w-4 h-4 text-amber-600" />
              <span>Archived Chats</span>
            </div>
            <span className="text-[11px] text-slate-400 font-normal">View</span>
          </button>
        ) : (
          <div className="flex items-center justify-between py-2 px-1 mb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() => onTabChange('active')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 border-none bg-transparent cursor-pointer p-0"
            >
              <HiArrowLeft className="w-4 h-4" />
              <span>Back to Active Chats</span>
            </button>
            <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              Archived
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10 text-slate-500 gap-2 text-sm">
            <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading chats...</span>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <HiOutlineInbox className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-slate-500 text-xs font-medium m-0">
              {searchQuery
                ? 'No matching chats found'
                : activeTab === 'archived'
                ? 'No archived conversations'
                : 'No chats yet. Click + New Chat to start.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredChats.map((chat) => {
              const isActive = activeChatId === chat.id;
              const isEditing = editingChatId === chat.id;
              const isDeleting = deletingChatId === chat.id;

              return (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  onContextMenu={(e) => handleContextMenu(e, chat)}
                  className={`group relative w-full text-left px-3 py-2.5 rounded-xl transition-all border-none cursor-pointer flex items-start gap-2.5 select-none ${
                    isActive
                      ? 'bg-indigo-50/90 text-indigo-950 ring-1 ring-indigo-200/80 shadow-xs'
                      : 'bg-transparent text-slate-700 hover:bg-slate-100/70'
                  }`}
                >
                  {/* Pin or Star Indicator */}
                  {chat.isPinned && (
                    <span className="mt-0.5 text-amber-500 shrink-0">
                      <HiStar className="w-4 h-4 fill-amber-400" />
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(e, chat.id);
                            if (e.key === 'Escape') handleCancelRename(e);
                          }}
                          className="w-full text-xs px-2 py-1 bg-white border border-indigo-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveRename(e, chat.id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded border-none bg-transparent cursor-pointer"
                        >
                          <HiOutlineCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelRename}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded border-none bg-transparent cursor-pointer"
                        >
                          <HiOutlineX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-semibold m-0 line-clamp-1 leading-snug text-slate-800">
                          {chat.title || 'New Chat'}
                        </p>
                        <span className="text-[11px] text-slate-400 mt-0.5 block font-normal">
                          {formatTime(chat.updatedAt)}
                          {chat.messageCount > 0 && ` · ${chat.messageCount} msgs`}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Actions / 3-dots trigger button */}
                  {!isEditing && (
                    <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isDeleting ? (
                        <div className="flex items-center gap-1 px-1 bg-white/90 rounded-lg border border-red-200">
                          <span className="text-[10px] text-red-600 font-bold">Delete?</span>
                          <button
                            type="button"
                            title="Confirm delete"
                            onClick={(e) => handleDeleteConfirm(e, chat.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded border-none bg-transparent cursor-pointer"
                          >
                            <HiOutlineCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Cancel"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingChatId(null);
                            }}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded border-none bg-transparent cursor-pointer"
                          >
                            <HiOutlineX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          title="Options (Right-click)"
                          onClick={(e) => handleDotsClick(e, chat)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md border-none bg-transparent cursor-pointer transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <HiDotsHorizontal className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ChatGPT-Style Floating Context Menu */}
      {contextMenu.visible && contextMenu.chat && (
        <div
          data-testid="chat-context-menu"
          className="fixed z-50 w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 p-1.5 text-xs text-slate-700 animate-in fade-in duration-100"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              const chat = contextMenu.chat;
              closeContextMenu();
              handleStartRename(e, chat);
            }}
            className="w-full px-3 py-2 text-left rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-medium flex items-center gap-2 border-none bg-transparent cursor-pointer transition-colors"
          >
            <HiOutlinePencilAlt className="w-4 h-4 text-slate-400" />
            <span>Rename</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const chat = contextMenu.chat;
              closeContextMenu();
              onPinChat(chat.id, !chat.isPinned);
            }}
            className="w-full px-3 py-2 text-left rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-medium flex items-center gap-2 border-none bg-transparent cursor-pointer transition-colors"
          >
            {contextMenu.chat.isPinned ? (
              <>
                <HiStar className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>Unpin chat</span>
              </>
            ) : (
              <>
                <HiOutlineStar className="w-4 h-4 text-slate-400" />
                <span>Pin chat</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              const chat = contextMenu.chat;
              closeContextMenu();
              onArchiveChat(chat.id, !chat.isArchived);
            }}
            className="w-full px-3 py-2 text-left rounded-xl hover:bg-amber-50 text-slate-700 hover:text-amber-700 font-medium flex items-center gap-2 border-none bg-transparent cursor-pointer transition-colors"
          >
            <HiOutlineArchive className="w-4 h-4 text-slate-400" />
            <span>{contextMenu.chat.isArchived ? 'Restore to Active' : 'Archive chat'}</span>
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            onClick={() => {
              const chat = contextMenu.chat;
              closeContextMenu();
              setDeletingChatId(chat.id);
            }}
            className="w-full px-3 py-2 text-left rounded-xl hover:bg-red-50 text-red-600 font-medium flex items-center gap-2 border-none bg-transparent cursor-pointer transition-colors"
          >
            <HiOutlineTrash className="w-4 h-4 text-red-500" />
            <span>Delete chat</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default ChatSidebar;
