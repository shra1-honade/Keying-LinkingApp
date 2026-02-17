import { Check } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface WizardStepperProps {
  steps: string[];
  currentStep: number;
}

export default function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center flex-1">
          <div className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                index < currentStep
                  ? 'bg-efx-red text-white'
                  : index === currentStep
                  ? 'bg-efx-red text-white ring-4 ring-efx-red/20'
                  : 'bg-efx-gray-200 text-efx-gray-600'
              )}
            >
              {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <span
              className={cn(
                'ml-3 text-sm font-medium',
                index <= currentStep ? 'text-efx-gray-900' : 'text-efx-gray-400'
              )}
            >
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'flex-1 h-0.5 mx-4',
                index < currentStep ? 'bg-efx-red' : 'bg-efx-gray-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
