import axiosInstance from "@/lib/axios";
import type {
  MasterIntegration,
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
  TenantIntegration,
  IntegrationConfig,
  CreateIntegrationConfigRequest,
  UpdateIntegrationConfigRequest,
  ApiResponse
} from "./types";

interface ApiError {
  response?: {
    status: number;
    data?: {
      message?: string;
    };
  };
}

class IntegrationsAPI {
  private readonly baseUrl = '/v1/integrations';

  /**
   * Get all master integrations
   */
  async getMasterIntegrations(): Promise<ApiResponse<MasterIntegration[]>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/master`);
      return response.data as ApiResponse<MasterIntegration[]>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error fetching master integrations:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to fetch master integrations');
    }
  }

  /**
   * Create a new master integration
   */
  async createMasterIntegration(integrationData: CreateIntegrationRequest): Promise<ApiResponse<MasterIntegration>> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/master`, integrationData);
      return response.data as ApiResponse<MasterIntegration>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error creating master integration:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to create master integration');
    }
  }

  /**
   * Update a master integration
   */
  async updateMasterIntegration(id: string, integrationData: UpdateIntegrationRequest): Promise<ApiResponse<MasterIntegration>> {
    try {
      const response = await axiosInstance.put(`${this.baseUrl}/master/${id}`, integrationData);
      return response.data as ApiResponse<MasterIntegration>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error updating master integration:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to update master integration');
    }
  }

  /**
   * Delete a master integration
   */
  async deleteMasterIntegration(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await axiosInstance.delete(`${this.baseUrl}/master/${id}`);
      return response.data as ApiResponse<void>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error deleting master integration:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to delete master integration');
    }
  }

  // ===== TENANT INTEGRATIONS =====

  /**
   * Get tenant's enabled integrations
   */
  async getTenantIntegrations(tenantId: string): Promise<ApiResponse<TenantIntegration[]>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/tenant/${tenantId}`);
      return response.data as ApiResponse<TenantIntegration[]>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error fetching tenant integrations:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to fetch tenant integrations');
    }
  }

  /**
   * Add/Update tenant integrations list
   */
  async updateTenantIntegrations(tenantId: string, integrations: string[]): Promise<ApiResponse<TenantIntegration[]>> {
    try {
      const response = await axiosInstance.put(`${this.baseUrl}/tenant/${tenantId}`, { integrations });
      return response.data as ApiResponse<TenantIntegration[]>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error updating tenant integrations:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to update tenant integrations');
    }
  }

  /**
   * Remove integration from tenant
   */
  async removeTenantIntegration(tenantId: string, integrationId: string): Promise<ApiResponse<TenantIntegration[]>> {
    try {
      const response = await axiosInstance.delete(`${this.baseUrl}/tenant/${tenantId}/${integrationId}`);
      return response.data as ApiResponse<TenantIntegration[]>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error removing tenant integration:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to remove tenant integration');
    }
  }

  // ===== INTEGRATION CONFIGS =====

  /**
   * Get all integration configs for a tenant
   */
  async getIntegrationConfigs(tenantId: string): Promise<ApiResponse<IntegrationConfig[]>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/config/${tenantId}`);
      return response.data as ApiResponse<IntegrationConfig[]>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error fetching integration configs:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to fetch integration configs');
    }
  }

  /**
   * Create integration config
   */
  async createIntegrationConfig(tenantId: string, configData: CreateIntegrationConfigRequest): Promise<ApiResponse<IntegrationConfig>> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/config/${tenantId}`, configData);
      return response.data as ApiResponse<IntegrationConfig>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error creating integration config:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to create integration config');
    }
  }

  /**
   * Update integration config
   */
  async updateIntegrationConfig(tenantId: string, configId: string, configData: UpdateIntegrationConfigRequest): Promise<ApiResponse<IntegrationConfig>> {
    try {
      const response = await axiosInstance.put(`${this.baseUrl}/config/${tenantId}/${configId}`, configData);
      return response.data as ApiResponse<IntegrationConfig>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error updating integration config:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to update integration config');
    }
  }

  /**
   * Delete integration config
   */
  async deleteIntegrationConfig(tenantId: string, configId: string): Promise<ApiResponse<void>> {
    try {
      const response = await axiosInstance.delete(`${this.baseUrl}/config/${tenantId}/${configId}`);
      return response.data as ApiResponse<void>;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error deleting integration config:', apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new Error('Authentication required');
      }
      throw new Error(apiError.response?.data?.message || 'Failed to delete integration config');
    }
  }
}

export const integrationsAPI = new IntegrationsAPI();
