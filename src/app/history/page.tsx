'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  History, 
  Play, 
  Download, 
  Eye, 
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

// Dados de exemplo
const executions = [
  {
    id: '1',
    flowName: 'Paisagem Futurista',
    status: 'completed',
    createdAt: new Date('2024-01-15T10:30:00'),
    completedAt: new Date('2024-01-15T10:32:30'),
    creditsUsed: 3,
    outputCount: 3,
    outputs: [
      'https://via.placeholder.com/150x150/8b5cf6/ffffff?text=1',
      'https://via.placeholder.com/150x150/06b6d4/ffffff?text=2',
      'https://via.placeholder.com/150x150/10b981/ffffff?text=3',
    ]
  },
  {
    id: '2',
    flowName: 'Retrato Artístico',
    status: 'running',
    createdAt: new Date('2024-01-15T11:00:00'),
    creditsUsed: 1,
    outputCount: 0,
    outputs: []
  },
  {
    id: '3',
    flowName: 'Logo Minimalista',
    status: 'failed',
    createdAt: new Date('2024-01-15T09:15:00'),
    creditsUsed: 2,
    outputCount: 0,
    outputs: [],
    error: 'Erro na geração: prompt muito vago'
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'running':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Concluído';
    case 'running':
      return 'Executando';
    case 'failed':
      return 'Falhou';
    default:
      return 'Pendente';
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'running':
      return 'secondary';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function HistoryPage() {
  return (
    <MainLayout>
      <div className="h-full p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <History className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Histórico de Execuções</h1>
          </div>

          {/* Lista de execuções */}
          <div className="space-y-4">
            {executions.map((execution) => (
              <Card key={execution.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{execution.flowName}</CardTitle>
                    <Badge variant={getStatusVariant(execution.status) as any}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(execution.status)}
                        {getStatusText(execution.status)}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Informações da execução */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Iniciado em:</span>
                      <p className="font-medium">
                        {execution.createdAt.toLocaleDateString('pt-BR')} às{' '}
                        {execution.createdAt.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    
                    {execution.completedAt && (
                      <div>
                        <span className="text-muted-foreground">Concluído em:</span>
                        <p className="font-medium">
                          {execution.completedAt.toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-muted-foreground">Créditos usados:</span>
                      <p className="font-medium">{execution.creditsUsed}</p>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Outputs:</span>
                      <p className="font-medium">{execution.outputCount}</p>
                    </div>
                  </div>

                  {/* Erro (se houver) */}
                  {execution.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-700">{execution.error}</p>
                    </div>
                  )}

                  {/* Preview dos outputs */}
                  {execution.outputs.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Resultados:</span>
                      <div className="flex gap-2 overflow-x-auto">
                        {execution.outputs.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Output ${index + 1}`}
                            className="w-16 h-16 object-cover rounded border flex-shrink-0"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      Ver Detalhes
                    </Button>
                    
                    {execution.status === 'completed' && (
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Baixar Tudo
                      </Button>
                    )}
                    
                    {execution.status === 'failed' && (
                      <Button size="sm" variant="outline">
                        <Play className="h-3 w-3 mr-1" />
                        Executar Novamente
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Estado vazio */}
          {executions.length === 0 && (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">Nenhuma execução encontrada</h3>
              <p className="text-muted-foreground">
                Execute seu primeiro fluxo para ver o histórico aqui.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}