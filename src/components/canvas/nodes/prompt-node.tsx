'use client';

import { useState } from 'react';
import { Position, NodeProps, useReactFlow } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PromptSelector } from '@/components/ui/prompt-selector';
import { Sparkles, Copy, Edit3, X } from 'lucide-react';
import { ThemedHandle } from '../themed-handle';

export const PromptNode = ({ data, selected, id }: NodeProps<any>) => {
  const [prompt, setPrompt] = useState(data.prompt || '');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { deleteElements } = useReactFlow();

  const handleEnhancePrompt = async () => {
    setIsEnhancing(true);
    try {
      // Aqui seria a chamada para a API de enhancement
      // const enhanced = await enhancePrompt(prompt);
      // setPrompt(enhanced);
      
      // Simulação por enquanto
      setTimeout(() => {
        setPrompt(prompt + ' com detalhes ultra-realistas, iluminação cinematográfica, alta qualidade');
        setIsEnhancing(false);
      }, 2000);
    } catch (error) {
      setIsEnhancing(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
  };

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <Card className={`w-80 ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            {data.label}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Prompt
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
      
      <CardContent className="space-y-3">
        <PromptSelector
          currentPrompt={prompt}
          onSelectPrompt={setPrompt}
        />
        
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Descreva o que você quer gerar..."
          className="min-h-[100px] resize-none"
        />
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleEnhancePrompt}
            disabled={isEnhancing || !prompt.trim()}
            className="flex-1"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {isEnhancing ? 'Melhorando...' : 'Melhorar'}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyPrompt}
            disabled={!prompt.trim()}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>

        {prompt.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {prompt.length} caracteres
          </div>
        )}
      </CardContent>

      {/* Handles para conexões */}
      <ThemedHandle
        type="source"
        position={Position.Right}
        id="prompt-output"
        color="#8b5cf6"
        style={{ top: '50%' }}
      />
    </Card>
  );
};