"use client";

import { FlowCanvasProvider } from "@/components/canvas/flow-canvas";
import { updateProject } from "@/actions/project-actions";
import { toast } from "sonner";
import { PromptTemplate, PromptCategory } from "@/types";

interface ProjectEditorProps {
  projectId: string;
  initialData: any;
  templates: PromptTemplate[];
  categories: PromptCategory[];
}

export const ProjectEditor = ({ projectId, initialData, templates, categories }: ProjectEditorProps) => {
  const handleSave = async (nodes: any[], edges: any[]) => {
    try {
      // Preparar dados do canvas para salvamento
      const canvasData = {
        nodes,
        edges,
        lastSaved: new Date().toISOString(),
      };

      // Salvar no banco de dados
      await updateProject(projectId, {
        canvasData,
      });

      toast.success("Projeto salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      toast.error("Erro ao salvar projeto. Tente novamente.");
    }
  };

  const handleExecute = async (nodes: any[], edges: any[]) => {
    // Lógica para executar será implementada
    console.log("Executando projeto:", projectId, { nodes, edges });
  };

  return (
    <FlowCanvasProvider 
      projectId={projectId} 
      initialData={initialData} 
      templates={templates}
      categories={categories}
      onSave={handleSave} 
      onExecute={handleExecute} 
    />
  );
};
