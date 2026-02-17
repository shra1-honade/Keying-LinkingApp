/**
 * Centralized API client for BizMatch v2
 * All API calls go through this file
 */

import axios, { AxiosError } from 'axios';
import type {
  Config,
  Run,
  PaginatedResults,
  MatchResult,
  CreateConfigPayload,
  UpdateConfigPayload,
  CreateRunPayload,
  DownloadResult,
  UserPreferences,
  UpdatePreferencesPayload,
  SnowflakeConnectionPayload,
  AuditLog,
  DataQualityReport,
  QualityCheckPreviewPayload,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Configs API
export const configsApi = {
  getAll: async (): Promise<Config[]> => {
    const { data } = await api.get<{ configs: Config[] }>('/api/v1/configs');
    return data.configs;
  },

  getById: async (id: string): Promise<Config> => {
    const { data } = await api.get<Config>(`/api/v1/configs/${id}`);
    return data;
  },

  create: async (payload: CreateConfigPayload): Promise<Config> => {
    const { data } = await api.post<Config>('/api/v1/configs', payload);
    return data;
  },

  update: async (id: string, payload: UpdateConfigPayload): Promise<Config> => {
    const { data } = await api.put<Config>(`/api/v1/configs/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/configs/${id}`);
  },

  duplicate: async (id: string): Promise<Config> => {
    const { data } = await api.post<Config>(`/api/v1/configs/${id}/duplicate`);
    return data;
  },

  qualityCheck: async (payload: QualityCheckPreviewPayload): Promise<DataQualityReport> => {
    const { data } = await api.post<DataQualityReport>('/api/v1/configs/quality-check', payload);
    return data;
  },
};

// Runs API
export const runsApi = {
  getAll: async (status?: string): Promise<Run[]> => {
    const params = status ? { status } : {};
    const { data } = await api.get<{ runs: Run[] }>('/api/v1/runs', { params });
    return data.runs;
  },

  getById: async (id: string): Promise<Run> => {
    const { data } = await api.get<Run>(`/api/v1/runs/${id}`);
    return data;
  },

  create: async (payload: CreateRunPayload): Promise<Run> => {
    const { data } = await api.post<Run>('/api/v1/runs', payload);
    return data;
  },

  getResults: async (
    runId: string,
    params?: {
      page?: number;
      page_size?: number;
      min_score?: number;
      search?: string;
      show_unmatched?: boolean;
    }
  ): Promise<PaginatedResults<MatchResult>> => {
    const { data } = await api.get<PaginatedResults<MatchResult>>(
      `/api/v1/runs/${runId}/results`,
      { params }
    );
    return data;
  },

  download: async (runId: string): Promise<DownloadResult> => {
    const { data } = await api.get<DownloadResult>(`/api/v1/runs/${runId}/download`);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/runs/${id}`);
  },
};

// Preferences API
export const preferencesApi = {
  get: async (orgId: string = 'demo_org'): Promise<UserPreferences> => {
    const { data } = await api.get<UserPreferences>(`/api/v1/preferences/${orgId}`);
    return data;
  },

  update: async (orgId: string = 'demo_org', payload: UpdatePreferencesPayload): Promise<UserPreferences> => {
    const { data } = await api.put<UserPreferences>(`/api/v1/preferences/${orgId}`, payload);
    return data;
  },
};

// Audit Logs API
export const auditApi = {
  getAll: async (params?: { run_id?: string; event_type?: string; limit?: number }): Promise<AuditLog[]> => {
    const { data } = await api.get<{ logs: AuditLog[] }>('/api/v1/audit-logs', { params });
    return data.logs;
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<{
    total_runs: number;
    completed_runs: number;
    avg_match_rate: number;
    total_records_matched: number;
    recent_runs: Run[];
  }> => {
    // Aggregate from runs endpoint
    const runs = await runsApi.getAll();
    const completed = runs.filter((r) => r.status === 'completed');
    const avgRate = completed.length > 0
      ? completed.reduce((sum, r) => sum + r.match_rate, 0) / completed.length
      : 0;
    const totalMatched = completed.reduce((sum, r) => sum + r.matched_count, 0);

    return {
      total_runs: runs.length,
      completed_runs: completed.length,
      avg_match_rate: avgRate,
      total_records_matched: totalMatched,
      recent_runs: runs.slice(0, 5),
    };
  },
};

// Datasource API
export const datasourceApi = {
  getTables: async (sourceType: string = 'sqlite'): Promise<{ tables: string[] }> => {
    const { data } = await api.get<{ tables: string[] }>('/api/v1/datasource/tables', {
      params: { source_type: sourceType },
    });
    return data;
  },

  getColumns: async (table: string, sourceType: string = 'sqlite'): Promise<{ columns: string[] }> => {
    const { data } = await api.get<{ columns: string[] }>(`/api/v1/datasource/tables/${table}/columns`, {
      params: { source_type: sourceType },
    });
    return data;
  },
};

// Snowflake API
export const snowflakeApi = {
  testConnection: async (payload: SnowflakeConnectionPayload): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post<{ success: boolean; message: string }>('/api/v1/snowflake/test-connection', payload);
    return data;
  },

  getTables: async (): Promise<{ tables: string[] }> => {
    const { data } = await api.get<{ tables: string[] }>('/api/v1/snowflake/tables');
    return data;
  },

  previewTable: async (tableName: string): Promise<{ data: Record<string, unknown>[] }> => {
    const { data } = await api.get<{ data: Record<string, unknown>[] }>(`/api/v1/snowflake/preview/${tableName}`);
    return data;
  },
};

export default api;
