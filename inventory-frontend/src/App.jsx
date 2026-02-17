/**
 * AI-Driven Inventory Insights System with RAG
 * App.jsx - Root component with routing placeholder
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './shared/context/AuthContext';
import { InventoryProvider } from './shared/context/InventoryContext';
import ProtectedRoute from './shared/components/ProtectedRoute';
import Layout from './components/Layout';

// Auth
import AuthRoutes from './inventory/authentication/routes/AuthRoutes';

// Dashboard
import Dashboard from './inventory/dashboard/pages/Dashboard';

// Inventory Management
import Products from './inventory/inventory-management/pages/Products';
import AddProduct from './inventory/inventory-management/pages/AddProduct';
import EditProduct from './inventory/inventory-management/pages/EditProduct';
import InventoryList from './inventory/inventory-management/pages/InventoryList';

// Product & Batch Tracking
import BatchTracking from './inventory/product-batch-tracking/pages/BatchTracking';
import ProductDetails from './inventory/product-batch-tracking/pages/ProductDetails';

// RAG Query
import AIQuery from './inventory/rag-query/pages/AIQuery';

// Stock Monitoring
import StockAlerts from './inventory/stock-monitoring/pages/StockAlerts';
import LowStock from './inventory/stock-monitoring/pages/LowStock';

// Reporting
import Reports from './inventory/reporting/pages/Reports';
import SalesReport from './inventory/reporting/pages/SalesReport';
import StockReport from './inventory/reporting/pages/StockReport';

// Explainable Insights
import Insights from './inventory/explainable-insights/pages/Insights';

const AppRoutes = () => {
  const { isAuthenticated } = useAuthContext();

  return (
    <Routes>
            <Route path="/auth/*" element={<AuthRoutes />} />
            <Route
              path="/"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <Products />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/add"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <AddProduct />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/edit/:id"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <EditProduct />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/:id"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <ProductDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <InventoryList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/batch-tracking"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <BatchTracking />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-query"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <AIQuery />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock-alerts"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <StockAlerts />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/low-stock"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <LowStock />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/sales"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <SalesReport />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/stock"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <StockReport />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/insights"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <Insights />
                  </Layout>
                </ProtectedRoute>
              }
            />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <InventoryProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </InventoryProvider>
    </AuthProvider>
  );
};

export default App;
