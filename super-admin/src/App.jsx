import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SuperAdminLayout from './layouts/SuperAdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/super-admin/Login'
import Dashboard from './pages/super-admin/Dashboard'
import Tenants from './pages/super-admin/Tenants'
import TenantDetails from './pages/super-admin/TenantDetails'
// import Integrations from './pages/super-admin/Integrations'
import Revenue from './pages/super-admin/Revenue'
import PricingPlans from './pages/super-admin/PricingPlans'
import ArchivedTenants from './pages/super-admin/ArchivedTenants';
import CreateTenant from './pages/super-admin/CreateTenant'
import EditTenant from './pages/super-admin/EditTenant'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            padding: '12px 16px',
          }
        }}
      />
      <Routes>
        <Route path="/super-admin/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<SuperAdminLayout />}>
            <Route path="/super-admin" element={<Dashboard />} />
            <Route path="/super-admin/tenants" element={<Tenants />} />
            <Route path="/super-admin/tenants/create"element={<CreateTenant />}/>
            <Route path="/super-admin/tenants/archived" element={<ArchivedTenants />} />
            <Route  path="/super-admin/tenants/edit/:id" element={<EditTenant />} />
            <Route path="/super-admin/tenants/:id" element={<TenantDetails />} />
            <Route path="/super-admin/pricing-plans" element={<PricingPlans />} />
            {/* <Route path="/super-admin/integrations" element={<Integrations />} /> */}
            <Route path="/super-admin/revenue" element={<Revenue />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/super-admin/login" replace />} />
        <Route
          path="*"
          element={
            localStorage.getItem('superAdminToken')
              ? <Navigate to="/super-admin" replace />
              : <Navigate to="/super-admin/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
