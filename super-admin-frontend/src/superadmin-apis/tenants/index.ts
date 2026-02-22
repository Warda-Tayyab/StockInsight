import { superAdminAPI } from '@/api/super-admin-api';
import type {
  CreateTenantRequest,
  Tenant,
  ApiResponse,
  SubdomainAvailabilityResponse,
  TenantListParams,
  TenantListResponse,
  Security,
  Quotas,
  MailingConfig
} from './types';

/**
 * Tenant API facade - wraps the super admin API for tenant operations
 * This is a thin layer over the existing SuperAdminAPI class
 */
class TenantAPI {
  /**
   * Create a new tenant
   */
  async createTenant(payload: CreateTenantRequest): Promise<ApiResponse<Tenant>> {
    return superAdminAPI.createTenant(payload);
  }

  /**
   * Get tenant by ID or subdomain
   */
  async getTenant(idOrSlug: string): Promise<ApiResponse<Tenant>> {
    return superAdminAPI.getTenant(idOrSlug);
  }

  /**
   * Get all tenants with pagination and filters
   */
  async getTenants(params?: TenantListParams): Promise<TenantListResponse> {
    return superAdminAPI.getTenants(params);
  }

  /**
   * Check subdomain availability
   * First tries to find existing tenant with the subdomain, then determines availability
   */
  async checkSubdomainAvailability(subdomain: string): Promise<SubdomainAvailabilityResponse> {
    try {
      // Try to search for tenants with this subdomain
      const response = await superAdminAPI.getTenants({
        search: `subdomain:${subdomain}`,
        limit: 1
      });

      // If we get results, subdomain is taken
      if (response.success && response.data && response.data.length > 0) {
        return {
          available: false,
          message: 'Subdomain is already taken'
        };
      }

      // If no results, subdomain is available
      return {
        available: true,
        message: 'Subdomain is available'
      };
    } catch (error) {
      console.warn('Error checking subdomain availability:', error);
      // On error, gracefully assume available (as per requirements)
      // TODO: Implement dedicated endpoint when available
      return {
        available: true,
        message: 'Unable to verify availability - assuming available'
      };
    }
  }

  /**
   * Get security settings for a tenant
   */
  async getTenantSecurity(tenantId: string): Promise<ApiResponse<{ security: Security }>> {
    return superAdminAPI.getTenantSecurity(tenantId);
  }

  /**
   * Update security settings for a tenant (full update)
   */
  async updateTenantSecurity(tenantId: string, securityData: Partial<Security>): Promise<ApiResponse<{ security: Security }>> {
    return superAdminAPI.updateTenantSecurity(tenantId, securityData);
  }

  /**
   * Reset security settings to defaults
   */
  async resetTenantSecurity(tenantId: string): Promise<ApiResponse<{ security: Security }>> {
    return superAdminAPI.resetTenantSecurity(tenantId);
  }

  /**
   * Get quotas for a tenant
   */
  async getTenantQuotas(tenantId: string): Promise<ApiResponse<{ quotas: Quotas }>> {
    return superAdminAPI.getTenantQuotas(tenantId);
  }

  /**
   * Update quotas for a tenant
   */
  async updateTenantQuotas(tenantId: string, quotasData: Partial<Quotas>): Promise<ApiResponse<{ quotas: Quotas }>> {
    return superAdminAPI.updateTenantQuotas(tenantId, quotasData);
  }

  /**
   * Get mailing configuration for a tenant
   */
  async getTenantMailing(tenantId: string): Promise<ApiResponse<MailingConfig>> {
    return superAdminAPI.getTenantMailing(tenantId);
  }

  /**
   * Create mailing configuration for a tenant
   */
  async createTenantMailing(tenantId: string, mailingData: MailingConfig): Promise<ApiResponse<{ message: string }>> {
    return superAdminAPI.createTenantMailing(tenantId, mailingData);
  }

  /**
   * Update mailing configuration for a tenant
   */
  async updateTenantMailing(tenantId: string, mailingData: MailingConfig): Promise<ApiResponse<{ message: string }>> {
    return superAdminAPI.updateTenantMailing(tenantId, mailingData);
  }

  /**
   * Delete mailing configuration for a tenant
   */
  async deleteTenantMailing(tenantId: string): Promise<ApiResponse<{ message: string }>> {
    return superAdminAPI.deleteTenantMailing(tenantId);
  }
}

// Export singleton instance
export const tenantAPI = new TenantAPI();

// Export functions for convenience
export const createTenant = (payload: CreateTenantRequest) => tenantAPI.createTenant(payload);
export const getTenant = (idOrSlug: string) => tenantAPI.getTenant(idOrSlug);
export const getTenants = (params?: TenantListParams) => tenantAPI.getTenants(params);
export const checkSubdomainAvailability = (subdomain: string) => tenantAPI.checkSubdomainAvailability(subdomain);
export const getTenantSecurity = (tenantId: string) => tenantAPI.getTenantSecurity(tenantId);
export const updateTenantSecurity = (tenantId: string, securityData: Partial<Security>) => tenantAPI.updateTenantSecurity(tenantId, securityData);
export const resetTenantSecurity = (tenantId: string) => tenantAPI.resetTenantSecurity(tenantId);
export const getTenantQuotas = (tenantId: string) => tenantAPI.getTenantQuotas(tenantId);
export const updateTenantQuotas = (tenantId: string, quotasData: Partial<Quotas>) => tenantAPI.updateTenantQuotas(tenantId, quotasData);
export const getTenantMailing = (tenantId: string) => tenantAPI.getTenantMailing(tenantId);
export const createTenantMailing = (tenantId: string, mailingData: MailingConfig) => tenantAPI.createTenantMailing(tenantId, mailingData);
export const updateTenantMailing = (tenantId: string, mailingData: MailingConfig) => tenantAPI.updateTenantMailing(tenantId, mailingData);
export const deleteTenantMailing = (tenantId: string) => tenantAPI.deleteTenantMailing(tenantId);

// Export inbound emails functions
export * from './inboundEmails';
