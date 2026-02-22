import { useState, useEffect } from 'react';

export function useBranding(tenantId) {
  const [brandingList, setBrandingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    const t = setTimeout(() => {
      setBrandingList([]);
      setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [tenantId]);

  const refetch = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 200);
  };

  return { brandingList, loading, error, pagination, refetch, fetchBranding: refetch };
}

export function useBrandingActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const withLoading = async (fn) => {
    setLoading(true);
    try {
      const result = await fn();
      return result;
    } finally {
      setLoading(false);
    }
  };

  return {
    createBranding: (data) => withLoading(async () => ({ ...data, _id: '1' })),
    updateBranding: (data, id) => withLoading(async () => ({ ...data, _id: id })),
    deleteBranding: () => withLoading(async () => true),
    loading,
    error
  };
}
