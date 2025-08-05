"use client";

import { useState } from "react";
import { Position, NodeProps } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PromptSelector } from "@/components/ui/prompt-selector";
import { ArrowRight, Sparkles, Copy } from "lucide-react";
import { ThemedHandle } from "../themed-handle";

export const ResultPromptNode = ({ data, selected }: NodeProps<any>) => {
  const [prompt, setPrompt] = useState(data.prompt || "");
  const [inputImageUrl] = useState(data.inputImageUrl || "");
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhancePrompt = async () => {
    setIsEnhancing(true);
    try {
      // Simulação de enhancement
      setTimeout(() => {
        setPrompt(prompt + " com melhorias adicionais, estilo aprimorado");
        setIsEnhancing(false);
      }, 2000);
    } catch (error) {
      setIsEnhancing(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
  };

  return (
    <div className="relative">
      <Card className={`w-80 ${selected ? "ring-2 ring-primary" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              {data.label}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              Resultado → Prompt
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Preview da imagem de entrada (se houver) */}
          {inputImageUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Imagem de Entrada</label>
              <img src={inputImageUrl} alt="Entrada" className="w-full h-20 object-cover rounded-lg border bg-muted" />
            </div>
          )}

          {/* Indicador de entrada */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <ArrowRight className="h-3 w-3" />
            <span>Recebe resultado do nó anterior</span>
          </div>

          {/* Campo de Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Novo Prompt</label>
            <PromptSelector currentPrompt={prompt} onSelectPrompt={setPrompt} />
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Descreva as próximas modificações..."
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleEnhancePrompt}
              disabled={isEnhancing || !prompt.trim()}
              className="flex-1"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {isEnhancing ? "Melhorando..." : "Melhorar"}
            </Button>

            <Button size="sm" variant="ghost" onClick={handleCopyPrompt} disabled={!prompt.trim()}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>

          {prompt.length > 0 && <div className="text-xs text-muted-foreground">{prompt.length} caracteres</div>}
        </CardContent>
      </Card>

      {/* Handles para conexões - posicionados na lateral do card */}
      <ThemedHandle
        type="target"
        position={Position.Left}
        id="result-prompt-input"
        color="#059669"
        style={{ top: "50%", left: "-8px" }}
      />
      <ThemedHandle
        type="source"
        position={Position.Right}
        id="result-prompt-output"
        color="#059669"
        style={{ top: "50%", right: "-8px" }}
      />
    </div>
  );
};
