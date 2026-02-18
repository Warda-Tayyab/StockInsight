import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../ui/Sidebar'
import Topbar from '../ui/Topbar'

function getPageTitle(pathname) {
  if (pathname.startsWith('/tenants')) return 'Tenant Management'
  if (pathname.startsWith('/plans')) return 'Subscription Plans'
  if (pathname.startsWith('/revenue')) return 'Revenue & Financials'
  if (pathname.startsWith('/analytics')) return 'System Analytics'
  if (pathname.startsWith('/settings')) return 'Platform Settings'
  if (pathname.startsWith('/notifications')) return 'Notifications'
  return 'Super Admin Overview'
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const title = getPageTitle(location.pathname)

  return (
    <div className="flex h-full min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar title={title} onToggleSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 px-4 pb-6 pt-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

