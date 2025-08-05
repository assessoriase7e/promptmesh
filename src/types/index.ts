// Tipos principais do PromptMesh
import { 
  User as PrismaUser, 
  Plan as PrismaPlan, 
  Project as PrismaProject,
  Node as PrismaNode,
  Edge as PrismaEdge,
  Execution as PrismaExecution,
  NodeExecution as PrismaNodeExecution,
  Template as PrismaTemplate,
  File as PrismaFile,
  NodeType,
  ExecutionStatus
} from '@prisma/client'

// Re-exportar tipos do Prisma
export type { 
  NodeType, 
  ExecutionStatus,
  PrismaUser,
  PrismaPlan,
  PrismaProject,
  PrismaNode,
  PrismaEdge,
  PrismaExecution,
  PrismaNodeExecution,
  PrismaTemplate,
  PrismaFile
}

// Tipos estendidos com relacionamentos
export type UserWithPlan = PrismaUser & {
  plan: PrismaPlan | null
}

export type ProjectWithNodes = PrismaProject & {
  nodes: PrismaNode[]
  edges: PrismaEdge[]
  user: PrismaUser
}

export type ExecutionWithDetails = PrismaExecution & {
  user: PrismaUser
  project: PrismaProject
  nodeExecutions: PrismaNodeExecution[]
}

// Tipos legados (manter compatibilidade)
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: UserPlan;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  isActive: boolean;
}

export interface FlowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: FlowNodeData;
  selected?: boolean;
  width?: number;
  height?: number;
  sourcePosition?: any;
  targetPosition?: any;
  dragHandle?: string;
  parentId?: string;
}

export interface FlowNodeData {
  label: string;
  prompt?: string;
  imageUrl?: string;
  parameters?: AIParameters;
  isIterative?: boolean;
  loopCount?: number;
  outputs?: string[];
}

export interface AIParameters {
  model: string;
  style: string;
  resolution: string;
  camera?: string;
  seed?: number;
  steps?: number;
  guidance?: number;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
}

export interface Flow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  isTemplate?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlowExecution {
  id: string;
  flowId: string;
  userId: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  currentNodeId?: string;
  outputs: string[];
  creditsUsed: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface UploadedFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  isActive?: boolean;
}

export interface CanvasState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeId?: string;
  isExecuting: boolean;
  executionProgress: number;
}

export interface DragItem {
  type: string;
  data: any;
}

export interface PromptTemplate {
  id: string;
  name: string;
  prompt: string;
  categoryId: string;
  tags: string[];
  usageCount: number;
  isOfficial: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
}
