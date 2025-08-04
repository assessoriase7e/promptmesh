"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, GripVertical } from "lucide-react";
import { DragItem } from "@/types";

interface ResultPromptCardProps {
  onDragStart?: (item: DragItem) => void;
}

export const ResultPromptCard = ({ onDragStart }: ResultPromptCardProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    const dragItem: DragItem = {
      type: "result-prompt",
      data: {
        label: "Resultado → Prompt",
        prompt: "Continue editando...",
        inputImageUrl: "",
      },
    };

    e.dataTransfer.setData("application/json", JSON.stringify(dragItem));
    onDragStart?.(dragItem);
  };

  return (
    <Card
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-dashed border-2 border-emerald-200 hover:border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50"
      draggable
      onDragStart={handleDragStart}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-lg">
            <ArrowRight className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-emerald-900">Resultado → Prompt</h3>
            <p className="text-xs text-emerald-600 truncate">Continua a cadeia de edição</p>
          </div>
          <GripVertical className="h-4 w-4 text-emerald-400" />
        </div>
      </CardContent>
    </Card>
  );
};
