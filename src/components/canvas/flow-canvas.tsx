"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
  NodeChange,
  EdgeChange,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { DragItem, PromptTemplate, PromptCategory } from "@/types";
import { useUndoRedo } from "@/hooks/use-undo-redo";
import { Button } from "@/components/ui/button";
import { Save, Play, Loader2 } from "lucide-react";
import { FloatingMenu } from "./floating-menu";
import { PromptNode } from "./nodes/prompt-node";
import { UploadNode } from "./nodes/upload-node";
import { ParametersNode } from "./nodes/parameters-node";
import { OutputNode } from "./nodes/output-node";
import { UploadPromptNode } from "./nodes/upload-prompt-node";
import { ResultPromptNode } from "./nodes/result-prompt-node";
import { PromptProvider } from "@/contexts/prompt-context";

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
  templates?: PromptTemplate[];
  categories?: PromptCategory[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onExecute?: (nodes: Node[], edges: Edge[]) => void;
}

export const FlowCanvas = ({
  projectId,
  initialData,
  templates = [],
  categories = [],
  onSave,
  onExecute,
}: FlowCanvasProps) => {
  // Usar dados iniciais se fornecidos, senão usar os padrões
  const startingNodes = initialData?.nodes || initialNodes;
  const startingEdges = initialData?.edges || initialEdges;

  const [nodes, setNodes, onNodesChange] = useNodesState(startingNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(startingEdges);

  const [isExecuting, setIsExecuting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Hook para undo/redo
  const { undo, redo, saveState, canUndo, canRedo } = useUndoRedo(projectId);
  const lastSaveTime = useRef<number>(0);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null);

  // Função para salvar estado com debounce
  const debouncedSaveState = useCallback(
    (nodes: Node[], edges: Edge[], delay = 500) => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }

      saveTimeout.current = setTimeout(() => {
        const now = Date.now();
        // Evitar salvar muito frequentemente (mínimo 300ms entre saves)
        if (now - lastSaveTime.current > 300) {
          saveState(nodes, edges);
          lastSaveTime.current = now;
        }
      }, delay);
    },
    [saveState]
  );

  // Função para salvar projeto
  const handleSave = useCallback(
    async (isAutoSave = false) => {
      if (isSaving) return; // Evitar múltiplos saves simultâneos

      setIsSaving(true);
      try {
        await onSave?.(nodes, edges);
        if (!isAutoSave) {
          // Mostrar feedback visual apenas para save manual
          console.log("Projeto salvo com sucesso!");
        }
      } catch (error) {
        console.error("Erro ao salvar:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [nodes, edges, onSave, isSaving]
  );

  // Salvar estado inicial
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      saveState(nodes, edges);
    }
  }, []); // Apenas na montagem

  // Auto save a cada 5 minutos
  useEffect(() => {
    if (onSave) {
      autoSaveInterval.current = setInterval(() => {
        handleSave(true); // isAutoSave = true
      }, 5 * 60 * 1000); // 5 minutos

      return () => {
        if (autoSaveInterval.current) {
          clearInterval(autoSaveInterval.current);
        }
      };
    }
  }, [handleSave, onSave]);

  // Função para lidar com mudanças nos nós (apenas local, sem persistência automática)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      // Verificar se houve mudanças significativas que requerem salvar estado
      const hasSignificantChanges = changes.some(
        (change) =>
          change.type === "remove" ||
          change.type === "add" ||
          (change.type === "position" && "dragging" in change && !change.dragging) // Salvar apenas quando parar de arrastar
      );

      if (hasSignificantChanges) {
        // Usar setTimeout para garantir que o estado foi atualizado
        setTimeout(() => {
          const isPositionChange = changes.some((c) => c.type === "position");
          debouncedSaveState(nodes, edges, isPositionChange ? 100 : 0);
        }, 10);
      }

      // Atualizar seleção de nodes
      const selectedNodeIds = changes
        .filter((change) => change.type === "select" && change.selected && "id" in change)
        .map((change) => (change as any).id);

      if (selectedNodeIds.length > 0) {
        setSelectedNodes(selectedNodeIds);
      } else {
        // Verificar se algum node foi desselecionado
        const deselectedNodeIds = changes
          .filter((change) => change.type === "select" && !change.selected && "id" in change)
          .map((change) => (change as any).id);

        if (deselectedNodeIds.length > 0) {
          setSelectedNodes((prev) => prev.filter((id) => !deselectedNodeIds.includes(id)));
        }
      }
    },
    [onNodesChange, debouncedSaveState, nodes, edges]
  );

  // Função para lidar com mudanças nas edges
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);

      // Verificar se houve mudanças significativas que requerem salvar estado
      const hasSignificantChanges = changes.some((change) => change.type === "remove" || change.type === "add");

      if (hasSignificantChanges) {
        // Usar setTimeout para garantir que o estado foi atualizado
        setTimeout(() => {
          debouncedSaveState(nodes, edges, 0);
        }, 10);
      }

      // Atualizar seleção de edges
      const selectedEdgeIds = changes
        .filter((change) => change.type === "select" && change.selected && "id" in change)
        .map((change) => (change as any).id);

      if (selectedEdgeIds.length > 0) {
        setSelectedEdges(selectedEdgeIds);
      } else {
        // Verificar se alguma edge foi desselecionada
        const deselectedEdgeIds = changes
          .filter((change) => change.type === "select" && !change.selected && "id" in change)
          .map((change) => (change as any).id);

        if (deselectedEdgeIds.length > 0) {
          setSelectedEdges((prev) => prev.filter((id) => !deselectedEdgeIds.includes(id)));
        }
      }
    },
    [onEdgesChange, debouncedSaveState, nodes, edges]
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
      setEdges((eds) => {
        const newEdges = addEdge(newEdge, eds);
        // Salvar estado após adicionar edge
        setTimeout(() => {
          debouncedSaveState(nodes, newEdges, 0);
        }, 10);
        return newEdges;
      });

      setIsConnecting(false);
    },
    [setEdges, isValidConnection, nodes, debouncedSaveState]
  );

  // Função para deletar elementos selecionados
  const deleteSelectedElements = useCallback(() => {
    let shouldSaveState = false;

    if (selectedNodes.length > 0) {
      setNodes((nds) => nds.filter((node) => !selectedNodes.includes(node.id)));
      // Também remover edges conectadas aos nodes deletados
      setEdges((eds) =>
        eds.filter((edge) => !selectedNodes.includes(edge.source) && !selectedNodes.includes(edge.target))
      );
      setSelectedNodes([]);
      shouldSaveState = true;
    }

    if (selectedEdges.length > 0) {
      setEdges((eds) => eds.filter((edge) => !selectedEdges.includes(edge.id)));
      setSelectedEdges([]);
      shouldSaveState = true;
    }

    if (shouldSaveState) {
      // Salvar estado após deletar elementos
      setTimeout(() => {
        debouncedSaveState(nodes, edges, 0);
      }, 10);
    }
  }, [selectedNodes, selectedEdges, setNodes, setEdges, debouncedSaveState, nodes, edges]);

  // Funções de undo/redo
  const handleUndo = useCallback(() => {
    const state = undo();
    if (state) {
      setNodes(state.nodes);
      setEdges(state.edges);
      setSelectedNodes([]);
      setSelectedEdges([]);
    }
  }, [undo, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    const state = redo();
    if (state) {
      setNodes(state.nodes);
      setEdges(state.edges);
      setSelectedNodes([]);
      setSelectedEdges([]);
    }
  }, [redo, setNodes, setEdges]);

  // Função para executar node selecionado
  const handleExecuteSelectedNode = useCallback(async () => {
    if (selectedNodes.length === 0) {
      console.log("Nenhum card selecionado para executar");
      return;
    }

    if (selectedNodes.length > 1) {
      console.log("Selecione apenas um card para executar");
      return;
    }

    const selectedNodeId = selectedNodes[0];
    const selectedNode = nodes.find((node) => node.id === selectedNodeId);

    if (!selectedNode) return;

    console.log(`Executando card: ${selectedNode.data.label || selectedNode.type}`);
    // Aqui você pode implementar a lógica específica para executar um node
    // Por exemplo, chamar uma função específica baseada no tipo do node
  }, [selectedNodes, nodes]);

  // Função para selecionar todos os nodes
  const handleSelectAll = useCallback(() => {
    const allNodeIds = nodes.map((node) => node.id);
    setNodes((nodes) => nodes.map((node) => ({ ...node, selected: true })));
    setSelectedNodes(allNodeIds);
    console.log(`Selecionados ${allNodeIds.length} cards`);
  }, [nodes, setNodes]);

  // Função para executar fluxo completo
  const handleExecute = useCallback(async () => {
    setIsExecuting(true);
    try {
      await onExecute?.(nodes, edges);
    } finally {
      setIsExecuting(false);
    }
  }, [nodes, edges, onExecute]);

  // Handler para teclas de atalho
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Verificar se não estamos em um input ou textarea
      const target = event.target as HTMLElement;
      const isInputElement =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true";

      if (isInputElement) return;

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelectedElements();
      } else if (event.ctrlKey || event.metaKey) {
        if (event.key === "z" && !event.shiftKey) {
          event.preventDefault();
          handleUndo();
        } else if (event.key === "y" || (event.key === "z" && event.shiftKey)) {
          event.preventDefault();
          handleRedo();
        } else if (event.key === "s") {
          event.preventDefault();
          handleSave(false); // Save manual
        } else if (event.key === "q") {
          event.preventDefault();
          handleExecuteSelectedNode(); // Executar card selecionado
        } else if (event.key === "f") {
          event.preventDefault();
          handleExecute(); // Executar fluxo completo
        } else if (event.key === "a") {
          event.preventDefault();
          handleSelectAll(); // Selecionar todos os cards
        }
      }
    },
    [
      deleteSelectedElements,
      handleUndo,
      handleRedo,
      handleSave,
      handleExecuteSelectedNode,
      handleExecute,
      handleSelectAll,
    ]
  );

  // Adicionar listener de teclado
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

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

        setNodes((nds) => {
          const newNodes = nds.concat(newNode);
          // Salvar estado após adicionar node
          setTimeout(() => {
            debouncedSaveState(newNodes, edges, 0);
          }, 10);
          return newNodes;
        });
      } catch (error) {
        console.error("Erro ao processar item arrastado:", error);
      }
    },
    [screenToFlowPosition, setNodes, debouncedSaveState, edges]
  );

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper} onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        multiSelectionKeyCode="Shift"
        deleteKeyCode="Delete"
        selectionOnDrag={true}
        panOnDrag={[1, 2]}
        selectNodesOnDrag={false}
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

      {/* Menu flutuante - canto superior esquerdo */}
      <FloatingMenu className="absolute top-4 left-4 z-10" />

      {/* Toolbar flutuante */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button onClick={() => handleSave(false)} disabled={isSaving} size="sm" className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
        <Button onClick={handleExecute} disabled={isExecuting} size="sm" variant="secondary" className="gap-2">
          {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {isExecuting ? "Executando..." : "Executar"}
        </Button>
      </div>
    </div>
  );
};

// Wrapper com Provider
export const FlowCanvasProvider = (props: FlowCanvasProps) => {
  const { templates = [], categories = [], ...flowProps } = props;

  return (
    <ReactFlowProvider>
      <PromptProvider templates={templates} categories={categories}>
        <FlowCanvas {...flowProps} />
      </PromptProvider>
    </ReactFlowProvider>
  );
};
