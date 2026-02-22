/**
 * Inventory Super Admin – constants & options
 */

export const availableVerticals = [
  'retail', 'wholesale', 'manufacturing', 'ecommerce', 'healthcare',
  'logistics', 'food_beverage', 'automotive', 'technology', 'other'
];

export const availableUseCases = [
  'stock_tracking', 'multi_warehouse', 'order_management', 'purchase_orders',
  'supplier_management', 'low_stock_alerts', 'reporting', 'barcode_scanning'
];

export const availableFeatures = [
  'products', 'stock_management', 'warehouses', 'orders', 'reporting',
  'analytics', 'low_stock_alerts', 'api_access', 'suppliers', 'integrations'
];

export const availableModules = [
  'products', 'categories', 'warehouses', 'stock_movements',
  'purchase_orders', 'suppliers', 'reporting', 'integrations'
];

export const availableFeaturesForPlan = [
  { id: 'users', label: 'User Management', description: 'Create and manage user accounts' },
  { id: 'storage', label: 'Cloud Storage', description: 'Store files and documents' },
  { id: 'products', label: 'Product Management', description: 'Products and SKUs' },
  { id: 'stock', label: 'Stock Tracking', description: 'Real-time stock levels' },
  { id: 'analytics', label: 'Analytics Dashboard', description: 'Inventory insights and reports' },
  { id: 'integrations', label: 'Third-party Integrations', description: 'Connect external services' },
  { id: 'sso', label: 'Single Sign-On', description: 'SSO and SAML authentication' },
  { id: 'warehouses', label: 'Multi-Warehouse', description: 'Multiple warehouse support' },
  { id: 'api', label: 'API Access', description: 'Programmatic access' },
  { id: 'suppliers', label: 'Supplier Management', description: 'Manage suppliers and POs' }
];
