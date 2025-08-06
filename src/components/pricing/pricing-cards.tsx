'use client'

import { useState } from 'react'
import { Plan } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Coins, Crown, Loader2, Star, Zap } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface PricingCardsProps {
  plans: Plan[]
  userCredits: number
}

export const PricingCards = ({ plans, userCredits }: PricingCardsProps) => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const { isSignedIn } = useAuth()
  const router = useRouter()

  const handlePurchase = async (planName: string) => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    setLoadingPlan(planName)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar sessão de pagamento')
      }

      // Redirecionar para o Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error)
      toast.error(error.message || 'Erro ao processar pagamento')
    } finally {
      setLoadingPlan(null)
    }
  }

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'starter':
        return <Zap className="h-5 w-5" />
      case 'standard':
        return <Star className="h-5 w-5" />
      case 'professional':
        return <Crown className="h-5 w-5" />
      case 'enterprise':
        return <Crown className="h-5 w-5 text-yellow-500" />
      default:
        return <Coins className="h-5 w-5" />
    }
  }

  const getPlanBadge = (planName: string) => {
    switch (planName) {
      case 'standard':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">Mais Popular</Badge>
      case 'professional':
        return <Badge className="bg-purple-500/10 text-purple-700 border-purple-200">Melhor Valor</Badge>
      case 'enterprise':
        return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-200">Premium</Badge>
      default:
        return null
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const calculateCreditsWithBonus = (credits: number, bonus: number) => {
    return Math.round(credits * (1 + bonus))
  }

  const calculatePricePerCredit = (price: number, totalCredits: number) => {
    return price / totalCredits
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {plans.map((plan) => {
        const totalCredits = calculateCreditsWithBonus(plan.credits, plan.bonus)
        const pricePerCredit = calculatePricePerCredit(plan.price, totalCredits)
        const isLoading = loadingPlan === plan.name
        const badge = getPlanBadge(plan.name)

        return (
          <Card 
            key={plan.id} 
            className={`relative overflow-hidden transition-all hover:shadow-lg ${
              plan.name === 'standard' ? 'border-primary shadow-md scale-105' : ''
            }`}
          >
            {badge && (
              <div className="absolute -right-8 top-4 rotate-12">
                {badge}
              </div>
            )}

            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                {getPlanIcon(plan.name)}
              </div>
              
              <CardTitle className="text-xl">{plan.displayName}</CardTitle>
              
              <div className="space-y-1">
                <div className="text-3xl font-bold">
                  {formatPrice(plan.price)}
                </div>
                <CardDescription>
                  {totalCredits} créditos
                  {plan.bonus > 0 && (
                    <span className="ml-1 text-green-600 font-medium">
                      (+{Math.round(plan.bonus * 100)}% bônus)
                    </span>
                  )}
                </CardDescription>
                <div className="text-xs text-muted-foreground">
                  {formatPrice(pricePerCredit)} por crédito
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{String(feature)}</span>
                  </div>
                ))}
              </div>

              {/* Exemplos de uso */}
              <div className="rounded-lg bg-muted/50 p-3 text-xs">
                <div className="font-medium mb-1">Exemplos de uso:</div>
                <div className="space-y-1 text-muted-foreground">
                  <div>• {Math.floor(totalCredits / 1)} imagens FLUX</div>
                  <div>• {Math.floor(totalCredits / 2)} imagens SDXL</div>
                  <div>• {Math.floor(totalCredits / 10)} vídeos premium</div>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={plan.name === 'standard' ? 'default' : 'outline'}
                onClick={() => handlePurchase(plan.name)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Coins className="mr-2 h-4 w-4" />
                    Comprar Agora
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}