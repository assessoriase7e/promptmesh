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
        "transition-all duration-200 cursor-crosshair",
        className
      )}
      style={{
        backgroundColor: color,
        width: '16px',
        height: '16px',
        border: '2px solid white',
        borderRadius: '50%',
        zIndex: 1000,
        pointerEvents: 'all',
        position: 'relative',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        ...props.style
      }}
    />
  );
};