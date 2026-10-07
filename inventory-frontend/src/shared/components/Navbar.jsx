/** @module shared/components/Navbar */

import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  HiOutlineSearch,
  HiOutlineBell,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineExclamation,
  HiOutlineExclamationCircle,
  HiOutlineCog,
  HiOutlineClock,
  HiOutlineSpeakerphone,
} from 'react-icons/hi';
import socket from '../../socket';
import api from '../utils/api';
import { getRoleLabel, canAccessSettings, normalizeRole } from '../utils/roles';
import { getTenantDisplayName } from '../utils/tenantBrand';

const notificationStorageKey = (tenantId) =>
  tenantId ? `notifications_${tenantId}` : null;

const mapServerNotification = (n) => ({
  id: String(n.id || n._id),
  type: n.type,
  title: n.title,
  message: n.message || n.title || 'Alert',
  priority: n.priority,
  time: n.time
    || (n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : new Date().toLocaleTimeString()),
  tenantId: n.tenantId ? String(n.tenantId) : undefined,
});

const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuthContext();
  const notificationRef = useRef();

  const tenantId = user?.tenant?.id ? String(user.tenant.id) : null;

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const persistNotifications = useCallback(
    (items) => {
      const key = notificationStorageKey(tenantId);
      if (!key) return;

      localStorage.setItem(key, JSON.stringify(items));
    },
    [tenantId]
  );

  // Prominent, loud, and crisp notification sounds
  const playNotificationSound = useCallback((type) => {
    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return;

      const audioContext = new AudioContext();

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const playTone = (
        frequency,
        startTime,
        duration,
        volume = 0.45,
        waveType = 'triangle'
      ) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(
          frequency,
          audioContext.currentTime + startTime
        );

        gainNode.gain.setValueAtTime(
          0.0001,
          audioContext.currentTime + startTime
        );

        gainNode.gain.exponentialRampToValueAtTime(
          volume,
          audioContext.currentTime + startTime + 0.03
        );

        gainNode.gain.exponentialRampToValueAtTime(
          0.0001,
          audioContext.currentTime + startTime + duration
        );

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(audioContext.currentTime + startTime);
        oscillator.stop(
          audioContext.currentTime + startTime + duration + 0.05
        );
      };

      switch (type) {
        // 🚨 Out of stock & Expired - Urgent prominent 3-beep alarm chime
        case 'out-of-stock':
        case 'expired':
          playTone(880, 0.0, 0.18, 0.50, 'triangle');
          playTone(700, 0.2, 0.18, 0.45, 'triangle');
          playTone(880, 0.4, 0.32, 0.50, 'sawtooth');
          break;

        // ⚠️ Low stock & Expiring - Distinct double warning chime
        case 'low-stock':
        case 'expiring':
          playTone(650, 0.0, 0.20, 0.45, 'sine');
          playTone(950, 0.22, 0.28, 0.40, 'triangle');
          break;

        // 🔧 Adjustment - double click chime
        case 'adjustment':
          playTone(950, 0.0, 0.12, 0.35, 'triangle');
          playTone(1200, 0.14, 0.15, 0.30, 'sine');
          break;

        // 🔔 General notification - prominent double ding
        default:
          playTone(800, 0.0, 0.20, 0.40, 'sine');
          playTone(1200, 0.22, 0.30, 0.35, 'sine');
          break;
      }

      setTimeout(() => {
        audioContext.close().catch(() => {});
      }, 1200);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, []);

  useEffect(() => {
    if (!tenantId) {
      setNotifications([]);
      return;
    }

    const key = notificationStorageKey(tenantId);
    const saved = localStorage.getItem(key);

    try {
      setNotifications(saved ? JSON.parse(saved) : []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }

    let cancelled = false;

    const hydrateFromServer = async () => {
      try {
        const res = await api.get('/api/inventory/notifications');
        const list = (res.data?.notifications || []).map(mapServerNotification);
        if (cancelled) return;
        setNotifications(list);
        persistNotifications(list);
      } catch (err) {
        // Keep localStorage fallback if API unavailable (e.g. role/network)
        console.error('Failed to hydrate notifications:', err);
      }
    };

    hydrateFromServer();

    return () => {
      cancelled = true;
    };
  }, [tenantId, persistNotifications]);

  useEffect(() => {
    if (!tenantId) return;

    const joinRoom = () => {
      socket.emit('join-tenant', tenantId);
    };

    // Always re-join on every connect/reconnect (mobile often drops sockets)
    socket.on('connect', joinRoom);
    if (socket.connected) {
      joinRoom();
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect', joinRoom);
    };
  }, [tenantId]);

  const handleNewAlert = useCallback(
    (data) => {
      if (
        data?.tenantId &&
        String(data.tenantId) !== tenantId
      ) {
        return;
      }

      const newNotification = {
        id: data.id || Date.now(),
        ...data,
        message: data.message || data.title || 'Alert',
        time: new Date().toLocaleTimeString(),
      };

      // Play notification sound based on alert type
      playNotificationSound(data?.type);

      setNotifications((prev) => {
        const index = prev.findIndex(
          (n) => String(n.id) === String(newNotification.id)
        );

        let updated;

        if (index !== -1) {
          updated = [...prev];

          updated[index] = {
            ...updated[index],
            ...newNotification,
          };
        } else {
          updated = [newNotification, ...prev];
        }

        persistNotifications(updated);

        return updated;
      });
    },
    [tenantId, persistNotifications, playNotificationSound]
  );

  useEffect(() => {
    if (!tenantId) return;

    socket.off('new-alert');
    socket.on('new-alert', handleNewAlert);

    return () => {
      socket.off('new-alert', handleNewAlert);
    };
  }, [tenantId, handleNewAlert]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const clearNotifications = async () => {
    setNotifications([]);

    const key = notificationStorageKey(tenantId);

    if (key) {
      localStorage.removeItem(key);
    }

    try {
      await api.patch('/api/inventory/notifications/read');
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'out-of-stock':
        return (
          <HiOutlineExclamation className="w-5 h-5 text-red-500" />
        );

      case 'low-stock':
        return (
          <HiOutlineExclamationCircle className="w-5 h-5 text-amber-500" />
        );

      case 'adjustment':
        return (
          <HiOutlineCog className="w-5 h-5 text-indigo-500" />
        );

      case 'expired':
      case 'expiring':
        return (
          <HiOutlineClock className="w-5 h-5 text-orange-500" />
        );

      default:
        return (
          <HiOutlineSpeakerphone className="w-5 h-5 text-slate-500" />
        );
    }
  };

  const roleLabel = getRoleLabel(user?.role);
  const storeName = getTenantDisplayName(user);
  const role = normalizeRole(user?.role);
  const settingsAccess = canAccessSettings(role);

  useEffect(() => {
    document.title = storeName
      ? `${storeName} | Inventory`
      : 'Inventory';
  }, [storeName]);

  return (
    <nav
      data-testid="navbar"
      className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 lg:px-8 h-[64px] sm:h-[70px]
        flex items-center sticky top-0 z-30"
    >
      <div className="w-full flex items-center justify-between gap-2 sm:gap-6">

        {/* Mobile menu + Search */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">

          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center
              bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
            aria-label="Open menu"
          >
            <HiOutlineMenu className="w-5 h-5" />
          </button>

          <div className="hidden sm:block min-w-0 lg:hidden">
            <p
              className="text-sm font-semibold text-slate-800 truncate max-w-[140px]"
              title={storeName}
            >
              {storeName}
            </p>
          </div>

          {/* <div className="relative flex items-center flex-1 max-w-[500px] min-w-0">
            <HiOutlineSearch className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />

            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50/80 text-sm
                transition-all focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div> */}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>

            <button
              type="button"
              onClick={() =>
                setShowNotifications(!showNotifications)
              }
              className="relative w-10 h-10 rounded-xl flex items-center justify-center
                text-slate-600 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <HiOutlineBell className="w-5 h-5" />

              {notifications.length > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold
                    rounded-full flex items-center justify-center ring-2 ring-white"
                >
                  {notifications.length > 9
                    ? '9+'
                    : notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <button
                  type="button"
                  aria-label="Close notifications"
                  className="fixed inset-0 z-40 bg-slate-900/40 sm:bg-transparent sm:pointer-events-none"
                  onClick={() => setShowNotifications(false)}
                />
                <div
                  className="fixed left-3 right-3 top-[72px] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2
                    sm:w-80 md:w-[340px] max-h-[min(70dvh,420px)] bg-white rounded-2xl
                    shadow-lg border border-slate-100 z-50 overflow-hidden flex flex-col"
                >
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
                    <h3 className="font-semibold text-slate-900 text-sm m-0">
                      Notifications
                    </h3>

                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearNotifications}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium shrink-0"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto scrollbar-thin min-h-0 flex-1">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <HiOutlineBell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 m-0">
                          No notifications
                        </p>
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            navigate('/stock-alerts');
                            setShowNotifications(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              navigate('/stock-alerts');
                              setShowNotifications(false);
                            }
                          }}
                          className="p-3 sm:p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0">
                              {getNotificationIcon(item.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 leading-snug break-words whitespace-normal">
                                {item.message}
                              </p>
                              <span className="text-xs text-slate-400 mt-1 block">
                                {item.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User profile */}
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors">

            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 via-indigo-700 to-purple-700
                text-white flex items-center justify-center font-semibold text-sm shadow-sm"
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>

            <div className="hidden md:flex flex-col">

              <span className="text-sm font-medium text-slate-900 leading-tight truncate max-w-[140px]">
                {user?.email || 'User'}
              </span>

              <span className="text-xs text-slate-400 leading-tight">
                {roleLabel}
              </span>

            </div>
          </div>

          {/* Settings */}
          {settingsAccess && (
            <button
              type="button"
              onClick={() => navigate('/settings/profile')}
              className="w-10 h-10 rounded-xl flex items-center justify-center
                text-slate-600 hover:bg-slate-100 transition-colors"
              title="Settings"
            >
              <HiOutlineCog className="w-5 h-5" />
            </button>
          )}

          {/* Logout */}
          <button
            type="button"
            className="btn-secondary !py-2 !px-3 sm:!px-4 gap-1.5"
            onClick={handleLogout}
          >
            <HiOutlineLogout className="w-4 h-4" />

            <span className="hidden sm:inline">
              Logout
            </span>
          </button>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;