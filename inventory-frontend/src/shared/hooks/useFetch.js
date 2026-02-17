/** @module shared/hooks/useFetch */

import { useState, useEffect, useCallback } from 'react';

const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    // Placeholder: actual fetch logic
    setLoading(false);
  }, [url]);

  useEffect(() => {
    refetch();
  }, [url, refetch]);

  return { data, loading, error, refetch };
};

export default useFetch;
