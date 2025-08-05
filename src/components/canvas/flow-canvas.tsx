"use client";

import { useCallback, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
  NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { DragItem } from "@/types";
import { PromptNode } from "./nodes/prompt-node";
import { UploadNode } from "./nodes/upload-node";
import { ParametersNode } from "./nodes/parameters-node";
import { OutputNode } from "./nodes/output-node";
import { UploadPromptNode } from "./nodes/upload-prompt-node";
import { ResultPromptNode } from "./nodes/result-prompt-node";
import { CustomConnectionLine } from "./custom-connection-line";

const nodeTypes = {
  prompt: PromptNode,
  upload: UploadNode,
  parameters: ParametersNode,
  output: OutputNode,
  "upload-prompt": UploadPromptNode,
  "result-prompt": ResultPromptNode,
};

// Nós iniciais de exemplo - demonstrando a dinâmica de cadeia
const initialNodes: Node[] = [
  {
    id: "1",
    type: "upload-prompt",
    position: { x: 100, y: 100 },
    data: {
      label: "Upload + Prompt",
      imageUrl: "",
      prompt: "Transforme esta imagem em estilo anime",
    },
  },
  {
    id: "2",
    type: "parameters",
    position: { x: 500, y: 100 },
    data: {
      label: "Parâmetros IA",
      parameters: {
        model: "DALL-E 3",
        style: "Anime",
        resolution: "1024x1024",
      },
    },
  },
  {
    id: "3",
    type: "output",
    position: { x: 900, y: 100 },
    data: {
      label: "Resultado 1",
      outputs: ["https://via.placeholder.com/300x300/8b5cf6/ffffff?text=Resultado+1"],
    },
  },
  {
    id: "4",
    type: "result-prompt",
    position: { x: 500, y: 400 },
    data: {
      label: "Continuar Editando",
      prompt: "Adicione efeitos de luz neon",
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    type: "default",
    animated: true,
    style: { 
      strokeWidth: 3,
      stroke: "hsl(var(--primary))",
    },
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    type: "default",
    animated: true,
    style: { 
      strokeWidth: 3,
      stroke: "hsl(var(--primary))",
    },
  },
  {
    id: "e3-4",
    source: "3",
    target: "4",
    type: "default",
    animated: true,
    style: { 
      strokeWidth: 3,
      stroke: "hsl(var(--primary))",
    },
  },
];

interface FlowCanvasProps {
  projectId?: string;
  initialData?: any;
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onExecute?: (nodes: Node[], edges: Edge[]) => void;
}

export const FlowCanvas = ({ projectId, initialData, onSave, onExecute }: FlowCanvasProps) => {
  // Usar dados iniciais se fornecidos, senão usar os padrões
  const startingNodes = initialData?.nodes || initialNodes;
  const startingEdges = initialData?.edges || initialEdges;

  const [nodes, setNodes, onNodesChange] = useNodesState(startingNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(startingEdges);
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Função para lidar com mudanças nos nós (apenas local, sem persistência automática)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  // Função para validar se dois nodes podem se conectar
  const isValidConnection = useCallback((connection: Connection) => {
    // Por enquanto, permitir todas as conexões para testar
    return true;

    // const sourceNode = nodes.find(node => node.id === connection.source);
    // const targetNode = nodes.find(node => node.id === connection.target);

    // if (!sourceNode || !targetNode) return false;

    // // Regras de conexão baseadas nos tipos de nodes
    // const validConnections: Record<string, string[]> = {
    //   'prompt': ['parameters', 'output'],
    //   'upload': ['parameters', 'upload-prompt'],
    //   'upload-prompt': ['parameters', 'output'],
    //   'parameters': ['output'],
    //   'output': ['result-prompt'],
    //   'result-prompt': ['parameters', 'output']
    // };

    // const allowedTargets = validConnections[sourceNode.type || ''] || [];
    // return allowedTargets.includes(targetNode.type || '');
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!isValidConnection(params)) {
        return;
      }

      setIsConnecting(true);

      // Verificar se os nós existem localmente
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode) {
        setIsConnecting(false);
        return;
      }

      // Criar edge com propriedades completas (apenas local, sem persistência automática)
      const newEdge: Edge = {
        id: `reactflow__edge-${params.source}-${params.target}`,
        source: params.source!,
        target: params.target!,
        sourceHandle: params.sourceHandle || null,
        targetHandle: params.targetHandle || null,
        type: "default",
        animated: true,
        style: {
          strokeWidth: 3,
          stroke: "hsl(var(--primary))",
        },
      };

      // Adicionar localmente
      setEdges((eds) => [...eds, newEdge]);

      setIsConnecting(false);
    },
    [setEdges, isValidConnection, nodes]
  );

  // Função para deletar nós (apenas local, sem persistência automática)
  const onNodesDelete = useCallback((deleted: Node[]) => {
    // Deletar apenas localmente, persistência será feita no botão Salvar
  }, []);

  // Função para deletar edges (apenas local, sem persistência automática)
  const onEdgesDelete = useCallback((deleted: Edge[]) => {
    // Deletar apenas localmente, persistência será feita no botão Salvar
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const dragData = event.dataTransfer.getData("application/json");

      if (!dragData) return;

      try {
        const dragItem: DragItem = JSON.parse(dragData);

        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newNode: Node = {
          id: `${dragItem.type}-${Date.now()}`,
          type: dragItem.type,
          position,
          data: {
            label: dragItem.data.label || dragItem.type,
            ...dragItem.data,
          },
        };

        setNodes((nds) => nds.concat(newNode));
      } catch (error) {
        console.error("Erro ao processar item arrastado:", error);
      }
    },
    [screenToFlowPosition, setNodes]
  );

  const handleSave = useCallback(() => {
    onSave?.(nodes, edges);
  }, [nodes, edges, onSave]);

  const handleExecute = useCallback(async () => {
    setIsExecuting(true);
    try {
      await onExecute?.(nodes, edges);
    } finally {
      setIsExecuting(false);
    }
  }, [nodes, edges, onExecute]);

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper} onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        defaultEdgeOptions={{
          animated: true,
          style: { 
            strokeWidth: 3,
            stroke: "hsl(var(--primary))",
          },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--muted-foreground))" />
        <Controls showZoom={true} showFitView={true} showInteractive={true} />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case "prompt":
                return "#8b5cf6";
              case "upload":
                return "#06b6d4";
              case "parameters":
                return "#10b981";
              case "output":
                return "#f59e0b";
              case "upload-prompt":
                return "#f97316";
              case "result-prompt":
                return "#059669";
              default:
                return "#6b7280";
            }
          }}
          maskColor="hsl(var(--primary) / 0.1)"
          maskStrokeColor="hsl(var(--primary))"
          maskStrokeWidth={2}
        />
      </ReactFlow>

      {/* Toolbar flutuante */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Salvar
        </button>
        <button
          onClick={handleExecute}
          disabled={isExecuting}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {isExecuting ? "Executando..." : "Executar"}
        </button>
      </div>
    </div>
  );
};

// Wrapper com Provider
export const FlowCanvasProvider = (props: FlowCanvasProps) => {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  );
};
