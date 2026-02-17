/** @module shared/utils/constants */

export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  ADD_PRODUCT: '/products/add',
  EDIT_PRODUCT: '/products/edit/:id',
  INVENTORY_LIST: '/inventory',
  BATCH_TRACKING: '/batch-tracking',
  PRODUCT_DETAILS: '/products/:id',
  AI_QUERY: '/ai-query',
  STOCK_ALERTS: '/stock-alerts',
  LOW_STOCK: '/low-stock',
  REPORTS: '/reports',
  SALES_REPORT: '/reports/sales',
  STOCK_REPORT: '/reports/stock',
  INSIGHTS: '/insights',
};

export const ALERT_TYPES = {
  LOW_STOCK: 'low_stock',
  EXPIRING: 'expiring',
  OUT_OF_STOCK: 'out_of_stock',
};

export default { ROUTES, ALERT_TYPES };
