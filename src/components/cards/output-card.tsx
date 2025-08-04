"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Image, GripVertical } from "lucide-react";
import { DragItem } from "@/types";

interface OutputCardProps {
  onDragStart?: (item: DragItem) => void;
}

export const OutputCard = ({ onDragStart }: OutputCardProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    const dragItem: DragItem = {
      type: "output",
      data: {
        label: "Output",
        maxImages: 4,
        downloadFormats: ["png", "jpg", "webp"],
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
          <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg">
            <Image className="h-4 w-4 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-orange-400">Output</h3>
            <p className="text-xs text-orange-600 truncate">Resultado da geração de imagens</p>
          </div>
          <GripVertical className="h-4 w-4 text-orange-400" />
        </div>
      </CardContent>
    </Card>
  );
};
