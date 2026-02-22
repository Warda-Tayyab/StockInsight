// Utility to test API connection
import axiosInstance from '@/lib/axios';
import type { ApiError } from '@/types/super-admin';

export const testApiConnection = async () => {
  try {
    // Test basic connectivity to the API
    const response = await axiosInstance.get('/health-check');
    console.log('API Connection Test:', response.data);
    return { success: true, data: response.data };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('API Connection Failed:', apiError.response?.data || apiError.message);
    return { 
      success: false, 
      error: apiError.response?.data?.message || apiError.message,
      status: apiError.response?.status
    };
  }
};

// Test authentication endpoint
export const testAuthStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'No token found' };
    }

    // Test if the current token is valid
    const response = await axiosInstance.get('/super-admin/dashboard/stats');
    console.log('Auth Test Success:', response.data);
    return { success: true, data: response.data };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('Auth Test Failed:', apiError.response?.data || apiError.message);
    return { 
      success: false, 
      error: apiError.response?.data?.message || apiError.message,
      status: apiError.response?.status
    };
  }
};
