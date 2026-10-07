import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Plug,
  DollarSign,
  CreditCard,
  Menu,
  X,
  LogOut,
} from 'lucide-react'

const navItems = [
  { to: '/super-admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/super-admin/tenants', icon: Users, label: 'Tenant Management' },
  { to: '/super-admin/pricing-plans', icon: CreditCard, label: 'Pricing Plans' },
  // { to: '/super-admin/integrations', icon: Plug, label: 'Integrations' },
  { to: '/super-admin/revenue', icon: DollarSign, label: 'Revenue' },
]

function SuperAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 shadow-sm transform transition-transform duration-200 ease-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
       <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">

<div className="flex items-center gap-3 min-w-0">
  <img
    src="/superadmin-logo.jpg"
    alt="StockInsight Logo"
    className="w-10 h-10 object-contain rounded-lg shrink-0"
  />

  <span className="text-lg font-semibold text-slate-800 truncate">
    Super Admin
  </span>
</div>

<button
  type="button"
  className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
  onClick={() => setSidebarOpen(false)}
  aria-label="Close menu"
>
  <X className="w-5 h-5 text-slate-600" />
</button>

</div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/super-admin'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={() => {
              localStorage.removeItem('superAdminToken')
              navigate('/super-admin/login')
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors w-full"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center h-16 px-4 lg:px-8 bg-white border-b border-slate-200 shadow-sm">
          <button
            type="button"
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          <span className="ml-2 text-slate-500 text-sm hidden sm:inline">Multi-Tenant Inventory SaaS</span>
        </header>
        <main
  className={
    location.pathname === "/super-admin/tenants/create"
      ? "flex-1"
      : "flex-1 p-4 lg:p-8"
  }
>
  <Outlet />
</main>
      </div>
    </div>
  )
}

export default SuperAdminLayout
