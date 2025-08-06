import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { getUserCredits } from '@/actions/credit-actions'
import { getAvailablePlans } from '@/actions/payment-actions'
import { PricingCards } from '@/components/pricing/pricing-cards'
import { CreditBalance } from '@/components/pricing/credit-balance'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Coins } from 'lucide-react'
import Link from 'next/link'

export default async function PricingPage() {
  const { userId } = await auth()
  
  const [credits, plans] = await Promise.all([
    userId ? getUserCredits() : 0,
    getAvailablePlans()
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Planos e Preços</h1>
                <p className="text-muted-foreground">
                  Escolha o plano ideal para suas necessidades
                </p>
              </div>
            </div>
            
            {userId && (
              <Suspense fallback={<div className="h-10 w-32 animate-pulse bg-muted rounded" />}>
                <CreditBalance credits={credits} />
              </Suspense>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Coins className="h-4 w-4" />
            Sistema de Créditos
          </div>
          
          <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            Pague apenas pelo que usar
          </h2>
          
          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            Nosso sistema de créditos oferece flexibilidade total. 
            Compre créditos e use quando precisar, sem mensalidades ou compromissos.
          </p>

          {/* Freemium Info */}
          <div className="mb-12 rounded-lg border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">🎉 Comece Gratuitamente</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">15</div>
                <div className="text-sm font-medium text-green-700 dark:text-green-300">Créditos de Boas-vindas</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">Ao criar sua conta</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">20</div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Créditos Mensais</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Todo mês, automaticamente</div>
              </div>
            </div>
            <p className="text-muted-foreground mt-4 text-center">
              Com os créditos gratuitos você pode gerar até <strong>35 imagens</strong> ou <strong>3 vídeos</strong> por mês!
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-12">
        <Suspense fallback={
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-96 animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        }>
          <PricingCards plans={plans} userCredits={credits} />
        </Suspense>
      </div>

      {/* Credit Usage Info */}
      <div className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-4xl">
            <h3 className="mb-8 text-center text-2xl font-bold">
              Como funcionam os créditos?
            </h3>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-card p-6 text-center">
                <div className="mb-3 text-2xl">🖼️</div>
                <h4 className="mb-2 font-semibold">Imagens FLUX</h4>
                <p className="text-sm text-muted-foreground mb-2">1 crédito</p>
                <p className="text-xs text-muted-foreground">
                  Geração rápida e de alta qualidade
                </p>
              </div>
              
              <div className="rounded-lg bg-card p-6 text-center">
                <div className="mb-3 text-2xl">🎨</div>
                <h4 className="mb-2 font-semibold">Imagens SDXL</h4>
                <p className="text-sm text-muted-foreground mb-2">2 créditos</p>
                <p className="text-xs text-muted-foreground">
                  Qualidade premium e detalhes incríveis
                </p>
              </div>
              
              <div className="rounded-lg bg-card p-6 text-center">
                <div className="mb-3 text-2xl">🎬</div>
                <h4 className="mb-2 font-semibold">Vídeos Seedance</h4>
                <p className="text-sm text-muted-foreground mb-2">5 créditos</p>
                <p className="text-xs text-muted-foreground">
                  Vídeos de 5 segundos em HD
                </p>
              </div>
              
              <div className="rounded-lg bg-card p-6 text-center">
                <div className="mb-3 text-2xl">🎥</div>
                <h4 className="mb-2 font-semibold">Vídeos Kling</h4>
                <p className="text-sm text-muted-foreground mb-2">10 créditos</p>
                <p className="text-xs text-muted-foreground">
                  Vídeos premium de alta qualidade
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-3xl">
            <h3 className="mb-8 text-center text-2xl font-bold">
              Perguntas Frequentes
            </h3>
            
            <div className="space-y-6">
              <div className="rounded-lg border bg-card p-6">
                <h4 className="mb-2 font-semibold">Como funcionam os créditos mensais gratuitos?</h4>
                <p className="text-muted-foreground">
                  Todo usuário recebe automaticamente 20 créditos gratuitos por mês. Eles são adicionados 
                  automaticamente quando você acessa suas configurações, desde que tenha passado pelo menos 
                  um mês desde a última concessão.
                </p>
              </div>
              
              <div className="rounded-lg border bg-card p-6">
                <h4 className="mb-2 font-semibold">Os créditos expiram?</h4>
                <p className="text-muted-foreground">
                  Sim, os créditos expiram após 1 ano da data de compra para evitar acúmulo excessivo.
                </p>
              </div>
              
              <div className="rounded-lg border bg-card p-6">
                <h4 className="mb-2 font-semibold">Posso recarregar automaticamente?</h4>
                <p className="text-muted-foreground">
                  Em breve implementaremos a recarga automática com desconto quando seus créditos estiverem baixos.
                </p>
              </div>
              
              <div className="rounded-lg border bg-card p-6">
                <h4 className="mb-2 font-semibold">E se eu não gostar do resultado?</h4>
                <p className="text-muted-foreground">
                  Oferecemos reembolso de créditos em casos de falha técnica. Entre em contato conosco.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}