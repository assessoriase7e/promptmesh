'use client';

import { useState } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Settings, RotateCcw } from 'lucide-react';
import { AIParameters } from '@/types';
import { ThemedHandle } from '../themed-handle';

const models = [
  { value: 'dall-e-3', label: 'DALL-E 3' },
  { value: 'midjourney', label: 'Midjourney' },
  { value: 'stable-diffusion', label: 'Stable Diffusion' },
  { value: 'leonardo', label: 'Leonardo AI' },
];

const styles = [
  { value: 'photorealistic', label: 'Fotorrealista' },
  { value: 'artistic', label: 'Artístico' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'anime', label: 'Anime' },
  { value: 'abstract', label: 'Abstrato' },
];

const resolutions = [
  { value: '512x512', label: '512x512' },
  { value: '768x768', label: '768x768' },
  { value: '1024x1024', label: '1024x1024' },
  { value: '1024x768', label: '1024x768' },
  { value: '768x1024', label: '768x1024' },
];

export const ParametersNode = ({ data, selected }: NodeProps<any>) => {
  const [parameters, setParameters] = useState<AIParameters>(
    data.parameters || {
      model: 'dall-e-3',
      style: 'photorealistic',
      resolution: '1024x1024',
    }
  );
  const [isIterative, setIsIterative] = useState(data.isIterative || false);
  const [loopCount, setLoopCount] = useState(data.loopCount || 1);

  const updateParameter = (key: keyof AIParameters, value: any) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className={`w-80 ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {data.label}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Parâmetros
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Modelo */}
        <div className="space-y-2">
          <Label className="text-xs">Modelo</Label>
          <Select
            value={parameters.model}
            onValueChange={(value) => updateParameter('model', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Estilo */}
        <div className="space-y-2">
          <Label className="text-xs">Estilo</Label>
          <Select
            value={parameters.style}
            onValueChange={(value) => updateParameter('style', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {styles.map((style) => (
                <SelectItem key={style.value} value={style.value}>
                  {style.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resolução */}
        <div className="space-y-2">
          <Label className="text-xs">Resolução</Label>
          <Select
            value={parameters.resolution}
            onValueChange={(value) => updateParameter('resolution', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {resolutions.map((resolution) => (
                <SelectItem key={resolution.value} value={resolution.value}>
                  {resolution.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seed (opcional) */}
        <div className="space-y-2">
          <Label className="text-xs">Seed (opcional)</Label>
          <Input
            type="number"
            placeholder="Ex: 12345"
            value={parameters.seed || ''}
            onChange={(e) => updateParameter('seed', parseInt(e.target.value) || undefined)}
            className="h-8"
          />
        </div>

        {/* Loop/Iteração */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="iterative"
              checked={isIterative}
              onCheckedChange={setIsIterative}
            />
            <Label htmlFor="iterative" className="text-xs flex items-center gap-1">
              <RotateCcw className="h-3 w-3" />
              Modo iterativo
            </Label>
          </div>

          {isIterative && (
            <div className="space-y-2">
              <Label className="text-xs">Número de iterações</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={loopCount}
                onChange={(e) => setLoopCount(parseInt(e.target.value) || 1)}
                className="h-8"
              />
            </div>
          )}
        </div>
      </CardContent>

      {/* Handles para conexões */}
      <ThemedHandle
        type="target"
        position={Position.Left}
        color="#10b981"
      />
      <ThemedHandle
        type="source"
        position={Position.Right}
        color="#10b981"
      />
    </Card>
  );
};