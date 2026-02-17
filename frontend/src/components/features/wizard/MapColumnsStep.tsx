import { useState, useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { WizardData } from '../../../pages/NewRun';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { cn } from '../../../lib/utils';
import { useTableColumns } from '../../../hooks/useDatasource';

interface MapColumnsStepProps {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const EFX_FIELDS = [
  { key: 'business_name', label: 'Business Name', required: true },
  { key: 'client_id', label: 'Client ID', required: true },
  { key: 'address', label: 'Address', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'zip', label: 'Zip Code', required: false },
];

const DEMO_SOURCE_COLUMNS = [
  'company_name', 'business_name', 'org_name',
  'unique_id', 'client_id', 'record_id',
  'street_address', 'address_line_1', 'addr',
  'city_name', 'city',
  'state_code', 'state', 'st',
  'postal_code', 'zip_code', 'zip',
];

function buildAutoMapping(columns: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const field of EFX_FIELDS) {
    const exactMatch = columns.find((col) => col === field.key);
    if (exactMatch) {
      mapping[field.key] = exactMatch;
    }
  }
  return mapping;
}

export default function MapColumnsStep({ data, updateData, onNext, onBack }: MapColumnsStepProps) {
  const { data: fetchedColumns, isLoading: columnsLoading } = useTableColumns(
    data.selectedTable || undefined,
    data.connectionType,
  );

  const sourceColumns = fetchedColumns ?? DEMO_SOURCE_COLUMNS;

  const [mapping, setMapping] = useState<Record<string, string>>(data.columnMapping);
  const [initialized, setInitialized] = useState(false);

  // Auto-map when columns load and no existing mapping
  useEffect(() => {
    if (initialized) return;
    if (Object.keys(data.columnMapping).length > 0) {
      setMapping(data.columnMapping);
      setInitialized(true);
      return;
    }
    if (fetchedColumns && fetchedColumns.length > 0) {
      setMapping(buildAutoMapping(fetchedColumns));
      setInitialized(true);
    }
  }, [fetchedColumns, data.columnMapping, initialized]);

  const handleMapChange = (efxField: string, sourceColumn: string) => {
    const newMapping = { ...mapping, [efxField]: sourceColumn };
    setMapping(newMapping);
  };

  const requiredFieldsMapped = EFX_FIELDS
    .filter((f) => f.required)
    .every((f) => mapping[f.key]);

  const handleNext = () => {
    updateData({ columnMapping: mapping });
    onNext();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-base font-medium text-efx-gray-900 mb-1">Column Mapping</h3>
        <p className="text-sm text-efx-gray-600 mb-6">
          Map your source columns to the EFX matching schema. Required fields are marked with *.
        </p>

        {columnsLoading ? (
          <div className="flex items-center gap-2 text-sm text-efx-gray-500 py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading columns from {data.selectedTable}...
          </div>
        ) : (
          <div className="space-y-3">
            {EFX_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-4">
                <div className="w-40 flex-shrink-0">
                  <span className="text-sm font-medium text-efx-gray-900">
                    {field.label}
                    {field.required && <span className="text-efx-red ml-1">*</span>}
                  </span>
                </div>

                <ArrowRight className="h-4 w-4 text-efx-gray-400 flex-shrink-0" />

                <select
                  value={mapping[field.key] || ''}
                  onChange={(e) => handleMapChange(field.key, e.target.value)}
                  className={cn(
                    'flex-1 px-3 py-2 border rounded-md text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-efx-red focus:border-transparent',
                    mapping[field.key] ? 'border-efx-gray-200' : 'border-amber-300 bg-amber-50'
                  )}
                >
                  <option value="">— Select source column —</option>
                  {sourceColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Save as Config */}
      <Card className="p-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.saveAsConfig}
            onChange={(e) => updateData({ saveAsConfig: e.target.checked })}
            className="rounded border-efx-gray-300 text-efx-red focus:ring-efx-red"
          />
          <div>
            <span className="text-sm font-medium text-efx-gray-900">Save as configuration</span>
            <p className="text-xs text-efx-gray-600">Reuse this mapping for future runs</p>
          </div>
        </label>

        {data.saveAsConfig && (
          <div className="mt-4">
            <Input
              label="Configuration Name"
              value={data.configName}
              onChange={(e) => updateData({ configName: e.target.value })}
              placeholder="e.g., Q1 Customer Match"
            />
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" onClick={handleNext} disabled={!requiredFieldsMapped}>
          Next: Review
        </Button>
      </div>
    </div>
  );
}
