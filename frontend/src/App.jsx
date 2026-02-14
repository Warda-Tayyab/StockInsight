import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/superAdmin/login";
import Dashboard from "./pages/superAdmin/Dashboard";
import DashboardHome from "./pages/superAdmin/DashboardHome";
import TenantCreate from "./pages/superAdmin/TenantCreate";
import TenantList from "./pages/superAdmin/TenantList";

function App() {
  return (
    <Router>
      <Routes>
        {/* Super Admin Login */}
        <Route path="/super-admin/login" element={<Login />} />

        {/* Dashboard wrapper with nested routes */}
        <Route path="/super-admin/dashboard" element={<Dashboard />}>
          {/* Dashboard home content */}
          <Route index element={<DashboardHome />} />

          {/* Tenant pages */}
          <Route path="create-tenant" element={<TenantCreate />} />
          <Route path="tenant-list" element={<TenantList />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/super-admin/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
