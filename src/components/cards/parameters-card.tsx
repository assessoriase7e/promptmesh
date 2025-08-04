"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Settings, GripVertical } from "lucide-react";
import { DragItem } from "@/types";

interface ParametersCardProps {
  onDragStart?: (item: DragItem) => void;
}

export const ParametersCard = ({ onDragStart }: ParametersCardProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    const dragItem: DragItem = {
      type: "parameters",
      data: {
        label: "Parâmetros",
        defaultModel: "dall-e-3",
        defaultStyle: "photorealistic",
        defaultResolution: "1024x1024",
      },
    };

    e.dataTransfer.setData("application/json", JSON.stringify(dragItem));
    onDragStart?.(dragItem);
  };

  return (
    <Card
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-dashed border-2"
      draggable
      onDragStart={handleDragStart}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
            <Settings className="h-4 w-4 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-green-400">Parâmetros</h3>
            <p className="text-xs text-green-600 truncate">Configurações de modelo e estilo</p>
          </div>
          <GripVertical className="h-4 w-4 text-green-400" />
        </div>
      </CardContent>
    </Card>
  );
};
