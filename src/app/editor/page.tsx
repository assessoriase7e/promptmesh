'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Paintbrush, 
  Upload, 
  Wand2, 
  Layers,
  Palette,
  Sparkles
} from 'lucide-react';

export default function EditorPage() {
  return (
    <MainLayout>
      <div className="h-full p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Paintbrush className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Editor Visual com IA</h1>
          </div>

          {/* Coming Soon */}
          <Card className="text-center py-12">
            <CardContent className="space-y-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Em Breve!</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  O Editor Visual com IA está sendo desenvolvido e estará disponível em breve. 
                  Você poderá editar e retocar imagens com ferramentas avançadas de IA.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="p-4 border rounded-lg">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <h3 className="font-medium mb-1">Upload Inteligente</h3>
                  <p className="text-sm text-muted-foreground">
                    Carregue imagens e aplique filtros automaticamente
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <Wand2 className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <h3 className="font-medium mb-1">Retoque com IA</h3>
                  <p className="text-sm text-muted-foreground">
                    Remova objetos, mude fundos e aplique estilos
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <Layers className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <h3 className="font-medium mb-1">Camadas Avançadas</h3>
                  <p className="text-sm text-muted-foreground">
                    Sistema de camadas profissional com blend modes
                  </p>
                </div>
              </div>

              <Button size="lg" disabled>
                <Palette className="h-4 w-4 mr-2" />
                Aguarde o Lançamento
              </Button>
            </CardContent>
          </Card>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Funcionalidades Planejadas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    Remoção inteligente de objetos
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    Troca de fundos com IA
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    Aplicação de estilos artísticos
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    Upscaling de imagens
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    Correção automática de cores
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    Geração de variações
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Integração com Canvas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  O Editor Visual será totalmente integrado com o Canvas de fluxos, 
                  permitindo que você use imagens editadas diretamente nos seus fluxos de IA.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Sincronização automática
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Histórico de edições
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Exportação para fluxos
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}