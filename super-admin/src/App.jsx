import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SuperAdminLayout from './layouts/SuperAdminLayout'
import Login from './pages/super-admin/Login'
import Dashboard from './pages/super-admin/Dashboard'
import Tenants from './pages/super-admin/Tenants'
import TenantDetails from './pages/super-admin/TenantDetails'
import Integrations from './pages/super-admin/Integrations'
import Revenue from './pages/super-admin/Revenue'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/super-admin/login" element={<Login />} />
        <Route path="/super-admin" element={<SuperAdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="tenants" element={<Tenants />} />
          <Route path="tenants/:id" element={<TenantDetails />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="revenue" element={<Revenue />} />
        </Route>
        <Route path="/" element={<Navigate to="/super-admin/login" replace />} />
        <Route path="*" element={<Navigate to="/super-admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
