/** @module inventory/settings/pages/SettingsLayout */

import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuthContext } from '../../../shared/context/AuthContext';
import { canAccessSettings } from '../../../shared/utils/roles';
import {
  HiOutlineUsers,
  HiOutlineOfficeBuilding,
  HiOutlineDocumentText,
  HiOutlineUser,
  HiOutlineHome,
  HiOutlineShieldCheck,
  HiOutlineDatabase,
  HiOutlineMail,
  HiOutlineTag,
} from 'react-icons/hi';

const tabs = [
  { to: '/settings/profile', label: 'Profile', icon: HiOutlineUser },
  { to: '/settings/business', label: 'Store', icon: HiOutlineHome },
 // { to: '/settings/appearance', label: 'Appearance', icon: HiOutlineColorSwatch },
  //{ to: '/settings/notifications', label: 'Notifications', icon: HiOutlineBell },
  { to: '/settings/email', label: 'Email Configuration', icon: HiOutlineMail },
  { to: '/settings/users', label: 'Users', icon: HiOutlineUsers },
  //{ to: '/settings/categories', label: 'Categories', icon: HiOutlineTag },
  { to: '/settings/warehouses', label: 'Locations', icon: HiOutlineOfficeBuilding },
  { to: '/settings/return-exchange', label: 'Return Policy', icon: HiOutlineDocumentText },
  { to: '/settings/promotions', label: 'Coupons & Discounts', icon: HiOutlineTag },
  { to: '/settings/security', label: 'Security', icon: HiOutlineShieldCheck },
  { to: '/settings/data', label: 'Data', icon: HiOutlineDatabase },
  
];

const SettingsLayout = () => {
  const { user } = useAuthContext();

  if (!canAccessSettings(user?.role)) {
    return <Navigate to="/pos" replace />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">
            Account, store, team, coupons, warehouses, email, and data tools
          </p>
        </div>
      </div>

      <div className="sticky top-[64px] sm:top-[70px] z-20 -mx-1 px-1 overflow-x-auto scrollbar-thin border-b border-slate-200 pb-3 mb-2 bg-slate-50/95 backdrop-blur-sm">
        <div className="flex gap-2 min-w-max pb-0.5">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-3 py-2 sm:px-3.5 rounded-xl text-xs sm:text-sm font-medium transition-colors no-underline whitespace-nowrap
                ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="max-w-[9rem] sm:max-w-none truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <Outlet />
    </div>
  );
};

export default SettingsLayout;
