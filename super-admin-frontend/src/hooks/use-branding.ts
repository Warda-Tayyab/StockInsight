import { useState, useEffect } from 'react';
import { brandingAPI, type BrandingItem, type CreateUpdateBrandingRequest } from '@/superadmin-apis/tenants/branding';

export function useBranding(tenantId: string) {
  const [brandingList, setBrandingList] = useState<BrandingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchBranding = async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response = await brandingAPI.getBrandingList(tenantId, page, limit);
      
      if (response.success) {
        setBrandingList(response.data.branding);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to fetch branding data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch branding');
      setBrandingList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchBranding();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const refetch = () => {
    fetchBranding(pagination.page, pagination.limit);
  };

  return {
    brandingList,
    loading,
    error,
    pagination,
    refetch,
    fetchBranding
  };
}

export function useBrandingActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBranding = async (data: CreateUpdateBrandingRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await brandingAPI.createOrUpdateBranding(data, "0");
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create branding');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create branding';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateBranding = async (data: CreateUpdateBrandingRequest, brandingId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await brandingAPI.createOrUpdateBranding(data, brandingId);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update branding');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update branding';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteBranding = async (brandingId: string, tenantId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await brandingAPI.deleteBranding(brandingId, tenantId);
      
      if (response.success) {
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete branding');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete branding';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createBranding,
    updateBranding,
    deleteBranding,
    loading,
    error
  };
}
