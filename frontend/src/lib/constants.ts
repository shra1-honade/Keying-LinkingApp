/**
 * Application constants
 */

export const CONFIDENCE_LABELS: Record<number, string> = {
  5: 'Definitive Match',
  4: 'High Confidence',
  3: 'Probable Match',
  2: 'Possible Match',
  1: 'Low Confidence',
  0: 'No Match',
};

export const CONFIDENCE_COLORS: Record<number, string> = {
  5: '#059669',
  4: '#2563eb',
  3: '#7c3aed',
  2: '#d97706',
  1: '#ea580c',
  0: '#dc2626',
};

export const CONFIDENCE_BG_COLORS: Record<number, string> = {
  5: 'bg-emerald-50 text-emerald-700',
  4: 'bg-blue-50 text-blue-700',
  3: 'bg-violet-50 text-violet-700',
  2: 'bg-amber-50 text-amber-700',
  1: 'bg-orange-50 text-orange-700',
  0: 'bg-red-50 text-red-700',
};

export const EFX_REQUIRED_FIELDS = [
  { key: 'business_name', label: 'Business Name', required: true },
  { key: 'client_id', label: 'Unique Client ID', required: true },
] as const;

export const EFX_OPTIONAL_FIELDS = [
  { key: 'address', label: 'Address', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'zip', label: 'Zip Code', required: false },
] as const;
