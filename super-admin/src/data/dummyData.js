// Dashboard summary
export const dashboardSummary = {
  totalTenants: 124,
  totalUsers: 2847,
  totalRevenue: 89240,
}

// Growth trends - 6 months (Users + Orders)
export const growthTrends = [
  { month: 'Sep', users: 420, orders: 1250 },
  { month: 'Oct', users: 580, orders: 1420 },
  { month: 'Nov', users: 720, orders: 1680 },
  { month: 'Dec', users: 890, orders: 1950 },
  { month: 'Jan', users: 1050, orders: 2200 },
  { month: 'Feb', users: 1240, orders: 2480 },
]

// Plan distribution for pie chart
export const planDistribution = [
  { name: 'Starter', value: 45, color: '#0ea5e9' },
  { name: 'Professional', value: 52, color: '#8b5cf6' },
  { name: 'Enterprise', value: 27, color: '#10b981' },
]

// Revenue trend - line chart
export const revenueTrend = [
  { month: 'Sep', revenue: 11200 },
  { month: 'Oct', revenue: 13500 },
  { month: 'Nov', revenue: 14800 },
  { month: 'Dec', revenue: 16200 },
  { month: 'Jan', revenue: 17800 },
  { month: 'Feb', revenue: 15740 },
]

// Tenants list
export const tenantsList = [
  {
    id: '1',
    companyName: 'Acme Corp',
    slug: 'acme-corp',
    ownerEmail: 'admin@acme.com',
    status: 'Active',
    region: 'US East',
    plan: 'Professional',
    businessVertical: 'Retail',
    useCase: 'Warehouse',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    companyName: 'TechStart Inc',
    slug: 'techstart-inc',
    ownerEmail: 'owner@techstart.io',
    status: 'Trial',
    region: 'EU West',
    plan: 'Starter',
    businessVertical: 'Technology',
    useCase: 'Dropshipping',
    createdAt: '2024-02-01',
  },
  {
    id: '3',
    companyName: 'Global Logistics',
    slug: 'global-logistics',
    ownerEmail: 'contact@globallog.com',
    status: 'Active',
    region: 'APAC',
    plan: 'Enterprise',
    businessVertical: 'Logistics',
    useCase: 'Warehouse',
    createdAt: '2023-11-20',
  },
  {
    id: '4',
    companyName: 'Retail Plus',
    slug: 'retail-plus',
    ownerEmail: 'hello@retailplus.co',
    status: 'Suspended',
    region: 'US West',
    plan: 'Starter',
    businessVertical: 'Retail',
    useCase: 'Retail Store',
    createdAt: '2024-01-08',
  },
  {
    id: '5',
    companyName: 'Supply Chain Co',
    slug: 'supply-chain-co',
    ownerEmail: 'info@supplychain.co',
    status: 'Active',
    region: 'EU Central',
    plan: 'Professional',
    businessVertical: 'Manufacturing',
    useCase: 'Warehouse',
    createdAt: '2023-12-12',
  },
]

// Integrations
export const integrations = [
  { id: 'email', name: 'Email Service', status: 'Connected', description: 'Send transactional emails' },
  { id: 'payment', name: 'Payment Gateway', status: 'Connected', description: 'Stripe integration' },
  { id: 'analytics', name: 'Analytics', status: 'Not Connected', description: 'Google Analytics & events' },
  { id: 'webhooks', name: 'Webhooks', status: 'Not Connected', description: 'Outbound webhook endpoints' },
]

// Revenue page data
export const revenueData = {
  totalRevenue: 89240,
  activeSubscriptions: 98,
}

export const revenueTrendFull = [
  { month: 'Sep', revenue: 11200 },
  { month: 'Oct', revenue: 13500 },
  { month: 'Nov', revenue: 14800 },
  { month: 'Dec', revenue: 16200 },
  { month: 'Jan', revenue: 17800 },
  { month: 'Feb', revenue: 15740 },
]

export const subscriptionsTable = [
  { id: 1, tenant: 'Acme Corp', plan: 'Professional', mrr: 199, status: 'Active' },
  { id: 2, tenant: 'TechStart Inc', plan: 'Starter', mrr: 49, status: 'Trial' },
  { id: 3, tenant: 'Global Logistics', plan: 'Enterprise', mrr: 499, status: 'Active' },
  { id: 4, tenant: 'Retail Plus', plan: 'Starter', mrr: 49, status: 'Suspended' },
  { id: 5, tenant: 'Supply Chain Co', plan: 'Professional', mrr: 199, status: 'Active' },
]

// Options for forms
export const statusOptions = ['Active', 'Trial', 'Suspended']
export const regionOptions = ['US East', 'US West', 'EU West', 'EU Central', 'APAC']
export const businessVerticalOptions = ['Retail', 'Technology', 'Logistics', 'Manufacturing', 'Healthcare', 'Other']
export const useCaseOptions = ['Warehouse', 'Dropshipping', 'Retail Store', 'Multi-location', 'Other']
