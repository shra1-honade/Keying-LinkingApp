/**
 * TypeScript type definitions for BizMatch v2
 * All IDs are UUIDs (strings). Zero `any` types.
 */

export interface Config {
  config_id: string;
  org_id: string;
  name: string;
  source_type: string;
  source_table: string;
  column_mapping: Record<string, string>;
  run_count: number;
  created_at: string;
  updated_at: string;
}

export interface Run {
  run_id: string;
  config_id: string;
  org_id: string;
  config_name?: string;
  status: RunStatus;
  input_count: number;
  matched_count: number;
  match_rate: number;
  avg_confidence?: number;
  error_message?: string;
  duration_seconds?: number;
  started_at: string;
  completed_at: string | null;
}

export type RunStatus = 'queued' | 'in_progress' | 'completed' | 'error' | 'archived';

export interface MatchResult {
  result_id: string;
  run_id: string;
  client_id: string;
  input_business_name: string;
  input_address?: string;
  input_city?: string;
  input_state?: string;
  input_zip?: string;
  matched_efx_business?: string;
  efx_id?: string;
  efx_address?: string;
  efx_city?: string;
  efx_state?: string;
  efx_zip?: string;
  confidence_score: number;
  name_similarity?: number;
  address_similarity?: number;
  match_reason?: string;
  flagged_for_review: boolean;
}

export interface PaginatedResults<T> {
  results: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ColumnMapping {
  business_name: string;
  zip?: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface CreateConfigPayload {
  name: string;
  source_type?: string;
  source_table: string;
  column_mapping: Record<string, string>;
  org_id?: string;
}

export interface UpdateConfigPayload {
  name?: string;
  source_type?: string;
  source_table?: string;
  column_mapping?: Record<string, string>;
}

export interface CreateRunPayload {
  config_id: string;
  org_id?: string;
}

export interface DownloadResult {
  filename: string;
  content: string;
}

export interface UserPreferences {
  org_id: string;
  email_notifications: boolean;
  notify_on_completion: boolean;
  notify_on_error: boolean;
  retention_days: number;
  auto_archive: boolean;
  default_page_size: number;
}

export interface UpdatePreferencesPayload {
  email_notifications?: boolean;
  notify_on_completion?: boolean;
  notify_on_error?: boolean;
  retention_days?: number;
  auto_archive?: boolean;
  default_page_size?: number;
}

export interface SnowflakeConnectionPayload {
  account: string;
  user: string;
  password: string;
  warehouse: string;
  database: string;
  schema_name?: string;
}

export interface AuditLog {
  log_id: string;
  run_id: string | null;
  org_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

// Data Quality Check types
export interface FieldStats {
  field: string;
  mapped_to: string | null;
  total: number;
  populated: number;
  null_or_empty: number;
  null_percent: number;
  format_errors: number;
  format_error_percent: number;
}

export interface MappingCompleteness {
  mapped_count: number;
  total_fields: number;
  percent: number;
  unmapped_fields: string[];
}

export interface DuplicateInfo {
  count: number;
  percent: number;
  examples: string[];
}

export interface QualityWarning {
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface DataQualityReport {
  overall_score: number;
  mapping_completeness: MappingCompleteness;
  field_stats: FieldStats[];
  duplicates: DuplicateInfo;
  warnings: QualityWarning[];
  recommendations: string[];
  sample_size: number;
}

export interface QualityCheckPreviewPayload {
  column_mapping: Record<string, string>;
  source_table: string;
}

// Score labels for confidence levels
export const CONFIDENCE_LABELS: Record<number, string> = {
  5: 'Definitive Match',
  4: 'High Confidence',
  3: 'Probable Match',
  2: 'Possible Match',
  1: 'Low Confidence',
  0: 'No Match',
};

// Confidence score colors
export const CONFIDENCE_COLORS: Record<number, string> = {
  5: '#059669',  // emerald-600
  4: '#2563eb',  // blue-600
  3: '#7c3aed',  // violet-600
  2: '#d97706',  // amber-600
  1: '#ea580c',  // orange-600
  0: '#dc2626',  // red-600
};

// Status badge colors
export const STATUS_COLORS: Record<RunStatus, { bg: string; text: string }> = {
  completed: { bg: 'bg-green-50', text: 'text-green-700' },
  in_progress: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  error: { bg: 'bg-red-50', text: 'text-red-700' },
  queued: { bg: 'bg-efx-gray-100', text: 'text-efx-gray-600' },
  archived: { bg: 'bg-efx-gray-100', text: 'text-efx-gray-600' },
};

// Match rate colors
export const getMatchRateColor = (rate: number): string => {
  if (rate >= 80) return 'text-green-600';
  if (rate >= 50) return 'text-yellow-600';
  return 'text-red-600';
};
