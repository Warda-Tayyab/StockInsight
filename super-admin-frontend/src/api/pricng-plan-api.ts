import axiosInstance from "@/lib/axios";
import { CreatePlan, Plan } from "@/types/pricing-plan";
import { ApiResponse, ApiError } from "@/types/super-admin";

class PlanAPI {
    private readonly baseUrl = '/v1/super-admin';

    // getPlans
    async getPlans(): Promise<ApiResponse<{ plans: Plan[] }>> {
        try {
            const response = await axiosInstance.get(`${this.baseUrl}/plans`);
            return response.data as ApiResponse<{ plans: Plan[] }>
        } catch (error: unknown) {
            const apiError = error as ApiError;
            console.error("Error fetching plans:", apiError)
            throw new Error(apiError.response?.data?.message || "Failed to fetch plans")
        }
    }

    // Create a new plan
    async createPlan(planData: CreatePlan): Promise<ApiResponse<Plan>> {
        try {
            const response = await axiosInstance.post(`${this.baseUrl}/plans`, planData);
            return response.data as ApiResponse<Plan>;
        } catch (error: unknown) {
            const apiError = error as ApiError;
            console.error('Error creating plan:', apiError);
            if (apiError.response?.status === 401 || apiError.response?.status === 403) {
                throw new Error('Authentication required');
            }
            throw new Error(apiError.response?.data?.message || 'Failed to create plan');
        }
    }

    // Update a plan by ID
    async updatePlan(planId: string, planData: Partial<CreatePlan>): Promise<ApiResponse<Plan>> {
        try {
            const response = await axiosInstance.put(`${this.baseUrl}/plans/${planId}`, planData);
            return response.data as ApiResponse<Plan>;
        } catch (error: unknown) {
            const apiError = error as ApiError;
            console.error('Error updating plan:', apiError);
            if (apiError.response?.status === 401 || apiError.response?.status === 403) {
                throw new Error('Authentication required');
            }
            throw new Error(apiError.response?.data?.message || 'Failed to update plan');
        }
    }

    // Delete a plan by ID
    async deletePlan(planId: string): Promise<ApiResponse<null>> {
        try {
            const response = await axiosInstance.delete(`${this.baseUrl}/plans/${planId}`);
            return response.data as ApiResponse<null>;
        } catch (error: unknown) {
            const apiError = error as ApiError;
            console.error('Error deleting plan:', apiError);
            if (apiError.response?.status === 401 || apiError.response?.status === 403) {
                throw new Error('Authentication required');
            }
            throw new Error(apiError.response?.data?.message || 'Failed to delete plan');
        }
    }

    // Get a plan by ID
    async getPlanById(planId: string): Promise<ApiResponse<Plan>> {
        try {
            const response = await axiosInstance.get(`${this.baseUrl}/plans/${planId}`);
            return response.data as ApiResponse<Plan>;
        } catch (error: unknown) {
            const apiError = error as ApiError;
            console.error('Error fetching plan:', apiError);
            throw new Error(apiError.response?.data?.message || 'Failed to fetch plan');
        }
    }

}

export const planAPI = new PlanAPI();
export default planAPI;
