import { z } from 'zod';

export const aiParametersSchema = z.object({
  model: z.string().min(1, 'Modelo é obrigatório'),
  style: z.string().min(1, 'Estilo é obrigatório'),
  resolution: z.string().min(1, 'Resolução é obrigatória'),
  camera: z.string().optional(),
  seed: z.number().min(0).max(999999).optional(),
  steps: z.number().min(1).max(100).optional(),
  guidance: z.number().min(1).max(20).optional(),
});

export const flowNodeDataSchema = z.object({
  label: z.string().min(1, 'Label é obrigatório'),
  prompt: z.string().optional(),
  imageUrl: z.string().url().optional(),
  parameters: aiParametersSchema.optional(),
  isIterative: z.boolean().optional(),
  loopCount: z.number().min(1).max(10).optional(),
  outputs: z.array(z.string()).optional(),
});

export const flowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['prompt', 'upload', 'parameters', 'output']),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: flowNodeDataSchema,
  selected: z.boolean().optional(),
});

export const flowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
  animated: z.boolean().optional(),
});

export const flowSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome do fluxo é obrigatório'),
  description: z.string().optional(),
  nodes: z.array(flowNodeSchema),
  edges: z.array(flowEdgeSchema),
  isTemplate: z.boolean().optional(),
});

export const createFlowSchema = flowSchema.omit({ id: true });
export const updateFlowSchema = flowSchema.partial();

export type AIParametersInput = z.infer<typeof aiParametersSchema>;
export type FlowNodeDataInput = z.infer<typeof flowNodeDataSchema>;
export type FlowNodeInput = z.infer<typeof flowNodeSchema>;
export type FlowEdgeInput = z.infer<typeof flowEdgeSchema>;
export type FlowInput = z.infer<typeof flowSchema>;
export type CreateFlowInput = z.infer<typeof createFlowSchema>;
export type UpdateFlowInput = z.infer<typeof updateFlowSchema>;