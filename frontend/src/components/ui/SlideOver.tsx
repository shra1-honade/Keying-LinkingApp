import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}

export default function SlideOver({ open, onClose, title, subtitle, children, wide }: SlideOverProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute inset-y-0 right-0 flex max-w-full">
        <div
          className={cn(
            'w-screen transform transition-transform duration-300 ease-in-out',
            wide ? 'max-w-2xl' : 'max-w-lg',
            open ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="flex h-full flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-efx-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-efx-gray-900">{title}</h2>
                  {subtitle && (
                    <p className="mt-1 text-sm text-efx-gray-400">{subtitle}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-efx-gray-400 hover:text-efx-gray-700 rounded-md hover:bg-efx-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
