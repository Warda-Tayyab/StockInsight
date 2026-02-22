import { useState, useEffect } from 'react';
import { statusAPI, type StatusItem, type CreateUpdateStatusRequest } from '@/superadmin-apis/tenants/status';

export function useStatus(tenantId: string) {
  const [statusList, setStatusList] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await statusAPI.getStatusList(tenantId);

      if (response.success) {
        setStatusList(response.data);
      } else {
        setError('Failed to fetch status data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statuses');
      setStatusList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const refetch = () => {
    fetchStatus();
  };

  return {
    statusList,
    loading,
    error,
    refetch,
    fetchStatus
  };
}

export function useStatusActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStatus = async (data: CreateUpdateStatusRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await statusAPI.createStatus(data);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (statusId: string, data: Partial<CreateUpdateStatusRequest>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await statusAPI.updateStatus(statusId, data);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteStatus = async (statusId: string, tenantId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await statusAPI.deleteStatus(statusId, tenantId);

      if (response.success) {
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createStatus,
    updateStatus,
    deleteStatus,
    loading,
    error
  };
}