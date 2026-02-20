import { NavLink, useNavigate } from 'react-router-dom'

function Sidebar() {
  const navigate = useNavigate()
  const navItems = [
    { path: '/superadmin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/superadmin/tenants', label: 'Tenants', icon: '👥' },
    { path: '/superadmin/pricing', label: 'Pricing Plans', icon: '💰' },
    { path: '/superadmin/integration', label: 'Integrations', icon: '🔌' }
  ]

  return (
    <aside className="hidden md:flex w-64 flex-col h-screen fixed left-0 top-0 z-30 bg-white border-r border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">Super Admin</h1>
        <p className="text-xs text-slate-500 mt-1">Inventory Management</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 font-medium'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-2">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50">
          <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0">
            SA
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 truncate">Super Admin</p>
            <p className="text-xs text-slate-500 truncate">admin@example.com</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/superadmin/login')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 transition-colors"
        >
          <span aria-hidden>🚪</span>
          Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
