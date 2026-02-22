/**
 * Dummy data – Inventory Super Admin
 * Jab APIs banaogi to isko replace kar dena / API response use karna
 */

export const DUMMY_TENANTS = [
  {
    _id: 't1',
    tenantId: 't1',
    companyName: 'Acme Corp',
    slug: 'acme',
    status: 'active',
    region: 'us-east-1',
    features: ['products', 'stock_management', 'warehouses', 'reporting'],
    primaryContact: { name: 'John Doe', email: 'john@acme.com', phone: '+1 555-0100' },
    createdAt: '2024-01-15T10:00:00Z',
    quotas: { storageGB: 50, seats: 25, ordersPerMonth: 5000 },
    trial: { days: 14 }
  },
  {
    _id: 't2',
    tenantId: 't2',
    companyName: 'TechStart Inc',
    slug: 'techstart',
    status: 'trial',
    region: 'us-west-2',
    features: ['products', 'stock_management', 'analytics'],
    primaryContact: { name: 'Jane Smith', email: 'jane@techstart.com' },
    createdAt: '2024-02-01T09:00:00Z',
    quotas: { storageGB: 10, seats: 10, ordersPerMonth: 500 },
    trial: { days: 7 }
  },
  {
    _id: 't3',
    tenantId: 't3',
    companyName: 'Global Solutions',
    slug: 'global-sol',
    status: 'active',
    region: 'eu-west-1',
    features: ['products', 'warehouses', 'api_access', 'integrations', 'suppliers'],
    primaryContact: { name: 'Ali Khan', email: 'ali@globalsol.com' },
    createdAt: '2023-11-20T14:00:00Z',
    quotas: { storageGB: 100, seats: 50, ordersPerMonth: 50000 },
    trial: null
  }
];

export const DUMMY_PLANS = [
  {
    _id: 'plan1',
    code: 'starter_month',
    name: 'Starter',
    description: 'For small inventory operations',
    pricePerUser: 9,
    interval: 'month',
    billingModel: 'per_user',
    features: [
      { _id: 'f1', key: 'Product Management', isAdd: true },
      { _id: 'f2', key: 'Stock Tracking', isAdd: true }
    ],
    quotas: { usersMax: 10, storagePerUserGB: 5, apiCallsPerMonth: 1000 },
    isActive: true,
    isMostPopular: false
  },
  {
    _id: 'plan2',
    code: 'pro_month',
    name: 'Professional',
    description: 'For growing inventory businesses',
    pricePerUser: 19,
    interval: 'month',
    billingModel: 'per_user',
    features: [
      { _id: 'f1', key: 'Product Management', isAdd: true },
      { _id: 'f2', key: 'Stock Tracking', isAdd: true },
      { _id: 'f3', key: 'Analytics Dashboard', isAdd: true },
      { _id: 'f4', key: 'Multi-Warehouse', isAdd: true }
    ],
    quotas: { usersMax: 50, storagePerUserGB: 20, apiCallsPerMonth: 10000 },
    isActive: true,
    isMostPopular: true
  },
  {
    _id: 'plan3',
    code: 'enterprise_month',
    name: 'Enterprise',
    description: 'Full inventory management for large organizations',
    pricePerUser: 49,
    interval: 'month',
    billingModel: 'per_user',
    features: [
      { _id: 'f1', key: 'Product Management', isAdd: true },
      { _id: 'f2', key: 'Stock Tracking', isAdd: true },
      { _id: 'f3', key: 'Analytics Dashboard', isAdd: true },
      { _id: 'f4', key: 'Multi-Warehouse', isAdd: true },
      { _id: 'f5', key: 'Single Sign-On', isAdd: true },
      { _id: 'f6', key: 'API Access', isAdd: true },
      { _id: 'f7', key: 'Supplier Management', isAdd: true }
    ],
    quotas: { usersMax: -1, storagePerUserGB: 100, apiCallsPerMonth: 100000 },
    isActive: true,
    isMostPopular: false
  }
];

export const DUMMY_INTEGRATIONS = [
  { _id: 'int1', name: 'slack', displayName: 'Slack', description: 'Low stock alerts & notifications', category: 'communication', isActive: true },
  { _id: 'int2', name: 'quickbooks', displayName: 'QuickBooks', description: 'Sync orders & inventory', category: 'accounting', isActive: true },
  { _id: 'int3', name: 'shopify', displayName: 'Shopify', description: 'E-commerce inventory sync', category: 'ecommerce', isActive: true },
  { _id: 'int4', name: 'saml', displayName: 'SAML SSO', description: 'Single sign-on', category: 'authentication', isActive: true }
];
