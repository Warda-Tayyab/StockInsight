/** @module shared/components/Sidebar */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlineClipboardList,
  HiOutlineSearchCircle,
  HiOutlineSparkles,
  HiOutlineBell,
  HiOutlineTrendingDown,
  HiOutlineChartBar,
  HiOutlineLightBulb,
  HiOutlineShoppingCart,
  HiOutlineDocumentText,
  HiOutlineRefresh,
  HiChevronLeft,
  HiChevronRight,
  HiChevronDown,
  HiX,
  HiOutlineTruck,
  HiOutlineOfficeBuilding,
  HiOutlineCollection,
  HiOutlineReceiptTax,
  HiOutlineSwitchHorizontal,
  HiOutlineUsers,
  HiOutlineCog,
} from 'react-icons/hi';
import { useAuthContext } from '../context/AuthContext';
import { hasFullAccess, canAccessPos, canAccessSettings, normalizeRole } from '../utils/roles';
import { getTenantDisplayName, getTenantInitials } from '../utils/tenantBrand';

const allNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid, access: 'full' },
  { path: '/products', label: 'Products', icon: HiOutlineCube, access: 'full' },
  {
    type: 'group',
    id: 'purchasing',
    label: 'Purchasing',
    icon: HiOutlineTruck,
    access: 'full',
    children: [
      { path: '/purchasing', label: 'Overview', icon: HiOutlineCollection },
      { path: '/purchasing/vendors', label: 'Suppliers', icon: HiOutlineUsers },
      { path: '/purchasing/orders', label: 'Purchase Orders', icon: HiOutlineDocumentText },
      { path: '/purchasing/receive', label: 'Purchase Receive', icon: HiOutlineClipboardList },
      { path: '/purchasing/returns', label: 'Purchase Returns', icon: HiOutlineRefresh },
      { path: '/purchasing/bills', label: 'Bills', icon: HiOutlineReceiptTax },
      { path: '/purchasing/transfers', label: 'Stock Transfer', icon: HiOutlineSwitchHorizontal },
    ],
  },
  {
    type: 'group',
    id: 'sales',
    label: 'Sales',
    icon: HiOutlineShoppingCart,
    access: 'pos',
    children: [
      { path: '/pos', label: 'Point of Sale', icon: HiOutlineShoppingCart },
      { path: '/sales', label: 'Sales History', icon: HiOutlineDocumentText },
      { path: '/returns', label: 'Returns & Exchange', icon: HiOutlineRefresh },
    ],
  },
  { path: '/inventory', label: 'Inventory', icon: HiOutlineClipboardList, access: 'full' },
  { path: '/batch-tracking', label: 'Batch Tracking', icon: HiOutlineSearchCircle, access: 'full' },
  { path: '/stock-alerts', label: 'Stock Alerts', icon: HiOutlineBell, access: 'full' },
  { path: '/low-stock', label: 'Low Stock', icon: HiOutlineTrendingDown, access: 'full' },
  // { path: '/pos', label: 'Point of Sale', icon: HiOutlineShoppingCart, access: 'pos' },
  // { path: '/sales', label: 'Sales History', icon: HiOutlineDocumentText, access: 'pos' },
 
  // { path: '/returns', label: 'Returns & Exchange', icon: HiOutlineRefresh, access: 'pos' },

  { path: '/ai-query', label: 'AI Query', icon: HiOutlineSparkles, access: 'full' },
  { path: '/insights', label: 'Insights', icon: HiOutlineLightBulb, access: 'full' },
  { path: '/reports', label: 'Reports', icon: HiOutlineChartBar, access: 'full' },
  { path: '/settings', label: 'Settings', icon: HiOutlineCog, access: 'settings' },
];

