import axiosInstance from '@/lib/axios';

export interface InboundEmailsResponse {
  success: boolean;
  data: {
    tenantId: string;
    companyName: string;
    inboundEmails: string[];
  };
}

export interface AddEmailResponse {
  success: boolean;
  message: string;
  data: {
    inboundEmails: string[];
    added?: string[];
  };
}

export interface DeleteEmailResponse {
  success: boolean;
  message: string;
  data?: {
    removedEmail?: string;
    inboundEmails?: string[];
    deletedCount?: number;
  };
}

/**
 * Get tenant inbound emails
 */
export const getTenantInboundEmails = async (tenantId: string): Promise<InboundEmailsResponse> => {
  const response = await axiosInstance.get(`/v1/super-admin/tenants/${tenantId}/inbound-emails`);
  return response.data as InboundEmailsResponse;
};

/**
 * Add inbound email(s) to tenant
 */
export const addTenantInboundEmail = async (
  tenantId: string,
  emails: string | string[]
): Promise<AddEmailResponse> => {
  const response = await axiosInstance.post(`/v1/super-admin/tenants/${tenantId}/inbound-emails`, {
    emails
  });
  return response.data as AddEmailResponse;
};

/**
 * Update all inbound emails (replace)
 */
export const updateTenantInboundEmails = async (
  tenantId: string,
  emails: string[]
): Promise<AddEmailResponse> => {
  const response = await axiosInstance.put(`/v1/super-admin/tenants/${tenantId}/inbound-emails`, {
    emails
  });
  return response.data as AddEmailResponse;
};

/**
 * Delete specific inbound email
 */
export const deleteTenantInboundEmail = async (
  tenantId: string,
  email: string
): Promise<DeleteEmailResponse> => {
  const response = await axiosInstance.delete(
    `/v1/super-admin/tenants/${tenantId}/inbound-emails/${encodeURIComponent(email)}`
  );
  return response.data as DeleteEmailResponse;
};

/**
 * Delete all inbound emails
 */
export const deleteAllTenantInboundEmails = async (
  tenantId: string
): Promise<DeleteEmailResponse> => {
  const response = await axiosInstance.delete(`/v1/super-admin/tenants/${tenantId}/inbound-emails`);
  return response.data as DeleteEmailResponse;
};
