import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/actions/payment-actions'
import { CREDIT_PLANS } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { planName } = await req.json()

    if (!planName || !CREDIT_PLANS[planName as keyof typeof CREDIT_PLANS]) {
      return NextResponse.json(
        { error: 'Plano inválido' },
        { status: 400 }
      )
    }

    const { sessionId, url } = await createCheckoutSession(planName)

    return NextResponse.json({ sessionId, url })
  } catch (error: any) {
    console.error('Erro ao criar sessão de checkout:', error.message)
    
    if (error.message === 'Usuário não autenticado') {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}