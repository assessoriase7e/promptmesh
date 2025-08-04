'use client';

import { Handle, HandleProps } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface ThemedHandleProps extends Omit<HandleProps, 'className'> {
  color?: string;
  className?: string;
}

export const ThemedHandle = ({ 
  color = '#6b7280', 
  className,
  ...props 
}: ThemedHandleProps) => {
  return (
    <Handle
      {...props}
      className={cn(
        "w-3 h-3 !border-2 transition-all duration-200",
        "hover:scale-110 hover:shadow-lg",
        className
      )}
      style={{
        backgroundColor: color,
        border: '2px solid hsl(var(--background))',
        boxShadow: '0 0 0 0px hsl(var(--primary) / 0)',
        ...props.style
      }}
    />
  );
};