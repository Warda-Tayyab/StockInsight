import { Routes, Route, Navigate } from 'react-router-dom'
import SuperAdminLayout from '../layouts/SuperAdminLayout'
import Login from '../pages/superadmin/Login'
import Dashboard from '../pages/superadmin/Dashboard'
import TenantManagement from '../pages/superadmin/TenantManagement'
import PricingPlan from '../pages/superadmin/PricingPlan'
import Integration from '../pages/superadmin/Integration'

function SuperAdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="" element={<SuperAdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tenants" element={<TenantManagement />} />
        <Route path="pricing" element={<PricingPlan />} />
        <Route path="integration" element={<Integration />} />
      </Route>
    </Routes>
  )
}

export default SuperAdminRoutes
