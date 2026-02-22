import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/use-auth';

import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import { DashboardLayout } from '@/components/layout';
import DashboardPage from '@/pages/DashboardPage';
import TenantManagementPage from '@/pages/TenantManagementPage';
import TenantDetailsPage from '@/pages/TenantDetailsPage';
import TenantCreatePage from '@/pages/TenantCreatePage';
import TenantEditPage from '@/pages/TenantEditPage';
import PricingPlansPage from '@/pages/PricingPlansPage';
import IntegrationsPage from '@/pages/IntegrationsPage';
import SystemSettingsPage from '@/pages/SystemSettingsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><span className="text-muted-foreground">Loading...</span></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><span className="text-muted-foreground">Loading...</span></div>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/tenant-management" element={<ProtectedRoute><DashboardLayout><TenantManagementPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/tenant-management/create" element={<ProtectedRoute><DashboardLayout><TenantCreatePage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/tenant-management/:id" element={<ProtectedRoute><DashboardLayout><TenantDetailsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/tenant-management/:id/edit" element={<ProtectedRoute><DashboardLayout><TenantEditPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/pricing-plans" element={<ProtectedRoute><DashboardLayout><PricingPlansPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/integrations" element={<ProtectedRoute><DashboardLayout><IntegrationsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/system-settings" element={<ProtectedRoute><DashboardLayout><SystemSettingsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
