import { useState, useEffect } from 'react';

export function useStatus(tenantId) {
  const [statusList, setStatusList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    const t = setTimeout(() => {
      setStatusList([]);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [tenantId]);

  const refetch = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 200);
  };

  return { statusList, loading, error, refetch, fetchStatus: refetch };
}

export function useStatusActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const withLoading = async (fn) => {
    setLoading(true);
    try {
      return await fn();
    } finally {
      setLoading(false);
    }
  };

  return {
    createStatus: (data) => withLoading(async () => ({ ...data, _id: '1' })),
    updateStatus: (id, data) => withLoading(async () => ({ ...data, _id: id })),
    deleteStatus: () => withLoading(async () => true),
    loading,
    error
  };
}
