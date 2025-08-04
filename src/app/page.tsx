'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { FlowCanvasProvider } from '@/components/canvas/flow-canvas';
import { toast } from 'sonner';

export default function Home() {
  const handleSaveFlow = (nodes: any[], edges: any[]) => {
    // Aqui seria a lógica para salvar o fluxo
    console.log('Salvando fluxo:', { nodes, edges });
    toast.success('Fluxo salvo com sucesso!');
  };

  const handleExecuteFlow = async (nodes: any[], edges: any[]) => {
    // Aqui seria a lógica para executar o fluxo
    console.log('Executando fluxo:', { nodes, edges });
    toast.success('Fluxo executado com sucesso!');
  };

  return (
    <MainLayout>
      <div className="h-full w-full">
        <FlowCanvasProvider 
          onSave={handleSaveFlow}
          onExecute={handleExecuteFlow}
        />
      </div>
    </MainLayout>
  );
}
