// Types for Status API
export interface StatusItem {
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

export interface StatusListResponse {
  success: boolean;
  data: StatusItem[];
}

export interface StatusApiResponse {
  success: boolean;
  data?: StatusItem;
  message?: string;
}

export interface CreateUpdateStatusRequest {
  tenantId: string;
  name: string;
  color?: string;
  allowedTransitions?: string[];
  order?: number;
  isDefault?: boolean;
}

/**
 * Status API for tenant status operations
 */
class StatusAPI {
  /**
   * Get all statuses for a tenant
   */
  async getStatusList(tenantId: string): Promise<StatusListResponse> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/v1/statuses?tenantId=${tenantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch status list');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching status list:', error);
      throw error;
    }
  }

  /**
   * Get a specific status by ID
   */
  async getStatus(statusId: string, tenantId: string): Promise<StatusApiResponse> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/v1/statuses/${statusId}?tenantId=${tenantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching status:', error);
      throw error;
    }
  }

  /**
   * Create a new status
   */
  async createStatus(data: CreateUpdateStatusRequest): Promise<StatusApiResponse> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/v1/statuses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating status:', error);
      throw error;
    }
  }

  /**
   * Update a status
   */
  async updateStatus(statusId: string, data: Partial<CreateUpdateStatusRequest>): Promise<StatusApiResponse> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/v1/statuses/${statusId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  }

  /**
   * Delete a status
   */
  async deleteStatus(statusId: string, tenantId: string): Promise<StatusApiResponse> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/v1/statuses/${statusId}?tenantId=${tenantId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting status:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const statusAPI = new StatusAPI();