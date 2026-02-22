// Test file to directly test the tenants API
import axiosInstance from '@/lib/axios';
import type { ApiError } from '@/types/super-admin';

export const testTenantsAPI = async () => {
  try {
    console.log('Testing direct API call to tenants endpoint...');
    
    // Test the exact endpoint format
    const url = '/v1/super-admin/tenants?page=1&limit=10';
    console.log('Making request to:', url);
    
    const token = localStorage.getItem('token');
    console.log('Using token:', token ? 'Token exists' : 'No token found');
    
    const response = await axiosInstance.get(url);
    console.log('Test API Response Status:', response.status);
    console.log('Test API Response Data:', response.data);
    
    return response.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('Test API Error:', apiError);
    console.error('Test API Error Response:', apiError.response?.data);
    console.error('Test API Error Status:', apiError.response?.status);
    throw apiError;
  }
};

// Function to test from browser console
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).testTenantsAPI = testTenantsAPI;
}
