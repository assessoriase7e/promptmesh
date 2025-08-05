"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Upload, GripVertical } from "lucide-react";
import { DragItem } from "@/types";

interface UploadPromptCardProps {
  onDragStart?: (item: DragItem) => void;
}

export const UploadPromptCard = ({ onDragStart }: UploadPromptCardProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    const dragItem: DragItem = {
      type: "upload-prompt",
      data: {
        label: "Upload + Prompt",
        imageUrl: "",
        prompt: "Descreva as modificações desejadas...",
        acceptedTypes: ["image/*"],
        maxSize: 10 * 1024 * 1024, // 10MB
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
          <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg relative">
            <Upload className="h-3 w-3 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-orange-400">Upload + Prompt</h3>
            <p className="text-xs text-orange-600 truncate">Imagem + texto para edição</p>
          </div>
          <GripVertical className="h-4 w-4 text-orange-400" />
        </div>
      </CardContent>
    </Card>
  );
};
