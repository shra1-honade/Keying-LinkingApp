import { useState } from 'react';
import { Database, Snowflake, Loader2 } from 'lucide-react';
import type { WizardData } from '../../../pages/NewRun';
import type { Config } from '../../../types';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { cn } from '../../../lib/utils';
import { useTables } from '../../../hooks/useDatasource';

interface ConnectStepProps {
  data: WizardData;
  configs: Config[];
  updateData: (partial: Partial<WizardData>) => void;
  onNext: () => void;
  onCancel: () => void;
}

export default function ConnectStep({ data, configs, updateData, onNext, onCancel }: ConnectStepProps) {
  const [useExistingConfig, setUseExistingConfig] = useState(false);

  const { data: tables, isLoading: tablesLoading } = useTables(
    data.connectionType === 'sqlite' ? 'sqlite' : undefined!
  );

  const handleSelectConfig = (configId: string) => {
    const config = configs.find((c) => c.config_id === configId);
    if (config) {
      updateData({
        selectedConfigId: configId,
        selectedTable: config.source_table,
        columnMapping: config.column_mapping,
        configName: config.name,
        connectionType: (config.source_type as 'sqlite' | 'snowflake') || 'sqlite',
      });
    }
  };

  const canProceed = useExistingConfig
    ? !!data.selectedConfigId
    : data.connectionType === 'sqlite' && !!data.selectedTable;

  return (
    <div className="space-y-6">
      {/* Use Existing Config Toggle */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-efx-gray-900">Data Source</h3>
          {configs.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-efx-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={useExistingConfig}
                onChange={(e) => {
                  setUseExistingConfig(e.target.checked);
                  if (!e.target.checked) updateData({ selectedConfigId: undefined });
                }}
                className="rounded border-efx-gray-300 text-efx-red focus:ring-efx-red"
              />
              Use existing configuration
            </label>
          )}
        </div>

        {useExistingConfig ? (
          <div className="space-y-3">
            {configs.map((config) => (
              <div
                key={config.config_id}
                onClick={() => handleSelectConfig(config.config_id)}
                className={cn(
                  'p-4 border rounded-lg cursor-pointer transition-colors',
                  data.selectedConfigId === config.config_id
                    ? 'border-efx-red bg-efx-red/5'
                    : 'border-efx-gray-200 hover:border-efx-gray-400'
                )}
              >
                <div className="font-medium text-efx-gray-900">{config.name}</div>
                <div className="text-sm text-efx-gray-600 mt-1">
                  Table: {config.source_table} | Runs: {config.run_count}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connection Type */}
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => updateData({ connectionType: 'sqlite', selectedTable: '' })}
                className={cn(
                  'p-4 border rounded-lg cursor-pointer transition-colors text-center',
                  data.connectionType === 'sqlite'
                    ? 'border-efx-red bg-efx-red/5'
                    : 'border-efx-gray-200 hover:border-efx-gray-400'
                )}
              >
                <Database className="h-8 w-8 mx-auto mb-2 text-efx-red" />
                <div className="font-medium text-efx-gray-900">SQLite Demo</div>
                <div className="text-xs text-efx-gray-600 mt-1">Use demo dataset</div>
              </div>
              <div
                onClick={() => updateData({ connectionType: 'snowflake', selectedTable: '' })}
                className={cn(
                  'p-4 border rounded-lg cursor-pointer transition-colors text-center',
                  data.connectionType === 'snowflake'
                    ? 'border-efx-red bg-efx-red/5'
                    : 'border-efx-gray-200 hover:border-efx-gray-400'
                )}
              >
                <Snowflake className="h-8 w-8 mx-auto mb-2 text-efx-red" />
                <div className="font-medium text-efx-gray-900">Snowflake</div>
                <div className="text-xs text-efx-gray-600 mt-1">Connect to warehouse</div>
              </div>
            </div>

            {data.connectionType === 'sqlite' && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-800">
                    Connected to demo SQLite database with 100,000 reference businesses.
                  </div>
                </div>

                {/* Table Picker */}
                <div>
                  <label className="block text-sm font-medium text-efx-gray-900 mb-2">
                    Select Table
                  </label>
                  {tablesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-efx-gray-500 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading tables...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tables?.map((table) => (
                        <div
                          key={table}
                          onClick={() => updateData({ selectedTable: table })}
                          className={cn(
                            'px-4 py-3 border rounded-lg cursor-pointer transition-colors',
                            data.selectedTable === table
                              ? 'border-efx-red bg-efx-red/5'
                              : 'border-efx-gray-200 hover:border-efx-gray-400'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-efx-gray-400" />
                            <span className="text-sm font-medium text-efx-gray-900">{table}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {data.connectionType === 'snowflake' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="text-sm text-amber-800">
                  Snowflake integration coming soon. Use SQLite demo for now.
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!canProceed}
        >
          {useExistingConfig ? 'Skip to Review' : 'Next: Map Columns'}
        </Button>
      </div>
    </div>
  );
}
