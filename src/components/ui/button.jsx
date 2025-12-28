import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

const Button = React.forwardRef(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      asChild = false,
      type,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        type={type ?? (asChild ? undefined : 'button')}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--qb-accent))] disabled:pointer-events-none disabled:opacity-50',
          variant === 'default' &&
            'bg-[hsl(var(--qb-accent))] text-[hsl(var(--qb-accent-fg))] hover:opacity-95',
          variant === 'secondary' &&
            'bg-[hsl(var(--qb-muted))] text-[hsl(var(--qb-fg))] hover:opacity-95',
          variant === 'ghost' &&
            'bg-transparent text-[hsl(var(--qb-fg))] hover:bg-[hsl(var(--qb-muted))]',
          variant === 'outline' &&
            'border border-[hsl(var(--qb-border))] bg-transparent text-[hsl(var(--qb-fg))] hover:bg-[hsl(var(--qb-muted))]',
          size === 'default' && 'h-10 px-4',
          size === 'sm' && 'h-9 px-3',
          size === 'icon' && 'h-10 w-10 p-0',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
