import { useState, useEffect, useCallback } from 'react';
import { tenantApi } from '@/services/api';

const MOCK_STATS = {
  summary: {
    tenants: { total: 12, active: 10, suspended: 1, delta: { vsLastMonthPct: '8%' } },
    users: { total: 450, active: 420, inactive: 30, delta: { vsLastMonthPct: '5%' } },
    inventory: {
      totalProducts: 12500,
      lowStockItems: 85,
      pendingOrders: 120,
      totalWarehouses: 24
    },
    revenue: { current: 45000, currency: 'USD', delta: { vsLastMonthPct: '12%' } }
  },
  meta: { currency: 'USD' },
  charts: {
    growthTrends: [
      { month: 'Jan', users: 40, orders: 1200 },
      { month: 'Feb', users: 55, orders: 1500 },
      { month: 'Mar', users: 70, orders: 1800 },
      { month: 'Apr', users: 85, orders: 2100 },
      { month: 'May', users: 95, orders: 2400 },
      { month: 'Jun', users: 110, orders: 2800 }
    ],
    planDistribution: [
      { plan: 'Starter', count: 5 },
      { plan: 'Pro', count: 4 },
      { plan: 'Enterprise', count: 3 }
    ],
    monthlyRevenue: [
      { month: 'Jan', revenue: 35000 },
      { month: 'Feb', revenue: 38000 },
      { month: 'Mar', revenue: 40000 },
      { month: 'Apr', revenue: 42000 },
      { month: 'May', revenue: 43000 },
      { month: 'Jun', revenue: 45000 }
    ]
  },
  recentActivities: [
    { id: '1', message: 'New tenant registered', tenant: 'Acme Corp', severity: 'low', occurredAt: new Date().toISOString() },
    { id: '2', message: 'Low stock alert – SKU #8821', tenant: 'TechStart Inc', severity: 'high', occurredAt: new Date().toISOString() },
    { id: '3', message: 'Bulk order completed', tenant: 'Global Solutions', severity: 'medium', occurredAt: new Date().toISOString() }
  ]
};

export function useDashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setStats({ stats: MOCK_STATS });
      setLoading(false);
    }, 400);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

export function useTenants(params = {}) {
  const [tenants, setTenants] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTenants = useCallback(async (newParams) => {
    const p = newParams || params;
    setLoading(true);
    setError(null);
    try {
      const res = await tenantApi.getList(p);
      if (res.success) {
        setTenants(Array.isArray(res.data) ? res.data : []);
        setPagination(res.pagination || { page: 1, total: 0, totalPages: 1 });
      }
    } catch (err) {
      setError(err.message || 'Failed to load tenants');
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, [params.page, params.limit]);

  useEffect(() => {
    fetchTenants(params);
  }, [params.page, params.limit]);

  return {
    tenants,
    pagination,
    loading,
    error,
    refetch: (newParams) => fetchTenants(newParams || params),
    setParams: (newParams) => fetchTenants(newParams)
  };
}

export function useTenant(identifier) {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTenant = useCallback(async (id) => {
    const tid = id || identifier;
    if (!tid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await tenantApi.getById(tid);
      if (res.success && res.data) setTenant(res.data);
      else setError('Tenant not found');
    } catch (err) {
      setError(err.message || 'Failed to load tenant');
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    if (identifier) fetchTenant();
  }, [identifier, fetchTenant]);

  return { tenant, loading, error, refetch: fetchTenant };
}

export function useTenantActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createTenant = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await tenantApi.create(payload);
      return res.success ? res.data : null;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateTenant = async (id, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await tenantApi.update(id, payload);
      return res.success;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createTenant,
    updateTenant,
    patchTenant: updateTenant,
    suspendTenant: async () => true,
    reactivateTenant: async () => true,
    createImpersonationSession: async () => null,
    exportTenantData: async () => true
  };
}

export function useTenantStats(tenantId) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    const t = setTimeout(() => {
      setStats({ userCount: 5, activeUsers: 4, departmentCount: 2, lastActivity: new Date().toISOString() });
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [tenantId]);

  return { stats, loading, error, refetch: () => {} };
}

export function useTenantUsers(tenantId) {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    const t = setTimeout(() => {
      setUsers([]);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [tenantId]);

  return { users, pagination, loading, error, refetch: () => {} };
}

export function useTenantQuotas(tenantId) {
  const [quotas, setQuotas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    const t = setTimeout(() => {
      setQuotas({ seats: 50, storageGB: 10 });
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [tenantId]);

  const updateQuotas = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    setLoading(false);
    return true;
  };

  return { quotas, loading, error, refetch: () => {}, updateQuotas };
}
