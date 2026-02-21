import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../components/superadmin/Sidebar'

function SuperAdminLayout() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      {/* Mobile header: visible when sidebar is hidden */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
        <span className="text-lg font-bold text-slate-900">Super Admin</span>
        <button
          type="button"
          onClick={() => navigate('/superadmin/login')}
          className="text-sm font-medium text-slate-600 hover:text-rose-600"
        >
          Logout
        </button>
      </header>
      <main className="flex-1 w-full min-w-0 md:ml-64 pt-14 md:pt-0 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}

export default SuperAdminLayout
