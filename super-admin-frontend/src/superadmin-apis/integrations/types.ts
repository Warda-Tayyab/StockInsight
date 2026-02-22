export interface MasterIntegration {
  _id?: string;
  name: 'slack' | 'teams' | 'email' | 'jira' | 'gcal' | 'saml' | 'oidc';
  displayName: string;
  description?: string;
  category: 'communication' | 'project_management' | 'calendar' | 'authentication';
  configSchema?: Record<string, unknown>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateIntegrationRequest {
  name: MasterIntegration['name'];
  displayName: string;
  description?: string;
  category: MasterIntegration['category'];
  configSchema?: Record<string, unknown>;
}

export interface UpdateIntegrationRequest {
  displayName?: string;
  description?: string;
  category?: MasterIntegration['category'];
  isActive?: boolean;
}

export interface TenantIntegration {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
}

export interface IntegrationConfig {
  _id?: string;
  tenantId: string;
  integrationId: string | MasterIntegration;
  data: Record<string, unknown>;
  updatedByUserId?: string;
  createdAt?: string;
  updatedAt?: string;
  integrationId_populated?: MasterIntegration;
}

export interface CreateIntegrationConfigRequest {
  integrationId: string;
  config: Record<string, unknown>;
}

export interface UpdateIntegrationConfigRequest {
  config: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
  error?: string;
}