const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const location = useLocation();
  const { user } = useAuthContext();
  const role = normalizeRole(user?.role);
  const fullAccess = hasFullAccess(role);
  const posAccess = canAccessPos(role);
  const settingsAccess = canAccessSettings(role);
  const brandName = getTenantDisplayName(user);
  const brandInitials = getTenantInitials(user);
  const purchasingOpenDefault = location.pathname.startsWith('/purchasing');
  const salesOpenDefault = ['/pos', '/sales', '/returns'].some((p) => location.pathname.startsWith(p));

  const [openGroups, setOpenGroups] = useState({ purchasing: purchasingOpenDefault, sales: salesOpenDefault });

  // On mobile drawer, always show full labels — ignore desktop "collapsed" width
  const showExpanded = mobileOpen || !collapsed;

  const navItems = allNavItems.filter((item) => {
    if (item.access === 'full') return fullAccess;
    if (item.access === 'pos') return posAccess;
    if (item.access === 'settings') return settingsAccess;
    return false;
  });

  const isActive = (path) => {
    if (path === '/purchasing') return location.pathname === '/purchasing';
    return (
      location.pathname === path ||
      (path !== '/dashboard' && location.pathname.startsWith(path))
    );
  };

  const isGroupActive = (group) =>
    group.children?.some((c) => location.pathname === c.path || location.pathname.startsWith(`${c.path}/`));

  const handleNavClick = () => {
    if (mobileOpen) onMobileClose?.();
  };

  const toggleGroup = (id) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside
      data-testid="sidebar"
      className={`
        fixed left-0 top-0 h-screen flex flex-col z-50
        bg-brand-gradient text-white shadow-sidebar
        transition-all duration-300 ease-in-out scrollbar-thin
        w-[min(280px,88vw)]
        ${collapsed ? 'lg:w-20' : 'lg:w-[260px]'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
    >
      <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between min-h-[64px] sm:min-h-[72px] shrink-0 gap-2">
        {showExpanded ? (
          <div className="flex flex-col min-w-0 flex-1">
            <h2 className="text-base sm:text-xl font-bold tracking-tight truncate" title={brandName}>
              {brandName}
            </h2>
            <span className="text-[10px] sm:text-[11px] text-white/50 font-medium tracking-wide uppercase truncate">
              AI Inventory
            </span>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <span className="text-lg font-bold text-cyan-300">{brandInitials}</span>
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center
              bg-white/10 hover:bg-white/20 transition-colors text-white/80"
            onClick={onMobileClose}
            aria-label="Close sidebar"
          >
            <HiX className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="hidden lg:flex w-8 h-8 rounded-lg items-center justify-center
              bg-white/10 hover:bg-white/20 transition-colors text-white/80"
            onClick={onToggle}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <HiChevronRight className="w-4 h-4" /> : <HiChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <nav className="flex-1 p-2 sm:p-3 overflow-y-auto overscroll-contain flex flex-col gap-0.5">
        {navItems.map((item) => {
          if (item.type === 'group') {
            const GroupIcon = item.icon;
            const groupActive = isGroupActive(item);
            const expanded = showExpanded ? openGroups[item.id] || groupActive : false;

            return (
              <div key={item.id} className="flex flex-col gap-0.5">
                <button
                  type="button"
                  title={!showExpanded ? item.label : ''}
                  onClick={() => {
                    if (!showExpanded) {
                      handleNavClick();
                    } else {
                      toggleGroup(item.id);
                    }
                  }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    text-sm font-medium group w-full
                    ${groupActive
                      ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }
                    ${!showExpanded ? 'justify-center px-2' : ''}
                  `}
                >
                  <GroupIcon
                    className={`w-5 h-5 shrink-0 ${
                      groupActive ? 'text-cyan-300' : 'text-white/60 group-hover:text-cyan-300/80'
                    }`}
                  />
                  {showExpanded && (
                    <>
                      <span className="truncate flex-1 text-left">{item.label}</span>
                      <HiChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
                      />
                    </>
                  )}
                </button>

                {showExpanded && expanded && (
                  <div className="ml-3 pl-3 border-l border-white/10 flex flex-col gap-0.5 mb-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon || HiOutlineOfficeBuilding;
                      const active = isActive(child.path);
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={handleNavClick}
                          className={`
                            flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium
                            ${active
                              ? 'bg-white/15 text-white'
                              : 'text-white/60 hover:bg-white/10 hover:text-white'
                            }
                          `}
                        >
                          <ChildIcon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const { path, label, icon: Icon } = item;
          const active = isActive(path);

          return (
            <Link
              key={path}
              to={path}
              onClick={handleNavClick}
              title={!showExpanded ? label : ''}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                text-sm font-medium group
                ${active
                  ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                }
                ${!showExpanded ? 'justify-center px-2' : ''}
              `}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  active ? 'text-cyan-300' : 'text-white/60 group-hover:text-cyan-300/80'
                }`}
              />
              {showExpanded && <span className="truncate">{label}</span>}
              {active && showExpanded && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-300 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {showExpanded && (
        <div className="p-3 sm:p-4 border-t border-white/10 shrink-0 safe-area-pb">
          <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-center">
            <p className="text-[11px] text-white/50 font-medium truncate" title={brandName}>
              {brandName}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
