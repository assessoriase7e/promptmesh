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
  ConnectionMode,
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
import { createEdge, deleteEdge } from "@/actions";
import { updateNode } from "@/actions/node-actions";

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
    position: { x: 50, y: 100 },
    data: {
      label: "Upload + Prompt",
      imageUrl: "",
      prompt: "Transforme esta imagem em estilo anime",
    },
  },
  {
    id: "2",
    type: "parameters",
    position: { x: 400, y: 100 },
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
    position: { x: 750, y: 100 },
    data: {
      label: "Resultado 1",
      outputs: ["https://via.placeholder.com/300x300/8b5cf6/ffffff?text=Resultado+1"],
    },
  },
  {
    id: "4",
    type: "result-prompt",
    position: { x: 400, y: 300 },
    data: {
      label: "Continuar Editando",
      prompt: "Adicione efeitos de luz neon",
    },
  },
  {
    id: "5",
    type: "parameters",
    position: { x: 750, y: 300 },
    data: {
      label: "Parâmetros 2",
      parameters: {
        model: "DALL-E 3",
        style: "Cyberpunk",
        resolution: "1024x1024",
      },
    },
  },
  {
    id: "6",
    type: "output",
    position: { x: 1100, y: 300 },
    data: {
      label: "Resultado Final",
      outputs: [],
    },
  },
];

const initialEdges: Edge[] = [];

interface FlowCanvasProps {
  projectId?: string;
  initialData?: any;
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onExecute?: (nodes: Node[], edges: Edge[]) => void;
}

export const FlowCanvas = ({ projectId, initialData, onSave, onExecute }: FlowCanvasProps) => {
  console.log("FlowCanvas renderizado!", { projectId, hasOnSave: !!onSave, hasOnExecute: !!onExecute });

  // Usar dados iniciais se fornecidos, senão usar os padrões
  const startingNodes = initialData?.nodes || initialNodes;
  const startingEdges = initialData?.edges || initialEdges;

  const [nodes, setNodes, onNodesChange] = useNodesState(startingNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(startingEdges);

  console.log("Estado atual das edges:", edges);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Função customizada para lidar com mudanças nos nós
  const handleNodesChange = useCallback(
    async (changes: NodeChange[]) => {
      console.log("handleNodesChange chamada!", changes);
      onNodesChange(changes);

      // Persistir mudanças de posição se temos projectId
      if (projectId) {
        console.log("ProjectId encontrado:", projectId);
        const positionChanges = changes.filter(
          (
            change
          ): change is NodeChange & {
            type: "position";
            id: string;
            position: { x: number; y: number };
            dragging?: boolean;
          } =>
            change.type === "position" &&
            "position" in change &&
            change.position !== undefined &&
            !("dragging" in change && change.dragging)
        );

        if (positionChanges.length > 0) {
          try {
            await Promise.all(
              positionChanges.map((change) =>
                updateNode(change.id, {
                  position: change.position,
                })
              )
            );
            console.log(`Posições salvas para ${positionChanges.length} nós`);
          } catch (error) {
            console.error("Erro ao salvar posições dos nós:", error);
          }
        }
      }
    },
    [onNodesChange, projectId]
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
    async (params: Connection) => {
      console.log("onConnect chamada!", params);

      if (!isValidConnection(params)) {
        console.warn("Conexão inválida entre esses tipos de nodes");
        return;
      }

      setIsConnecting(true);

      try {
        // Se temos um projectId, persistir no banco
        if (projectId && params.source && params.target) {
          await createEdge({
            projectId,
            sourceNodeId: params.source,
            targetNodeId: params.target,
            sourceHandle: params.sourceHandle || undefined,
            targetHandle: params.targetHandle || undefined,
            animated: true,
          });
        }

        // Adicionar localmente
        console.log("Adicionando edge ao estado local...", params);
        setEdges((eds) => {
          const newEdges = addEdge(params, eds);
          console.log("Edges antes:", eds);
          console.log("Edges depois:", newEdges);
          return newEdges;
        });
      } catch (error) {
        console.error("Erro ao criar conexão:", error);
      } finally {
        setIsConnecting(false);
      }
    },
    [setEdges, projectId, isValidConnection]
  );

  // Função para deletar nós
  const onNodesDelete = useCallback((deleted: Node[]) => {
    console.log(
      "Nós deletados:",
      deleted.map((n) => n.data.label || n.id)
    );
  }, []);

  // Função para deletar edges
  const onEdgesDelete = useCallback(
    async (deleted: Edge[]) => {
      console.log(
        "Conexões deletadas:",
        deleted.map((e) => e.id)
      );

      // Se temos projectId, deletar do banco também
      if (projectId) {
        try {
          for (const edge of deleted) {
            await deleteEdge(edge.id);
          }
        } catch (error) {
          console.error("Erro ao deletar conexões:", error);
        }
      }
    },
    [projectId]
  );

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
    console.log("Botão Salvar clicado!", { nodes: nodes.length, edges: edges.length });
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
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        snapToGrid={true}
        snapGrid={[15, 15]}
        fitView
        deleteKeyCode="Delete"
        colorMode="system"
        defaultEdgeOptions={{
          animated: true,
          style: { strokeWidth: 2 },
        }}
        connectionLineStyle={{
          strokeWidth: 3,
          stroke: "hsl(var(--primary))",
          strokeDasharray: "5,5",
        }}
        connectionRadius={25}
        connectOnClick={false}
        nodesConnectable={true}
        nodesDraggable={true}
        panOnDrag={[1, 2]}
        zoomOnScroll={true}
        zoomOnPinch={true}
        isValidConnection={isValidConnection}
        onConnectStart={() => setIsConnecting(true)}
        onConnectEnd={() => setIsConnecting(false)}
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
