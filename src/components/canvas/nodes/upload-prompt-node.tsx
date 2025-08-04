"use client";

import { useState } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PromptSelector } from "@/components/ui/prompt-selector";
import { Upload, Image, Sparkles, X, MessageSquare } from "lucide-react";

export const UploadPromptNode = ({ data, selected, id }: NodeProps<any>) => {
  const [imageUrl, setImageUrl] = useState(data.imageUrl || "");
  const [prompt, setPrompt] = useState(data.prompt || "");
  const [isDragging, setIsDragging] = useState(false);
  const { deleteElements } = useReactFlow();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith("image/"));

    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  const removeImage = () => {
    setImageUrl("");
  };

  const enhancePrompt = () => {
    // Simulação de enhancement
    setPrompt(prompt + " com alta qualidade, detalhes realistas");
  };

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <Card className={`w-80 ${selected ? "ring-2 ring-primary" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="relative">
              <Upload className="h-4 w-4" />
              <MessageSquare className="h-3 w-3 absolute -bottom-1 -right-1" />
            </div>
            {data.label}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Upload + Prompt
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Área de Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Imagem Base</label>
          {imageUrl ? (
            <div className="relative">
              <img src={imageUrl} alt="Upload" className="w-full h-32 object-cover rounded-lg border" />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 h-6 w-6 p-0"
                onClick={removeImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">Arraste uma imagem ou clique para selecionar</p>
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="file-upload" />
              <Button variant="outline" size="sm" onClick={() => document.getElementById("file-upload")?.click()}>
                <Image className="h-3 w-3 mr-1" />
                Selecionar
              </Button>
            </div>
          )}
        </div>

        {/* Campo de Prompt */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Prompt de Edição</label>
          <PromptSelector currentPrompt={prompt} onSelectPrompt={setPrompt} />
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Descreva as modificações que deseja fazer na imagem..."
            className="min-h-[80px] resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={enhancePrompt} disabled={!prompt.trim()} className="flex-1">
              <Sparkles className="h-3 w-3 mr-1" />
              Melhorar
            </Button>
          </div>
        </div>

        {prompt.length > 0 && <div className="text-xs text-muted-foreground">{prompt.length} caracteres</div>}
      </CardContent>

      {/* Handles para conexões */}
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-orange-500" />
    </Card>
  );
};
