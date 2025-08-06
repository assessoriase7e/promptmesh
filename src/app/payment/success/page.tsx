import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCheckoutSession } from '@/actions/payment-actions'
import { getUserCredits } from '@/actions/credit-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Coins, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface PaymentSuccessPageProps {
  searchParams: Promise<{
    session_id?: string
  }>
}

export default async function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
  const { session_id } = await searchParams

  if (!session_id) {
    redirect('/pricing')
  }

  const session = await getCheckoutSession(session_id)
  
  if (!session || session.payment_status !== 'paid') {
    redirect('/pricing')
  }

  const credits = await getUserCredits()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          {/* Success Icon */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-green-800 dark:text-green-200">
              Pagamento Realizado com Sucesso!
            </h1>
            <p className="mt-2 text-green-600 dark:text-green-300">
              Seus créditos foram adicionados à sua conta
            </p>
          </div>

          {/* Payment Details */}
          <Card className="mb-8 border-green-200 dark:border-green-800">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Coins className="h-5 w-5 text-green-600" />
                Detalhes da Compra
              </CardTitle>
              <CardDescription>
                Transação processada com segurança pelo Stripe
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-4 text-center">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {session.metadata?.credits || 'N/A'}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Créditos Adquiridos
                  </div>
                </div>
                
                <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-4 text-center">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format((session.amount_total || 0) / 100)}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Valor Pago
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Saldo Atual:</span>
                  <div className="flex items-center gap-1 font-bold text-green-600">
                    <Coins className="h-4 w-4" />
                    {credits} créditos
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>ID da Transação: {session.id}</p>
                <p>Status: {session.payment_status === 'paid' ? 'Pago' : 'Pendente'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos Passos</CardTitle>
              <CardDescription>
                Agora você pode usar seus créditos para criar conteúdo incrível
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button asChild className="h-auto flex-col gap-2 p-6">
                  <Link href="/projects/new">
                    <div className="text-lg font-semibold">Criar Projeto</div>
                    <div className="text-sm opacity-90">
                      Comece um novo fluxo de geração
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="h-auto flex-col gap-2 p-6">
                  <Link href="/history">
                    <div className="text-lg font-semibold">Ver Histórico</div>
                    <div className="text-sm opacity-90">
                      Acompanhe o uso dos seus créditos
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Precisa de ajuda? Entre em contato conosco pelo{' '}
              <Link href="/support" className="text-primary hover:underline">
                suporte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}