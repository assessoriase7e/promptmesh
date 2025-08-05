'use client';

import { useState, useRef } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Image, X, FileImage } from 'lucide-react';
import { ThemedHandle } from '../themed-handle';
export const UploadNode = ({ data, selected }: NodeProps<any>) => {
  const [imageUrl, setImageUrl] = useState(data.imageUrl || '');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      
      // Aqui seria o upload real para UploadThing
      // uploadFile(file).then(setImageUrl);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className={`w-80 ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileImage className="h-4 w-4" />
            {data.label}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Upload
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {imageUrl ? (
          <div className="relative">
            <img
              src={imageUrl}
              alt="Uploaded"
              className="w-full h-32 object-cover rounded-md"
            />
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={handleRemoveImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Arraste uma imagem ou clique para selecionar
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="h-3 w-3 mr-1" />
              Selecionar
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {imageUrl && (
          <div className="text-xs text-muted-foreground">
            Imagem carregada com sucesso
          </div>
        )}
      </CardContent>

      {/* Handles para conexões */}
      <ThemedHandle
        type="source"
        position={Position.Right}
        id="upload-output"
        color="#06b6d4"
        style={{ top: '50%' }}
      />
    </Card>
  );
};