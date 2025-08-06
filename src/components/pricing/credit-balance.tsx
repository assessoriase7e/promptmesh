'use client'

import { Coins } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface CreditBalanceProps {
  credits: number
}

export const CreditBalance = ({ credits }: CreditBalanceProps) => {
  const getBalanceColor = (credits: number) => {
    if (credits >= 50) return 'bg-green-500/10 text-green-700 border-green-200'
    if (credits >= 20) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200'
    if (credits >= 5) return 'bg-orange-500/10 text-orange-700 border-orange-200'
    return 'bg-red-500/10 text-red-700 border-red-200'
  }

  const getBalanceText = (credits: number) => {
    if (credits >= 50) return 'Saldo alto'
    if (credits >= 20) return 'Saldo médio'
    if (credits >= 5) return 'Saldo baixo'
    return 'Saldo crítico'
  }

  return (
    <div className="flex items-center gap-3">
      <Badge 
        variant="outline" 
        className={`px-3 py-1 ${getBalanceColor(credits)}`}
      >
        <Coins className="mr-1 h-3 w-3" />
        {credits} créditos
      </Badge>
      
      {credits <= 10 && (
        <span className="text-xs text-muted-foreground">
          {getBalanceText(credits)}
        </span>
      )}
    </div>
  )
}