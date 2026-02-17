import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils';

interface Tab {
  value: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  value: string;
  onValueChange: (value: string) => void;
}

export default function Tabs({ tabs, value, onValueChange }: TabsProps) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange}>
      <TabsPrimitive.List className="flex border-b border-efx-gray-200">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              'data-[state=active]:border-efx-red data-[state=active]:text-efx-red',
              'data-[state=inactive]:border-transparent data-[state=inactive]:text-efx-gray-600',
              'hover:text-efx-gray-900'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 text-xs bg-efx-gray-100 text-efx-gray-600 px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
