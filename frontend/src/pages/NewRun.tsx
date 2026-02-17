import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCreateRun } from '../hooks/useRuns';
import { useConfigs, useCreateConfig } from '../hooks/useConfigs';
import WizardStepper from '../components/features/wizard/WizardStepper';
import ConnectStep from '../components/features/wizard/ConnectStep';
import MapColumnsStep from '../components/features/wizard/MapColumnsStep';
import ReviewStep from '../components/features/wizard/ReviewStep';

export interface WizardData {
  // Step 1: Connect
  connectionType: 'sqlite' | 'snowflake';
  snowflakeConfig?: {
    account: string;
    user: string;
    password: string;
    warehouse: string;
    database: string;
    schema: string;
  };
  selectedTable: string;
  // Step 2: Map
  columnMapping: Record<string, string>;
  saveAsConfig: boolean;
  configName: string;
  // Step 3: Review
  selectedConfigId?: string;
}

const initialData: WizardData = {
  connectionType: 'sqlite',
  selectedTable: '',
  columnMapping: {},
  saveAsConfig: true,
  configName: '',
};

const steps = ['Connect', 'Map Columns', 'Review & Launch'];

export default function NewRun() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);

  const { data: configs } = useConfigs();
  const createConfig = useCreateConfig();
  const createRun = useCreateRun();

  const updateData = (partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleLaunch = async () => {
    try {
      let configId = data.selectedConfigId;

      // Create config if saving as new
      if (data.saveAsConfig && !configId) {
        const sourceTable = data.selectedTable || 'reference_businesses';
        const config = await createConfig.mutateAsync({
          name: data.configName || `Config - ${new Date().toLocaleDateString()}`,
          source_table: sourceTable,
          column_mapping: data.columnMapping,
          source_type: data.connectionType,
        });
        configId = config.config_id;
      }

      if (!configId) {
        toast.error('Please select or create a configuration');
        return;
      }

      await createRun.mutateAsync({ config_id: configId });
      toast.success('Run created successfully! Matching job started.');
      navigate('/runs');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Launch failed:', err);
      toast.error(`Failed to create run: ${message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-efx-gray-900">New Matching Run</h1>
        <p className="text-sm text-efx-gray-600 mt-1">
          Connect your data source, map columns, and launch a matching job.
        </p>
      </div>

      {/* Stepper */}
      <WizardStepper steps={steps} currentStep={currentStep} />

      {/* Step Content */}
      {currentStep === 0 && (
        <ConnectStep
          data={data}
          configs={configs || []}
          updateData={updateData}
          onNext={nextStep}
          onCancel={() => navigate('/runs')}
        />
      )}
      {currentStep === 1 && (
        <MapColumnsStep
          data={data}
          updateData={updateData}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {currentStep === 2 && (
        <ReviewStep
          data={data}
          onLaunch={handleLaunch}
          onBack={prevStep}
          isLoading={createRun.isPending || createConfig.isPending}
        />
      )}
    </div>
  );
}
