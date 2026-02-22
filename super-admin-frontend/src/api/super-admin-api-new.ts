import axiosInstance from '../lib/axios';
import type {
  DashboardStats,
  Tenant,
  CreateTenantRequest,
  UpdateTenantRequest,
  TenantListParams,
  TenantListResponse,
  TenantStats,
  TenantUsersParams,
  SuspendTenantRequest,
  ReactivateTenantRequest,
  ImpersonateRequest,
  ImpersonationSession,
  ApiResponse,
  ApiError,
  TenantUser,
  NestedTenantResponse,
} from '../types/super-admin';

class SuperAdminAPI {
  private readonly baseUrl = '/v1/super-admin';

  /**
   * Dashboard Statistics
   */
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/dashboard/stats`);
      return response.data as ApiResponse<DashboardStats>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error fetching dashboard stats:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to fetch dashboard statistics');
    }
  }

  /**
   * Tenant Management
   */
  
  // Get all tenants with pagination and filters
  async getTenants(params?: TenantListParams): Promise<TenantListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);

      const url = `${this.baseUrl}/tenants${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await axiosInstance.get(url);
      return response.data as TenantListResponse;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error fetching tenants:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to fetch tenants');
    }
  }

  // Create a new tenant
  async createTenant(tenantData: CreateTenantRequest): Promise<ApiResponse<Tenant>> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/tenants`, tenantData);
      return response.data as ApiResponse<Tenant>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error creating tenant:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to create tenant');
    }
  }

  // Get tenant by ID or subdomain
  async getTenant(identifier: string): Promise<ApiResponse<Tenant>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/tenants/${identifier}`);      
      const responseData = response.data as NestedTenantResponse;
      if (responseData.success && responseData.data && responseData.data.tenant) {
        const tenant = responseData.data.tenant;
        
        if (!tenant.quotas) {
          tenant.quotas = {
            seats: 50,
            storageGB: 10,
            ticketsPerMonth: 1000,
            apiRps: 100,
            retentionDays: 90,
            departments: 5,
            roles: 10,
            projects: 20,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
          };
        }
        
        return {
          success: true,
          data: tenant
        } as ApiResponse<Tenant>;
      }
      
      return response.data as ApiResponse<Tenant>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error fetching tenant:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to fetch tenant');
    }
  }

  // Full update tenant
  async updateTenant(tenantId: string, tenantData: UpdateTenantRequest): Promise<ApiResponse<Tenant>> {
    try {
      const response = await axiosInstance.put(`${this.baseUrl}/tenants/${tenantId}`, tenantData);
      console.log('Update tenant response:', response.data); // Debug log
      
      // Handle the nested structure where tenant data might be under data.tenant
      const responseData = response.data as NestedTenantResponse;
      if (responseData.success && responseData.data && responseData.data.tenant) {
        const tenant = responseData.data.tenant;
        
        // Ensure quotas exist with default values if not provided by API
        if (!tenant.quotas) {
          tenant.quotas = {
            seats: 50,
            storageGB: 10,
            ticketsPerMonth: 1000,
            apiRps: 100,
            retentionDays: 90,
            departments: 5,
            roles: 10,
            projects: 20,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
          };
        }
        
        return {
          success: true,
          data: tenant
        } as ApiResponse<Tenant>;
      }
      
      return response.data as ApiResponse<Tenant>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error updating tenant:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to update tenant');
    }
  }

  // Partial update tenant
  async patchTenant(tenantId: string, tenantData: Partial<UpdateTenantRequest>): Promise<ApiResponse<Tenant>> {
    try {
      const response = await axiosInstance.patch(`${this.baseUrl}/tenants/${tenantId}`, tenantData);
      return response.data as ApiResponse<Tenant>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error patching tenant:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to update tenant');
    }
  }

  // Suspend tenant
  async suspendTenant(tenantId: string, suspendData: SuspendTenantRequest): Promise<ApiResponse<string>> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/tenants/${tenantId}/suspend`, suspendData);
      return response.data as ApiResponse<string>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error suspending tenant:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to suspend tenant');
    }
  }

  // Reactivate tenant
  async reactivateTenant(tenantId: string, reactivateData: ReactivateTenantRequest): Promise<ApiResponse<string>> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/tenants/${tenantId}/reactivate`, reactivateData);
      return response.data as ApiResponse<string>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error reactivating tenant:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to reactivate tenant');
    }
  }

  // Get tenant statistics
  async getTenantStats(tenantId: string): Promise<ApiResponse<TenantStats>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/tenants/${tenantId}/stats`);
      return response.data as ApiResponse<TenantStats>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error fetching tenant stats:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to fetch tenant statistics');
    }
  }

  // Get tenant users
  async getTenantUsers(tenantId: string, params?: TenantUsersParams): Promise<ApiResponse<TenantUser[]>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.role) queryParams.append('role', params.role);
      if (params?.status) queryParams.append('status', params.status);

      const url = `${this.baseUrl}/tenants/${tenantId}/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await axiosInstance.get(url);
      return response.data as ApiResponse<TenantUser[]>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error fetching tenant users:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to fetch tenant users');
    }
  }

  // Create impersonation session
  async createImpersonationSession(tenantId: string, impersonateData: ImpersonateRequest): Promise<ApiResponse<ImpersonationSession>> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/tenants/${tenantId}/impersonate`, impersonateData);
      return response.data as ApiResponse<ImpersonationSession>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error creating impersonation session:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to create impersonation session');
    }
  }

  // Export tenant data
  async exportTenantData(tenantId: string): Promise<Blob> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/tenants/${tenantId}/export`, {
        responseType: 'blob',
      });
      return response.data as Blob;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error exporting tenant data:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to export tenant data');
    }
  }
}

// Export singleton instance
export const superAdminAPI = new SuperAdminAPI();
export default superAdminAPI;
