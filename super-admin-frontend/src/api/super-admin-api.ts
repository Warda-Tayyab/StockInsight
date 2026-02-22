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
  Quotas,
  Security,
  MailingConfig,
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
            departments: 10,
            roles: 20,
            projects: 50,
            expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
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
            departments: 10,
            roles: 20,
            projects: 50,
            expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
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

  /**
   * Security Management
   */

  // Get security settings for a tenant
  async getTenantSecurity(tenantId: string): Promise<ApiResponse<{ security: Security }>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/tenants/${tenantId}/security`);
      return response.data as ApiResponse<{ security: Security }>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error fetching tenant security:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to fetch tenant security settings');
    }
  }

  // Update security settings for a tenant (full update)
  async updateTenantSecurity(tenantId: string, securityData: Partial<Security>): Promise<ApiResponse<{ security: Security }>> {
    try {
      const response = await axiosInstance.put(`${this.baseUrl}/tenants/${tenantId}/security`, securityData);
      return response.data as ApiResponse<{ security: Security }>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error updating tenant security:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to update tenant security settings');
    }
  }

  // Reset security settings to defaults
  async resetTenantSecurity(tenantId: string): Promise<ApiResponse<{ security: Security }>> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/tenants/${tenantId}/security/reset`);
      return response.data as ApiResponse<{ security: Security }>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error resetting tenant security:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to reset tenant security settings');
    }
  }

  /**
   * Quota Management
   */

  // Get quotas for a tenant
  async getTenantQuotas(tenantId: string): Promise<ApiResponse<{ quotas: Quotas }>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/tenants/${tenantId}/quotas`);
      return response.data as ApiResponse<{ quotas: Quotas }>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error fetching tenant quotas:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to fetch tenant quotas');
    }
  }

  // Update quotas for a tenant
  async updateTenantQuotas(tenantId: string, quotasData: Partial<Quotas>): Promise<ApiResponse<{ quotas: Quotas }>> {
    try {
      const response = await axiosInstance.put(`${this.baseUrl}/tenants/${tenantId}/quotas`, quotasData);
      return response.data as ApiResponse<{ quotas: Quotas }>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error updating tenant quotas:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to update tenant quotas');
    }
  }

  /**
   * Mailing Configuration Management
   */

  // Get mailing configuration for a tenant
  async getTenantMailing(tenantId: string): Promise<ApiResponse<MailingConfig>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/tenants/${tenantId}/mailing`);
      return response.data as ApiResponse<MailingConfig>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      if (apiError.response?.status === 404) {
        // Mailing config doesn't exist, return failed response
        return {
          success: false,
          message: 'Mailing configuration not found'
        };
      }
      console.error('Error fetching tenant mailing config:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to fetch tenant mailing configuration');
    }
  }

  // Create mailing configuration for a tenant
  async createTenantMailing(tenantId: string, mailingData: MailingConfig): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/tenants/${tenantId}/mailing`, mailingData);
      return response.data as ApiResponse<{ message: string }>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error creating tenant mailing config:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to create tenant mailing configuration');
    }
  }

  // Update mailing configuration for a tenant
  async updateTenantMailing(tenantId: string, mailingData: MailingConfig): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await axiosInstance.put(`${this.baseUrl}/tenants/${tenantId}/mailing`, mailingData);
      return response.data as ApiResponse<{ message: string }>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error updating tenant mailing config:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to update tenant mailing configuration');
    }
  }

  // Delete mailing configuration for a tenant
  async deleteTenantMailing(tenantId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await axiosInstance.delete(`${this.baseUrl}/tenants/${tenantId}/mailing`);
      return response.data as ApiResponse<{ message: string }>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error deleting tenant mailing config:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to delete tenant mailing configuration');
    }
  }

  // Reset tenant password
  async resetTenantPassword(tenantId: string): Promise<ApiResponse<{ password: string; email: string }>> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/tenants/${tenantId}/reset-password`);
      return response.data as ApiResponse<{ password: string; email: string }>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      throw new Error(apiError.response?.data?.message || 'Failed to reset password');
    }
  }
}

// Export singleton instance
export const superAdminAPI = new SuperAdminAPI();
export default superAdminAPI;
