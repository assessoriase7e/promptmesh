'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Coins, Plus } from 'lucide-react'
import Link from 'next/link'
import { getUserCredits } from '@/actions/credit-actions'

export const CreditDisplay = () => {
  const { user, isLoaded } = useUser()
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCredits = async () => {
      // Só buscar créditos se o usuário estiver carregado e logado
      if (!isLoaded || !user) {
        setLoading(false)
        return
      }

      try {
        const userCredits = await getUserCredits()
        setCredits(userCredits)
      } catch (error) {
        console.error('Erro ao buscar créditos:', error)
        setCredits(0)
      } finally {
        setLoading(false)
      }
    }

    fetchCredits()
  }, [user, isLoaded])

  // Não renderizar se o usuário não estiver logado
  if (!isLoaded || !user) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-6 w-20 animate-pulse bg-muted rounded" />
      </div>
    )
  }

  const getBalanceColor = (credits: number) => {
    if (credits >= 50) return 'bg-green-500/10 text-green-700 border-green-200'
    if (credits >= 20) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200'
    if (credits >= 5) return 'bg-orange-500/10 text-orange-700 border-orange-200'
    return 'bg-red-500/10 text-red-700 border-red-200'
  }

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className={`px-2 py-1 ${getBalanceColor(credits || 0)}`}
      >
        <Coins className="mr-1 h-3 w-3" />
        {credits} créditos
      </Badge>
      
      {(credits || 0) <= 10 && (
        <Button size="sm" variant="outline" asChild>
          <Link href="/pricing">
            <Plus className="h-3 w-3 mr-1" />
            Comprar
          </Link>
        </Button>
      )}
    </div>
  )
}