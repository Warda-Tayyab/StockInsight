import { useAuth } from '../auth/AuthContext'

export default function Topbar({ title, onToggleSidebar }) {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/70 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 md:hidden"
            onClick={onToggleSidebar}
          >
            <span className="sr-only">Open navigation</span>
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 sm:text-base">
              {title}
            </h1>
            <p className="text-[11px] text-slate-500 sm:text-xs">
              Central command for all tenants, plans, and AI‑driven insights.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700 shadow-sm sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Real‑time anomaly detection
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-semibold text-white">
              {user?.name?.[0] ?? 'S'}
            </div>
            <div className="hidden text-xs leading-tight sm:block">
              <div className="font-medium text-slate-900">
                {user?.name ?? 'Super Admin'}
              </div>
              <div className="text-[10px] text-slate-500">
                {user?.email ?? 'admin@example.com'}
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="ml-1 inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold text-slate-50 hover:bg-slate-800"
            >
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M9 6h-2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                <path d="M16 17 21 12 16 7" />
                <path d="M21 12H9" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

