// Re-export types from the main types file for consistent API interface
export type {
  Tenant,
  CreateTenantRequest,
  UpdateTenantRequest,
  TenantListParams,
  TenantListResponse,
  Address,
  PrimaryContact,
  Trial,
  Security,
  Quotas,
  MailingConfig,
  Organization,
  Channels,
  Status,
  ApiResponse
} from '@/types/super-admin';

import type { CreateTenantRequest } from '@/types/super-admin';

// Additional types specific to tenant API operations
export interface SubdomainAvailabilityResponse {
  available: boolean;
  message?: string;
}

export interface CreateTenantPayload extends CreateTenantRequest {
  // This interface extends CreateTenantRequest to include additional API-specific properties
  // Currently no additional properties are needed, but this interface is kept for future extensibility
  [key: string]: unknown;
}
