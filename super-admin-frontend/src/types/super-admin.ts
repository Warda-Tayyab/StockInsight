// Super Admin API Types

export interface DashboardStats {
  meta: {
    currency: string;
    timezone: string;
    generatedAt: string;
    period: {
      start: string;
      end: string;
    };
  };
  summary: {
    tenants: {
      total: number;
      active: number;
      suspended: number;
      delta: {
        vsLastMonthPct: string;
      };
    };
    users: {
      total: number;
      active: number;
      inactive: number;
      delta: {
        vsLastMonthPct: string;
      };
    };
    tickets: {
      total: number;
      open: number;
      resolved: number;
      critical: number;
    };
    revenue: {
      current: number;
      currency: string;
      delta: {
        vsLastMonthPct: string;
      };
    };
  };
  charts: {
    growthTrends: Array<{
      month: string;
      users: number;
      tickets: number;
    }>;
    planDistribution: Array<{
      plan: string;
      count: number;
    }>;
    monthlyRevenue: Array<{
      month: string;
      revenue: number;
    }>;
  };
  recentActivities: Array<{
    id: string;
    type: string;
    tenant: string | null;
    message: string;
    severity: 'high' | 'medium' | 'low';
    occurredAt: string;
  }>;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface PrimaryContact {
  name: string;
  email: string;
  phone: string;
  address: Address;
  timezone: string;
}

export interface Trial {
  days: number;
  startsAt: string;
  endsAt: string;
}

export interface PasswordPolicy {
  minLength?: number;
  requireUppercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  maxAge?: number;
}

export interface Security {
  mfaRequired: boolean;
  passwordPolicy: PasswordPolicy;
  ssoEnabled: boolean;
  auditEnabled: boolean;
  ipAllow?: string[];
  ipDeny?: string[];
}

export interface MailingConfig {
  type: 'smtp' | 'api';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    from: string;
  };
  api?: {
    service: 'sendgrid' | 'mailgun' | 'ses' | 'postmark';
    apiKey: string;
    from: string;
    domain?: string;
  };
}

export interface PaginationInfo {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive?: string;
  createdAt: string;
}

export interface Quotas {
  seats: number;
  storageGB: number;
  ticketsPerMonth: number;
  apiRps: number;
  retentionDays: number;
  departments: number;
  roles: number;
  projects: number;
  expiryDate: string;
}

export interface TenantSettings {
  [key: string]: string | number | boolean | null | undefined;
}

export interface Site {
  id: string;
  name: string;
}

export interface Organization {
  siteMode: 'single' | 'multi';
  sites: Site[];
  brandMode: 'single' | 'multi';
}

export interface Channels {
  allowed: string[];
  inboundEmails: string[];
  portalEnabled: boolean;
}

export interface Escalation {
  level: number;
  contact: string;
  method: string;
}

export interface Support {
  level: string;
  escalations: Escalation[];
}

export interface Tenant {
  _id: string;
  tenantId: string;
  companyName?: string;
  slug?: string;
  status: 'trial' | 'active' | 'suspended' | 'inactive';
  region?: string;
  isolationMode?: 'shared' | 'dedicated';
  primaryContact?: PrimaryContact;
  trial?: Trial;
  security?: Security;
  mailing?: MailingConfig;
  verticalId?: string;
  subTypeId?: string;
  verticals?: string[];
  useCases?: string[];
  features?: string[];
  modules?: string[];
  quotas?: Quotas;
  settings?: TenantSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTenantRequest {
  companyName: string;
  slug: string;
  primaryContact: PrimaryContact;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  status?: 'trial' | 'active' | 'suspended' | 'inactive';
  region: string;
  isolationMode?: 'shared' | 'dedicated';
  trial?: {
    days: number;
    startsAt: string;
  };
  security: Security;
  verticals: string[];
  useCases: string[];
  org: Organization;
  channels: Channels;
  features: string[];
  modules: string[];
  quotas: Quotas;
  support?: Support;
  settings?: TenantSettings;
}

export interface UpdateTenantRequest {
  companyName?: string;
  slug?: string;
  status?: 'trial' | 'active' | 'suspended' | 'inactive';
  region?: string;
  isolationMode?: 'shared' | 'dedicated';
  primaryContact?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    };
    timezone?: string;
  };
  trial?: {
    days?: number;
    startsAt?: string;
    endsAt?: string;
  };
  security?: {
    mfaRequired?: boolean;
    passwordPolicy?: {
      minLength?: number;
      requireUppercase?: boolean;
      requireNumbers?: boolean;
      requireSpecialChars?: boolean;
      maxAge?: number;
    };
    ssoEnabled?: boolean;
    auditEnabled?: boolean;
    ipAllow?: string[];
    ipDeny?: string[];
  };
  verticals?: string[];
  useCases?: string[];
  features?: string[];
  modules?: string[];
  quotas?: {
    seats?: number;
    storageGB?: number;
    ticketsPerMonth?: number;
    apiRps?: number;
    retentionDays?: number;
  };
  settings?: TenantSettings;
}

export interface TenantListParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'suspended' | 'inactive';
  search?: string;
  dateRange?: { from: string | undefined; to: string | undefined} | undefined;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TenantListResponse {
  success: boolean;
  data: Tenant[];
  pagination: Pagination;
}

export interface TenantStats {
  userCount: number;
  activeUsers: number;
  departmentCount: number;
  integrationCount: number;
  lastActivity: string;
}

export interface TenantUsersParams {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
}

export interface SuspendTenantRequest {
  reason: string;
  notifyUsers: boolean;
}

export interface ReactivateTenantRequest {
  notifyUsers: boolean;
}

export interface ImpersonateRequest {
  userId: string;
  duration: number; // in minutes
}

export interface ImpersonationSession {
  token: string;
  expiresAt: string;
  targetUserId: string;
  tenantId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationInfo;
}

// Auth related types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  admin: {
    id: string;
    email: string;
    fullName: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// Complete login API response
export interface LoginApiResponse {
  success: boolean;
  data: LoginResponse;
  message?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

// For login response admin data
export interface AdminData {
  id: string;
  email?: string;
  emailAddress?: string;
  fullName?: string;
  name?: string;
  role?: string;
}

// API Error types
export interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

// User related types
export interface TenantUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Nested API response types
export interface NestedTenantResponse {
  success: boolean;
  data: {
    tenant: Tenant;
  };
  message?: string;
}

export interface NestedTenantsListResponse {
  tenants?: Tenant[];
  items?: Tenant[];
}

export interface Status {
  _id: string;
  tenantId: string;
  name: string;
  color: string;
  allowedTransitions: string[];
  order: number;
  isDefault?: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}
