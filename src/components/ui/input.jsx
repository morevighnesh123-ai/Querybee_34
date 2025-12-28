import * as React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-[12px] border border-[hsl(var(--qb-border))] bg-[hsl(var(--qb-card))] px-3 py-2 text-sm text-[hsl(var(--qb-fg))] placeholder:text-[hsl(var(--qb-muted-fg))] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--qb-accent))] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
