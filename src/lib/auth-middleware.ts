import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserByClerkId } from './db-utils'

/**
 * Middleware para verificar se o usuário está autenticado e existe no banco
 */
export async function requireAuth() {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    )
  }

  // Verificar se usuário existe no banco
  const user = await getUserByClerkId(userId)
  
  if (!user) {
    return NextResponse.json(
      { 
        error: 'Usuário não encontrado no banco de dados',
        clerkId: userId,
        suggestion: 'Execute a sincronização de usuários ou configure o webhook do Clerk'
      },
      { status: 404 }
    )
  }

  return { user, userId }
}

/**
 * Wrapper para rotas de API que precisam de autenticação
 */
export function withAuth<T extends any[]>(
  handler: (user: NonNullable<Awaited<ReturnType<typeof getUserByClerkId>>>, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const authResult = await requireAuth()
    
    if (authResult instanceof NextResponse) {
      return authResult // Erro de autenticação
    }

    return handler(authResult.user, ...args)
  }
}

/**
 * Middleware para verificar se o usuário tem créditos suficientes
 */
export async function requireCredits(minimumCredits: number = 1) {
  const authResult = await requireAuth()
  
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult

  if (user.credits < minimumCredits) {
    return NextResponse.json(
      { 
        error: 'Créditos insuficientes',
        currentCredits: user.credits,
        requiredCredits: minimumCredits,
        planName: user.plan.name
      },
      { status: 402 } // Payment Required
    )
  }

  return { user }
}

/**
 * Wrapper para rotas que precisam de créditos
 */
export function withCredits<T extends any[]>(
  minimumCredits: number,
  handler: (user: NonNullable<Awaited<ReturnType<typeof getUserByClerkId>>>, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const creditsResult = await requireCredits(minimumCredits)
    
    if (creditsResult instanceof NextResponse) {
      return creditsResult
    }

    return handler(creditsResult.user, ...args)
  }
}