'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, 
  CreditCard, 
  User, 
  Bell,
  Shield,
  Palette,
  Download,
  History,
  Plus,
  Minus,
  Gift,
  X
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { getUserCredits, getCreditHistory, checkAndAddMonthlyCredits } from '@/actions/credit-actions';
import Link from 'next/link';

export default function SettingsPage() {
  const { user } = useUser();
  const [credits, setCredits] = useState(0);
  const [creditHistory, setCreditHistory] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyCreditsReceived, setMonthlyCreditsReceived] = useState(false);

  useEffect(() => {
    if (user) {
      loadCreditData();
    }
  }, [user]);

  const loadCreditData = async () => {
    try {
      // Verificar e adicionar créditos mensais gratuitos primeiro
      const monthlyResult = await checkAndAddMonthlyCredits();
      
      if (monthlyResult) {
        setMonthlyCreditsReceived(true);
        // Esconder notificação após 5 segundos
        setTimeout(() => setMonthlyCreditsReceived(false), 5000);
      }
      
      const [creditsData, historyData] = await Promise.all([
        getUserCredits(),
        getCreditHistory(5) // Últimas 5 transações
      ]);
      setCredits(creditsData);
      setCreditHistory(historyData.transactions || []);
    } catch (error) {
      console.error('Erro ao carregar dados de créditos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="h-full p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Configurações</h1>
          </div>

          {/* Notificação de Créditos Mensais */}
          {monthlyCreditsReceived && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800 dark:text-green-200">
                        🎉 Créditos Mensais Recebidos!
                      </h3>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        Você recebeu 20 créditos gratuitos este mês. Aproveite!
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMonthlyCreditsReceived(false)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Créditos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Meus Créditos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">
                    {loading ? '...' : credits} créditos
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Saldo atual disponível
                  </p>
                </div>
                <Badge 
                  variant={credits > 10 ? "default" : credits > 5 ? "secondary" : "destructive"}
                >
                  {credits > 10 ? "Bom" : credits > 5 ? "Baixo" : "Crítico"}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <Link href="/pricing">
                    <Plus className="h-4 w-4 mr-2" />
                    Comprar Créditos
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="#historico">
                    <History className="h-4 w-4 mr-2" />
                    Histórico
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Créditos */}
          <Card id="historico">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Créditos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div>
                          <div className="w-32 h-4 bg-gray-200 rounded mb-1"></div>
                          <div className="w-24 h-3 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                      <div className="w-16 h-4 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : creditHistory.length > 0 ? (
                <div className="space-y-3">
                  {creditHistory.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.type === 'EARNED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {transaction.type === 'EARNED' ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <span className={`font-medium ${
                        transaction.type === 'EARNED' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'EARNED' ? '+' : '-'}{transaction.amount}
                      </span>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/pricing">
                      Ver Histórico Completo
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                  <Button asChild className="mt-4">
                    <Link href="/pricing">
                      <Plus className="h-4 w-4 mr-2" />
                      Comprar Primeiros Créditos
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configurações da conta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome</label>
                  <p className="text-sm text-muted-foreground">Lucas Silva</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">lucas@exemplo.com</p>
                </div>
              </div>
              <Button variant="outline">
                Editar Perfil
              </Button>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Execuções concluídas</p>
                    <p className="text-sm text-muted-foreground">
                      Receber notificação quando fluxos terminarem
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Limite de créditos</p>
                    <p className="text-sm text-muted-foreground">
                      Avisar quando restarem poucos créditos
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Novidades</p>
                    <p className="text-sm text-muted-foreground">
                      Receber updates sobre novas funcionalidades
                    </p>
                  </div>
                  <input type="checkbox" className="rounded" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Autenticação de dois fatores</p>
                    <p className="text-sm text-muted-foreground">
                      Adicione uma camada extra de segurança
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sessões ativas</p>
                    <p className="text-sm text-muted-foreground">
                      Gerencie dispositivos conectados
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Sessões
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferências */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Preferências
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tema</p>
                    <p className="text-sm text-muted-foreground">
                      Escolha entre claro, escuro ou automático
                    </p>
                  </div>
                  <select className="border rounded px-3 py-1 text-sm">
                    <option>Automático</option>
                    <option>Claro</option>
                    <option>Escuro</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Idioma</p>
                    <p className="text-sm text-muted-foreground">
                      Idioma da interface
                    </p>
                  </div>
                  <select className="border rounded px-3 py-1 text-sm">
                    <option>Português (BR)</option>
                    <option>English</option>
                    <option>Español</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Seus Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Exportar dados</p>
                    <p className="text-sm text-muted-foreground">
                      Baixe uma cópia dos seus fluxos e execuções
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Exportar
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Excluir conta</p>
                    <p className="text-sm text-muted-foreground">
                      Remover permanentemente sua conta e dados
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}