import type { ReactNode } from 'react';
import Card from './Card';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="p-12">
      <div className="text-center">
        <div className="text-efx-gray-400 mb-4 flex justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-efx-gray-900 mb-2">{title}</h3>
        <p className="text-efx-gray-400 mb-6 max-w-sm mx-auto">{description}</p>
        {action && <div>{action}</div>}
      </div>
    </Card>
  );
}
