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
        "transition-all duration-200 cursor-crosshair hover:scale-110",
        className
      )}
      style={{
        backgroundColor: color,
        width: '18px',
        height: '18px',
        border: '3px solid white',
        borderRadius: '50%',
        zIndex: 1001,
        pointerEvents: 'all',
        position: 'absolute',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        opacity: 1,
        ...props.style
      }}
    />
  );
};