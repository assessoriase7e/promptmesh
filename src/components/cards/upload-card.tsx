"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Upload, GripVertical } from "lucide-react";
import { DragItem } from "@/types";

interface UploadCardProps {
  onDragStart?: (item: DragItem) => void;
}

export const UploadCard = ({ onDragStart }: UploadCardProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    const dragItem: DragItem = {
      type: "upload",
      data: {
        label: "Upload",
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
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
            <Upload className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-blue-400">Upload</h3>
            <p className="text-xs text-blue-600 truncate">Upload de imagens e arquivos</p>
          </div>
          <GripVertical className="h-4 w-4 text-blue-400" />
        </div>
      </CardContent>
    </Card>
  );
};
