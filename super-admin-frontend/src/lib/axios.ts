
import axios from 'axios';
import type { ApiError } from '../types/super-admin';

const API_URL = process.env.NEXT_PUBLIC_API_URL || ' http://localhost:4000';

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Ensure headers object exists
    config.headers = config.headers || {};
    
    // Only add token in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    // Only set Content-Type for non-FormData
    if (config.data && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper for unauthenticated handling
function handleUnauthenticated() {
  // Only handle in browser environment
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    // Only redirect if we're not already on the login page
    if (currentPath !== '/login') {
      localStorage.removeItem('token');
      // Use a more reliable way to redirect
      window.location.replace('/login');
    }
  }
}

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: unknown) => {
    const axiosError = error as ApiError;
    // Handle authentication errors
    if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
      handleUnauthenticated();
    }
    
    // GraphQL error handling with type guard
    const data = axiosError.response?.data as { errors?: Array<{ code?: string }> };
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const graphqlError = data.errors[0];
      if (graphqlError.code === 'UNAUTHENTICATED') {
        handleUnauthenticated();
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
