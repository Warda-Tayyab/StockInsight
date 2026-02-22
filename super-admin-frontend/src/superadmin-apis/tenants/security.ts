import { superAdminAPI } from '@/api/super-admin-api';
import type { ApiResponse, Security } from './types';

/**
 * Security API facade - wraps the super admin API for tenant security operations
 */
class SecurityAPI {
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
}

// Export singleton instance
export const securityAPI = new SecurityAPI();

// Export functions for convenience
export const updateTenantSecurity = (tenantId: string, securityData: Partial<Security>) => securityAPI.updateTenantSecurity(tenantId, securityData);
export const resetTenantSecurity = (tenantId: string) => securityAPI.resetTenantSecurity(tenantId);
