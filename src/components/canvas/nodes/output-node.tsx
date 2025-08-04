"use client";

import { useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, Image, Loader2, CheckCircle, AlertCircle, Eye } from "lucide-react";
export const OutputNode = ({ data, selected }: NodeProps<any>) => {
  const [outputs] = useState(data.outputs || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "generating" | "completed" | "error">("idle");

  const handleDownload = (url: string, index: number) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `fluxo-ia-output-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    outputs.forEach((url, index) => {
      setTimeout(() => handleDownload(url, index), index * 500);
    });
  };

  const getStatusIcon = () => {
    switch (status) {
      case "generating":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Image className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "generating":
        return "Gerando...";
      case "completed":
        return "Concluído";
      case "error":
        return "Erro na geração";
      default:
        return "Aguardando execução";
    }
  };

  return (
    <Card className={`w-80 ${selected ? "ring-2 ring-primary" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {getStatusIcon()}
            {data.label}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Output
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status e progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{getStatusText()}</span>
            {outputs.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {outputs.length} imagem{outputs.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {isGenerating && <Progress value={progress} className="h-2" />}
        </div>

        {/* Preview das imagens geradas */}
        {outputs.length > 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {outputs.slice(0, 4).map((url, index) => (
                <div key={index} className="relative group">
                  <img src={url} alt={`Output ${index + 1}`} className="w-full h-20 object-cover rounded border" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 w-6 p-0"
                      onClick={() => handleDownload(url, index)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="secondary" className="h-6 w-6 p-0">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {outputs.length > 4 && (
              <div className="text-center">
                <span className="text-xs text-muted-foreground">+{outputs.length - 4} mais imagens</span>
              </div>
            )}
          </div>
        )}

        {/* Ações */}
        {outputs.length > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleDownloadAll} className="flex-1">
              <Download className="h-3 w-3 mr-1" />
              Baixar Todas
            </Button>
          </div>
        )}

        {/* Estado vazio */}
        {outputs.length === 0 && status === "idle" && (
          <div className="text-center py-6">
            <Image className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Execute o fluxo para gerar imagens</p>
          </div>
        )}

        {/* Informações de créditos */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Custo estimado: {outputs.length || 1} crédito{(outputs.length || 1) !== 1 ? "s" : ""}
        </div>
      </CardContent>

      {/* Handles para conexões */}
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-amber-500" />
      {/* Handle de saída para continuar a cadeia */}
      {outputs.length > 0 && <Handle type="source" position={Position.Right} className="w-3 h-3 bg-amber-500" />}
    </Card>
  );
};
