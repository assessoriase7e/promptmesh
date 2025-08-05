"use client";

import { ConnectionLineComponentProps } from "@xyflow/react";

export const CustomConnectionLine = ({
  fromX,
  fromY,
  toX,
  toY,
  connectionLineStyle,
}: ConnectionLineComponentProps) => {
  return (
    <g>
      <path
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={6}
        strokeDasharray="10,5"
        strokeOpacity={1}
        d={`M${fromX},${fromY} C ${fromX + 50},${fromY} ${toX - 50},${toY} ${toX},${toY}`}
        style={{
          animation: "dash 1s linear infinite",
          zIndex: 1000,
          ...connectionLineStyle,
        }}
      />
      {/* Círculo no ponto de origem */}
      <circle
        cx={fromX}
        cy={fromY}
        r={4}
        fill="hsl(var(--primary))"
        opacity={0.8}
      />
      {/* Círculo no ponto de destino */}
      <circle
        cx={toX}
        cy={toY}
        r={4}
        fill="hsl(var(--primary))"
        opacity={0.8}
      />
    </g>
  );
};