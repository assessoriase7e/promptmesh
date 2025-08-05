'use client';

import { FlowCanvasProvider } from '@/components/canvas/flow-canvas';

interface ProjectEditorProps {
  projectId: string;
  initialData: any;
}

export const ProjectEditor = ({ projectId, initialData }: ProjectEditorProps) => {
  const handleSave = async (nodes: any[], edges: any[]) => {
    // Lógica para salvar será implementada
    console.log('Salvando projeto:', projectId, { nodes, edges });
  };

  const handleExecute = async (nodes: any[], edges: any[]) => {
    // Lógica para executar será implementada
    console.log('Executando projeto:', projectId, { nodes, edges });
  };

  return (
    <FlowCanvasProvider 
      projectId={projectId}
      initialData={initialData}
      onSave={handleSave}
      onExecute={handleExecute}
    />
  );
};