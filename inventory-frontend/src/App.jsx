/**
 * AI-Driven Inventory Insights System with RAG
 * App.jsx - Root component with routing
 */

import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
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
import InventoryHistory from './inventory/inventory-management/pages/InventoryHistory';

// Warehouses
import Warehouses from './inventory/inventory-management/pages/Warehouses';
import AddWarehouse from './inventory/inventory-management/pages/AddWarehouse';
import WarehouseDetails from './inventory/inventory-management/pages/WarehouseDetails';
import EditWarehouse from './inventory/inventory-management/pages/EditWarehouse';

// Product & Batch Tracking
import BatchTracking from './inventory/product-batch-tracking/pages/BatchTracking';
import ProductDetails from './inventory/product-batch-tracking/pages/ProductDetails';
import BatchDetailsPage from './inventory/product-batch-tracking/pages/BatchDetailsPage';

// RAG Query
import AIQuery from './inventory/rag-query/pages/AIQuery';

// Stock Monitoring
import StockAlerts from './inventory/stock-monitoring/pages/StockAlerts';
import LowStock from './inventory/stock-monitoring/pages/LowStock';

// Reporting
import Reports from './inventory/reporting/pages/Reports';
import SalesReport from './inventory/reporting/pages/SalesReport';
import InventoryReport from './inventory/reporting/pages/InventoryReport';
import LowStockReport from './inventory/reporting/pages/LowStockReport';
import ProfitLossReport from './inventory/reporting/pages/ProfitLossReport';
import PurchaseReport from './inventory/reporting/pages/PurchaseReport';
import WarehousePerformance from './inventory/reporting/pages/WarehousePerformance';
import ProductPerformance from './inventory/reporting/pages/ProductPerformance';
import ExpiryReport from './inventory/reporting/pages/ExpiryReport';
import UserActivityReport from './inventory/reporting/pages/UserActivityReport';

// Explainable Insights
import Insights from './inventory/explainable-insights/pages/Insights';

// POS
import POS from './pos/pages/POS';
import SalesHistory from './pos/pages/SalesHistory';
import ReturnExchange from './pos/pages/ReturnExchange';
import { POSProvider } from './pos/context/POSContext';

// Settings
import SettingsLayout from './inventory/settings/pages/SettingsLayout';
import UserManagement from './inventory/settings/pages/UserManagement';
import ReturnExchangeSettings from './inventory/settings/pages/ReturnExchangeSettings';
import CouponsDiscountsSettings from './inventory/settings/pages/CouponsDiscountsSettings';
import ProfileSettings from './inventory/settings/pages/ProfileSettings';
import BusinessSettings from './inventory/settings/pages/BusinessSettings';
//import AppearanceSettings from './inventory/settings/pages/AppearanceSettings';
//import NotificationSettings from './inventory/settings/pages/NotificationSettings';
import SecuritySettings from './inventory/settings/pages/SecuritySettings';
import DataManagementSettings from './inventory/settings/pages/DataManagementSettings';
import EmailConfigSettings from './inventory/settings/pages/EmailConfigSettings';
import CategoriesSettings from './inventory/settings/pages/CategoriesSettings';
import InventoryAction from './inventory/inventory-management/pages/InventoryAction';

import PurchasingOverview from './inventory/purchasing/pages/PurchasingOverview';
import VendorsPage from './inventory/purchasing/pages/VendorsPage';
import PurchaseOrdersPage from './inventory/purchasing/pages/PurchaseOrdersPage';
import PurchaseOrderFormPage from './inventory/purchasing/pages/PurchaseOrderFormPage';
import PurchaseOrderDetailPage from './inventory/purchasing/pages/PurchaseOrderDetailPage';
import GoodsReceiptsPage from './inventory/purchasing/pages/GoodsReceiptsPage';
import GoodsReceiptFormPage from './inventory/purchasing/pages/GoodsReceiptFormPage';
import GoodsReceiptDetailPage from './inventory/purchasing/pages/GoodsReceiptDetailPage';
import BillsPage from './inventory/purchasing/pages/BillsPage';
import StockTransfersPage from './inventory/purchasing/pages/StockTransfersPage';
import StockTransferFormPage from './inventory/purchasing/pages/StockTransferFormPage';
import PurchaseReturnsPage from './inventory/purchasing/pages/PurchaseReturnsPage';
import PurchaseReturnFormPage from './inventory/purchasing/pages/PurchaseReturnFormPage';
import PurchaseReturnDetailPage from './inventory/purchasing/pages/PurchaseReturnDetailPage';

