import { apiClient } from './api';
import {
  Claim,
  ClaimDocument,
  AgentExecution,
  Decision,
  AnalyticsStats,
  DemoPreset,
  ApiResponse,
} from '../types';

export const claimService = {
  async getClaims(params?: { status?: string; search?: string; page?: number; limit?: number }) {
    const res = await apiClient.get<
      ApiResponse<{ claims: Claim[]; total: number; page: number; totalPages: number }>
    >('/claims', { params });
    return res.data.data;
  },

  async getClaimById(id: string) {
    const res = await apiClient.get<
      ApiResponse<{
        claim: Claim;
        documents: ClaimDocument[];
        decision: Decision | null;
        executions: AgentExecution[];
      }>
    >(`/claims/${id}`);
    return res.data.data;
  },

  async createClaim(data: Partial<Claim>) {
    const res = await apiClient.post<ApiResponse<Claim>>('/claims', data);
    return res.data.data;
  },

  async deleteClaim(id: string) {
    const res = await apiClient.delete<ApiResponse<null>>(`/claims/${id}`);
    return res.data;
  },

  async uploadDocuments(id: string, formData: FormData) {
    const res = await apiClient.post<ApiResponse<ClaimDocument[]>>(
      `/claims/${id}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data.data;
  },

  async analyzeClaim(id: string) {
    const res = await apiClient.post<
      ApiResponse<{
        claim: Claim;
        decision: Decision;
        executions: AgentExecution[];
      }>
    >(`/claims/${id}/analyze`);
    return res.data.data;
  },

  async getAnalysis(id: string) {
    const res = await apiClient.get<
      ApiResponse<{
        claim: Claim;
        decision: Decision | null;
        executions: AgentExecution[];
      }>
    >(`/claims/${id}/analysis`);
    return res.data.data;
  },

  async getAgentExecutions(id: string) {
    const res = await apiClient.get<ApiResponse<AgentExecution[]>>(
      `/claims/${id}/agent-executions`
    );
    return res.data.data;
  },

  async getDecision(id: string) {
    const res = await apiClient.get<ApiResponse<Decision>>(`/claims/${id}/decision`);
    return res.data.data;
  },

  async submitReview(id: string, data: { action: 'APPROVE' | 'REJECT'; comment?: string }) {
    const res = await apiClient.post<
      ApiResponse<{
        claim: Claim;
        decision: Decision;
      }>
    >(`/claims/${id}/review`, data);
    return res.data.data;
  },

  async getAnalyticsStats(): Promise<AnalyticsStats> {
    const res = await apiClient.get<ApiResponse<AnalyticsStats>>('/claims/analytics/stats');
    return res.data.data;
  },

  async getDemoPresets(): Promise<DemoPreset[]> {
    const res = await apiClient.get<ApiResponse<DemoPreset[]>>('/claims/demo/presets');
    return res.data.data;
  },

  async seedDemoClaim(presetId: string) {
    const res = await apiClient.post<
      ApiResponse<{
        claim: Claim;
        documents: ClaimDocument[];
        preset: { id: string; name: string; expectedResult: string };
      }>
    >('/claims/demo/seed', { presetId });
    return res.data.data;
  },
};
