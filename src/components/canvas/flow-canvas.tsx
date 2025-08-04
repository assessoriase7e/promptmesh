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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { DragItem } from "@/types";
import { PromptNode } from "./nodes/prompt-node";
import { UploadNode } from "./nodes/upload-node";
import { ParametersNode } from "./nodes/parameters-node";
import { OutputNode } from "./nodes/output-node";
import { UploadPromptNode } from "./nodes/upload-prompt-node";
import { ResultPromptNode } from "./nodes/result-prompt-node";

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

const initialEdges: Edge[] = [
  // Primeira cadeia: Upload+Prompt → Parameters → Output
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true,
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    animated: true,
  },
  // Conexão do resultado para continuar a cadeia
  {
    id: "e3-4",
    source: "3",
    target: "4",
    animated: true,
    style: { stroke: "#059669", strokeWidth: 2 },
  },
  // Segunda cadeia: ResultPrompt → Parameters → Output
  {
    id: "e4-5",
    source: "4",
    target: "5",
    animated: true,
  },
  {
    id: "e5-6",
    source: "5",
    target: "6",
    animated: true,
  },
];

interface FlowCanvasProps {
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onExecute?: (nodes: Node[], edges: Edge[]) => void;
}

export const FlowCanvas = ({ onSave, onExecute }: FlowCanvasProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isExecuting, setIsExecuting] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // Função para deletar nós
  const onNodesDelete = useCallback((deleted: Node[]) => {
    console.log(
      "Nós deletados:",
      deleted.map((n) => n.data.label || n.id)
    );
  }, []);

  // Função para deletar edges
  const onEdgesDelete = useCallback((deleted: Edge[]) => {
    console.log(
      "Conexões deletadas:",
      deleted.map((e) => e.id)
    );
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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode="Delete"
        colorMode="system"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="hsl(var(--muted-foreground))"
        />
        <Controls 
          showZoom={true}
          showFitView={true}
          showInteractive={true}
        />
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