import RoleProtectedRoute from './shared/components/RoleProtectedRoute';
import { FULL_ACCESS_ROLES, SETTINGS_ROLES, POS_ROLES, hasFullAccess } from './shared/utils/roles';
import { Toaster } from 'react-hot-toast';

const FullAccessRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthContext();
  return (
    <RoleProtectedRoute
      isAuthenticated={isAuthenticated}
      user={user}
      allowedRoles={FULL_ACCESS_ROLES}
    >
      {children}
    </RoleProtectedRoute>
  );
};

const SettingsAccessRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthContext();
  return (
    <RoleProtectedRoute
      isAuthenticated={isAuthenticated}
      user={user}
      allowedRoles={SETTINGS_ROLES}
    >
      {children}
    </RoleProtectedRoute>
  );
};

const PosAccessRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthContext();
  return (
    <RoleProtectedRoute
      isAuthenticated={isAuthenticated}
      user={user}
      allowedRoles={POS_ROLES}
    >
      {children}
    </RoleProtectedRoute>
  );
};

const WarehouseLegacyRedirect = ({ suffix }) => {
  const { id } = useParams();
  return <Navigate to={`/settings/warehouses/${suffix}/${id}`} replace />;
};

const HomeRedirect = () => {
  const { user } = useAuthContext();
  if (hasFullAccess(user?.role)) {
    return <Dashboard />;
  }
  return <Navigate to="/pos" replace />;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuthContext();

  return (
    <Routes>
      <Route path="/auth/*" element={<AuthRoutes />} />

      <Route
        path="/"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Layout>
              <HomeRedirect />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <FullAccessRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </FullAccessRoute>
        }
      />

      {/* Inventory — owner & manager */}
      <Route
        path="/products"
        element={
          <FullAccessRoute>
            <Layout>
              <Products />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/products/add"
        element={
          <FullAccessRoute>
            <Layout>
              <AddProduct />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/products/edit/:id"
        element={
          <FullAccessRoute>
            <Layout>
              <EditProduct />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <FullAccessRoute>
            <Layout>
              <ProductDetails />
            </Layout>
          </FullAccessRoute>
        }
      />

      {/* Purchasing — owner & manager */}
      <Route
        path="/purchasing"
        element={
          <FullAccessRoute>
            <Layout>
              <PurchasingOverview />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/purchasing/vendors"
        element={
          <FullAccessRoute>
            <Layout>
              <VendorsPage />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/purchasing/orders"
        element={
          <FullAccessRoute>
            <Layout>
              <PurchaseOrdersPage />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/purchasing/orders/new"
        element={
          <FullAccessRoute>
            <Layout>
              <PurchaseOrderFormPage />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/purchasing/orders/:id"
        element={
          <FullAccessRoute>
            <Layout>
              <PurchaseOrderDetailPage />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/purchasing/receive"
        element={
          <FullAccessRoute>
            <Layout>
              <GoodsReceiptsPage />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/purchasing/receive/new"
        element={
          <FullAccessRoute>
            <Layout>
              <GoodsReceiptFormPage />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/purchasing/receive/:id"
        element={
          <FullAccessRoute>
            <Layout>
              <GoodsReceiptDetailPage />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/purchasing/bills"
        element={
          <FullAccessRoute>
            <Layout>
              <BillsPage />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/purchasing/returns"
        element={
          <FullAccessRoute>
            <Layout>
              <PurchaseReturnsPage />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/purchasing/returns/new"
        element={
          <FullAccessRoute>
            <Layout>
              <PurchaseReturnFormPage />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/purchasing/returns/:id"
        element={
          <FullAccessRoute>
            <Layout>
              <PurchaseReturnDetailPage />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/purchasing/transfers"
        element={
          <FullAccessRoute>
            <Layout>
              <StockTransfersPage />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/purchasing/transfers/new"
        element={
          <FullAccessRoute>
            <Layout>
              <StockTransferFormPage />
            </Layout>
          </FullAccessRoute>
        }
      />

      <Route
        path="/inventory"
        element={
          <FullAccessRoute>
            <Layout>
              <InventoryList />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/inventory/history"
        element={
          <FullAccessRoute>
            <Layout>
              <InventoryHistory />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/inventory/:type"
        element={
          <FullAccessRoute>
            <Layout>
              <InventoryAction />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/batch-tracking"
        element={
          <FullAccessRoute>
            <Layout>
              <BatchTracking />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/batches/:id"
        element={
          <FullAccessRoute>
            <Layout>
              <BatchDetailsPage />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/ai-query"
        element={
          <FullAccessRoute>
            <Layout>
              <AIQuery />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/stock-alerts"
        element={
          <FullAccessRoute>
            <Layout>
              <StockAlerts />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/low-stock"
        element={
          <FullAccessRoute>
            <Layout>
              <LowStock />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <FullAccessRoute>
            <Layout>
              <Reports />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/reports/sales"
        element={
          <FullAccessRoute>
            <Layout>
              <SalesReport />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route path="/reports/stock" element={<Navigate to="/reports/inventory" replace />} />
      <Route
        path="/reports/inventory"
        element={
          <FullAccessRoute>
            <Layout>
              <InventoryReport />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/reports/low-stock"
        element={
          <FullAccessRoute>
            <Layout>
              <LowStockReport />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/reports/purchasing"
        element={
          <FullAccessRoute>
            <Layout>
              <PurchaseReport />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/reports/profit-loss"
        element={
          <FullAccessRoute>
            <Layout>
              <ProfitLossReport />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/reports/warehouse"
        element={
          <FullAccessRoute>
            <Layout>
              <WarehousePerformance />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/reports/product-performance"
        element={
          <FullAccessRoute>
            <Layout>
              <ProductPerformance />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/reports/expiry"
        element={
          <FullAccessRoute>
            <Layout>
              <ExpiryReport />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/reports/user-activity"
        element={
          <FullAccessRoute>
            <Layout>
              <UserActivityReport />
            </Layout>
          </FullAccessRoute>
        }
      />
      <Route
        path="/insights"
        element={
          <FullAccessRoute>
            <Layout>
              <Insights />
            </Layout>
          </FullAccessRoute>
        }
      />

      {/* POS — owner, manager, cashier */}
      <Route
        path="/pos"
        element={
          <PosAccessRoute>
            <POSProvider>
              <Layout>
                <POS />
              </Layout>
            </POSProvider>
          </PosAccessRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <PosAccessRoute>
            <POSProvider>
              <Layout>
                <SalesHistory />
              </Layout>
            </POSProvider>
          </PosAccessRoute>
        }
      />
      <Route
        path="/returns"
        element={
          <PosAccessRoute>
            <POSProvider>
              <Layout>
                <ReturnExchange />
              </Layout>
            </POSProvider>
          </PosAccessRoute>
        }
      />
{/* Categories — separate page */}
<Route
  path="/categories"
  element={
    <FullAccessRoute>
      <Layout>
        <CategoriesSettings />
      </Layout>
    </FullAccessRoute>
  }
/>
      {/* Settings hub — owner only */}
      <Route
        path="/settings"
        element={
          <SettingsAccessRoute>
            <Layout>
              <SettingsLayout />
            </Layout>
          </SettingsAccessRoute>
        }
      >
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<ProfileSettings />} />
        <Route path="business" element={<BusinessSettings />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="warehouses" element={<Warehouses />} />
        <Route path="warehouses/add" element={<AddWarehouse />} />
        <Route path="warehouses/view/:id" element={<WarehouseDetails />} />
        <Route path="warehouses/edit/:id" element={<EditWarehouse />} />
        <Route path="return-exchange" element={<ReturnExchangeSettings />} />
        <Route path="promotions" element={<CouponsDiscountsSettings />} />
        <Route path="security" element={<SecuritySettings />} />
        <Route path="data" element={<DataManagementSettings />} />
        <Route path="email" element={<EmailConfigSettings />} />
      </Route>

      {/* Legacy warehouse redirects */}
      <Route path="/warehouses" element={<Navigate to="/settings/warehouses" replace />} />
      <Route path="/warehouses/add" element={<Navigate to="/settings/warehouses/add" replace />} />
      <Route
        path="/warehouses/view/:id"
        element={<WarehouseLegacyRedirect suffix="view" />}
      />
      <Route
        path="/warehouses/edit/:id"
        element={<WarehouseLegacyRedirect suffix="edit" />}
      />

      <Route
        path="*"
        element={
          <Navigate
            to={hasFullAccess(user?.role) ? '/dashboard' : '/pos'}
            replace
          />
        }
      />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <InventoryProvider>
        <Toaster
          position="top-center"
          containerStyle={{
            top: 12,
            left: 12,
            right: 12,
          }}
          toastOptions={{
            duration: 4000,
            className: 'max-w-[calc(100vw-1.5rem)] sm:max-w-md',
            style: {
              borderRadius: '12px',
              padding: '12px 16px',
              background: '#fff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 24px rgba(15, 23, 42, 0.1)',
              maxWidth: 'calc(100vw - 1.5rem)',
            },
            success: {
              iconTheme: { primary: '#4f46e5', secondary: '#fff' },
            },
          }}
        />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </InventoryProvider>
    </AuthProvider>
  );
};

export default App;
