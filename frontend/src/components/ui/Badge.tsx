import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import type { RunStatus } from '../../types';
import { STATUS_COLORS } from '../../types';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: RunStatus;
  pulse?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, status, pulse, ...props }, ref) => {
    const colors = STATUS_COLORS[status];

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          colors.bg,
          colors.text,
          pulse && 'animate-pulse',
          className
        )}
        {...props}
      >
        {status === 'in_progress' && (
          <span className="mr-1.5 h-2 w-2 rounded-full bg-current animate-pulse" />
        )}
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
