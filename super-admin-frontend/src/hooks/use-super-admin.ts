"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { superAdminAPI } from '../api/super-admin-api';
import { DashboardStats, Tenant, TenantStats, TenantListParams, Pagination, CreateTenantRequest, UpdateTenantRequest, SuspendTenantRequest, ReactivateTenantRequest, ImpersonateRequest, TenantUsersParams, TenantUser, PaginationInfo, Quotas } from '../types/super-admin';

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await superAdminAPI.getDashboardStats();
      if (response && response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response?.message || 'Failed to fetch dashboard stats');
      }
    } catch (error) {
      const apiError = error as { response?: { status: number }; message?: string };
      console.error('Dashboard stats fetch error:', apiError);
      
      if (apiError?.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else if (apiError?.message === 'Authentication required') {
        setError('Please log in again to continue.');
      } else if (apiError?.response?.status === 404) {
        setError('Dashboard stats endpoint not found. Please check API configuration.');
      } else {
        setError(apiError?.message || 'Failed to load dashboard statistics');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};

export const useTenants = (params: TenantListParams) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const paramsRef = useRef(params);

  // Update params ref when params change
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const fetchTenants = useCallback(async (newParams?: TenantListParams) => {
    const queryParams = newParams || paramsRef.current;
    
    setLoading(true);
    setError(null);
    try {
      const response = await superAdminAPI.getTenants(queryParams);
      if (response && response.success && Array.isArray(response.data)) {
        setTenants(response.data);
        setPagination(response.pagination || null);
      } else if (response && response.success && response.data && typeof response.data === 'object') {
        const nestedData = response.data as { tenants?: Tenant[]; items?: Tenant[] };
        if (Array.isArray(nestedData.tenants)) {
          setTenants(nestedData.tenants);
          setPagination(response.pagination || null);
        } else if (Array.isArray(nestedData.items)) {
          setTenants(nestedData.items);
          setPagination(response.pagination || null);
        } else {
          console.error('No recognizable array found in response data:', response.data);
          setError('Unexpected data format received from server');
          setTenants([]); // Ensure tenants is always an array
        }
      } else {
        console.error('Invalid response structure:', response);
        setError('Invalid response format from server');
        setTenants([]); // Ensure tenants is always an array
      }
    } catch (error) {
      const apiError = error as { response?: { status: number }; message?: string };
      console.error('Tenants fetch error:', apiError);
      setTenants([]); // Ensure tenants is always an array on error
      
      if (apiError?.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else if (apiError?.message === 'Authentication required') {
        setError('Please log in again to continue.');
      } else if (apiError?.response?.status === 404) {
        setError('Tenants endpoint not found. Please check API configuration.');
      } else {
        setError(apiError?.message || 'Failed to load tenants');
      }
    } finally {
      setLoading(false);
    }
  }, []); // Remove params dependency to avoid infinite re-renders

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const setParams = useCallback((newParams: TenantListParams) => {
    paramsRef.current = newParams;
    fetchTenants(newParams);
  }, [fetchTenants]);

  return { 
    tenants, 
    pagination, 
    loading, 
    error, 
    refetch: fetchTenants,
    setParams 
  };
};

export const useTenant = (identifier: string) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenant = useCallback(async (id?: string) => {
    const tenantId = id || identifier;
    if (!tenantId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await superAdminAPI.getTenant(tenantId);
      if (response.success && response.data) {
        setTenant(response.data);
      } else {
        setError(response.error || 'Failed to fetch tenant');
      }
    } catch (error) {
      const apiError = error as { message?: string };
      setError(apiError?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    if (identifier) {
      fetchTenant();
    }
  }, [fetchTenant, identifier]);

  return { tenant, loading, error, refetch: fetchTenant };
};

export const useTenantActions = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createTenant = async (tenantData: CreateTenantRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await superAdminAPI.createTenant(tenantData);
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Failed to create tenant');
        return null;
      }
    } catch (error) {
      const apiError = error as { message?: string };
      setError(apiError?.message || 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateTenant = async (tenantId: string, tenantData: UpdateTenantRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await superAdminAPI.updateTenant(tenantId, tenantData);
      if (response.success && response.data) {
        return true;
      } else {
        setError(response.error || 'Failed to update tenant');
        return false;
      }
    } catch (error) {
      const apiError = error as { message?: string };
      setError(apiError?.message || 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const patchTenant = async (tenantId: string, tenantData: Partial<UpdateTenantRequest>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await superAdminAPI.patchTenant(tenantId, tenantData);
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Failed to update tenant');
        return null;
      }
    } catch (error) {
      const apiError = error as { message?: string };
      setError(apiError?.message || 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const suspendTenant = async (tenantId: string, suspendData: SuspendTenantRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await superAdminAPI.suspendTenant(tenantId, suspendData);
      if (response.success) {
        return true;
      } else {
        setError(response.error || 'Failed to suspend tenant');
        return false;
      }
    } catch (error) {
      const apiError = error as { message?: string };
      setError(apiError?.message || 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reactivateTenant = async (tenantId: string, reactivateData: ReactivateTenantRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await superAdminAPI.reactivateTenant(tenantId, reactivateData);
      if (response.success) {
        return true;
      } else {
        setError(response.error || 'Failed to reactivate tenant');
        return false;
      }
    } catch (error) {
      const apiError = error as { message?: string };
      setError(apiError?.message || 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createImpersonationSession = async (tenantId: string, impersonateData: ImpersonateRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await superAdminAPI.createImpersonationSession(tenantId, impersonateData);
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Failed to create impersonation session');
        return null;
      }
    } catch (error) {
      const apiError = error as { message?: string };
      setError(apiError?.message || 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const exportTenantData = async (tenantId: string) => {
    setLoading(true);
    setError(null);
    try {
      const blob = await superAdminAPI.exportTenantData(tenantId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tenant-${tenantId}-export.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      const apiError = error as { message?: string };
      setError(apiError?.message || 'An error occurred');
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
    patchTenant,
    suspendTenant,
    reactivateTenant,
    createImpersonationSession,
    exportTenantData,
  };
};

export const useTenantStats = (tenantId: string) => {
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (id?: string) => {
    const currentTenantId = id || tenantId;
    if (!currentTenantId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await superAdminAPI.getTenantStats(currentTenantId);
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || 'Failed to fetch tenant stats');
      }
    } catch (error) {
      const apiError = error as { message?: string };
      setError(apiError?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      fetchStats();
    }
  }, [fetchStats, tenantId]);

  return { stats, loading, error, refetch: fetchStats };
};

export const useTenantUsers = (tenantId: string) => {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (params?: TenantUsersParams) => {
    if (!tenantId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await superAdminAPI.getTenantUsers(tenantId, params);
      if (response.success && response.data) {
        setUsers(response.data);
        setPagination(response.pagination || null);
      } else {
        setError(response.error || 'Failed to fetch tenant users');
      }
    } catch (error) {
      const apiError = error as { message?: string };
      setError(apiError?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      fetchUsers();
    }
  }, [fetchUsers, tenantId]);

  return { users, pagination, loading, error, refetch: fetchUsers };
};

export const useTenantQuotas = (tenantId: string) => {
  const [quotas, setQuotas] = useState<Quotas | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotas = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await superAdminAPI.getTenantQuotas(tenantId);
      if (response.success && response.data) {
        setQuotas(response.data.quotas);
      } else {
        setError(response.error || 'Failed to fetch tenant quotas');
      }
    } catch (error) {
      const apiError = error as { message?: string };
      setError(apiError?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const updateQuotas = async (quotasData: Partial<Quotas>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await superAdminAPI.updateTenantQuotas(tenantId, quotasData);
      if (response.success && response.data) {
        setQuotas(response.data.quotas);
        return true;
      } else {
        setError(response.error || 'Failed to update tenant quotas');
        return false;
      }
    } catch (error) {
      const apiError = error as { message?: string };
      setError(apiError?.message || 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchQuotas();
    }
  }, [fetchQuotas, tenantId]);

  return { quotas, loading, error, refetch: fetchQuotas, updateQuotas };
};
