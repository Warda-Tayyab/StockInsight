import { NavLink, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
  { to: '/tenants', label: 'Tenants', icon: 'users' },
  { to: '/plans', label: 'Plans', icon: 'layers' },
  { to: '/revenue', label: 'Revenue', icon: 'chart' },
  { to: '/analytics', label: 'Analytics', icon: 'spark' },
  { to: '/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

function Icon({ name, className = 'h-4 w-4' }) {
  switch (name) {
    case 'grid':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    case 'users':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M16 21v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
          <circle cx="9" cy="7" r="3" />
          <path d="M22 21v-1a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a3 3 0 0 1 0 5.75" />
        </svg>
      )
    case 'layers':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="m12 3 9 4.5-9 4.5L3 7.5 12 3Z" />
          <path d="m3 12 9 4.5 9-4.5" />
          <path d="m3 16.5 9 4.5 9-4.5" />
        </svg>
      )
    case 'chart':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M3 3v18h18" />
          <path d="M7 15l4-6 4 3 5-8" />
          <circle cx="7" cy="15" r="0.8" />
          <circle cx="11" cy="9" r="0.8" />
          <circle cx="15" cy="12" r="0.8" />
          <circle cx="20" cy="4" r="0.8" />
        </svg>
      )
    case 'spark':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="m4.93 4.93 2.83 2.83" />
          <path d="m16.24 16.24 2.83 2.83" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
          <circle cx="12" cy="12" r="4.5" />
        </svg>
      )
    case 'bell':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.7 1.7 0 0 0 3.4 0" />
        </svg>
      )
    case 'settings':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 15a1.8 1.8 0 0 0 .37 2l.06.06a1.7 1.7 0 0 1 0 2.4 1.7 1.7 0 0 1-2.4 0l-.06-.06a1.8 1.8 0 0 0-2-.37 1.8 1.8 0 0 0-1.1 1.65V21a1.7 1.7 0 0 1-1.7 1.7 1.7 1.7 0 0 1-1.7-1.7v-.09A1.8 1.8 0 0 0 9.1 19a1.8 1.8 0 0 0-2 .37l-.06.06a1.7 1.7 0 0 1-2.4 0 1.7 1.7 0 0 1 0-2.4l.06-.06A1.8 1.8 0 0 0 5.1 15a1.8 1.8 0 0 0-1.65-1.1H3.4A1.7 1.7 0 0 1 1.7 12 1.7 1.7 0 0 1 3.4 10.3h.09A1.8 1.8 0 0 0 5.1 9.1a1.8 1.8 0 0 0-.37-2l-.06-.06a1.7 1.7 0 0 1 0-2.4 1.7 1.7 0 0 1 2.4 0l.06.06A1.8 1.8 0 0 0 9.1 5.1a1.8 1.8 0 0 0 1.1-1.65V3.4A1.7 1.7 0 0 1 11.9 1.7 1.7 1.7 0 0 1 13.6 3.4v.09A1.8 1.8 0 0 0 15 5.1a1.8 1.8 0 0 0 2-.37l.06-.06a1.7 1.7 0 0 1 2.4 0 1.7 1.7 0 0 1 0 2.4l-.06.06a1.8 1.8 0 0 0-.37 2 1.8 1.8 0 0 0 1.65 1.1h.09A1.7 1.7 0 0 1 22.3 12a1.7 1.7 0 0 1-1.7 1.7h-.09A1.8 1.8 0 0 0 19.4 15Z" />
        </svg>
      )
    default:
      return null
  }
}

export default function Sidebar({ open, onClose }) {
  const location = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white/80 px-3 pb-4 pt-3 shadow-lg backdrop-blur-md transition-transform duration-200 md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-1 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-sm">
              SI
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                StockInsight
              </div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-indigo-500">
                Super Admin
              </div>
            </div>
          </div>

          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-600 ring-1 ring-emerald-100">
            AI‑Driven
          </span>
        </div>

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto pb-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-md border text-[11px] ${
                      isActive
                        ? 'border-indigo-200 bg-indigo-100 text-indigo-700'
                        : 'border-slate-200 bg-slate-50 text-slate-500 group-hover:border-slate-300 group-hover:text-slate-700'
                    }`}
                  >
                    <Icon name={item.icon} className="h-3.5 w-3.5" />
                  </span>
                  <span>{item.label}</span>

                  {location.pathname === item.to && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
          <div className="flex items-center justify-between gap-2">
            <span>Platform health</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              99.9%
            </span>
          </div>
          <p className="mt-1 text-[10px] leading-snug text-slate-400">
            All tenant clusters and AI pipelines are operating normally.
          </p>
        </div>
      </aside>
    </>
  )
}

