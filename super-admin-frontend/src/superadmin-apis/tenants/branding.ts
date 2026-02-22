// Types for Branding API
export interface BrandingItem {
  _id: string;
  tenantId: string;
  customColors: boolean;
  colors: string;
  tagline: string;
  description: string;
  url: string;
  featureHighlights: string[];
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
  id: string;
}

export interface BrandingListResponse {
  success: boolean;
  data: {
    branding: BrandingItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message: string;
}

export interface CreateUpdateBrandingRequest {
  tenantId: string;
  customColors: boolean;
  colors: string;
  tagline: string;
  description: string;
  featureHighlights: string[];
  image?: File;
}

export interface BrandingApiResponse {
  success: boolean;
  data?: BrandingItem;
  message: string;
}

/**
 * Branding API for tenant branding operations
 */
class BrandingAPI {
  /**
   * Get all branding for a tenant
   */
  async getBrandingList(tenantId: string, page: number = 1, limit: number = 10): Promise<BrandingListResponse> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/v1/branding/all?tenantId=${tenantId}&page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch branding list');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching branding list:', error);
      throw error;
    }
  }

  /**
   * Create or update branding (0 for create, 1 for update)
   */
  async createOrUpdateBranding(
    data: CreateUpdateBrandingRequest, 
    id: string = "0"
  ): Promise<BrandingApiResponse> {
    try {
      const formData = new FormData();
      
      // Append form data
      formData.append('tenantId', data.tenantId);
      formData.append('customColors', data.customColors.toString());
      formData.append('colors', data.colors);
      formData.append('tagline', data.tagline);
      formData.append('description', data.description);
      formData.append('featureHighlights', JSON.stringify(data.featureHighlights));
      
      // Append image if provided
      if (data.image) {
        formData.append('image', data.image);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/v1/branding/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to ${id === "0" ? 'create' : 'update'} branding`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error ${id === "0" ? 'creating' : 'updating'} branding:`, error);
      throw error;
    }
  }

  /**
   * Delete branding by ID
   */
  async deleteBranding(brandingId: string, tenantId?: string): Promise<BrandingApiResponse> {
    try {
      const base = `${process.env.NEXT_PUBLIC_API_URL || ''}/v1/branding/${brandingId}`;
      const url = tenantId ? `${base}?tenantId=${tenantId}` : base;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete branding');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting branding:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const brandingAPI = new BrandingAPI();
