import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { updateProfile } from '@/actions/user-actions'

/**
 * GET /api/user/profile
 * Retorna o perfil do usuário autenticado
 */
export const GET = withAuth(async (user) => {
  return NextResponse.json({
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
    credits: user.credits,
    plan: {
      id: user.plan.id,
      name: user.plan.name,
      displayName: user.plan.displayName,
      price: user.plan.price,
      credits: user.plan.credits,
      features: user.plan.features,
      isActive: user.plan.isActive
    },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  })
})

/**
 * PATCH /api/user/profile
 * Atualiza o perfil do usuário
 */
export const PATCH = withAuth(async (user, request: NextRequest) => {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const updatedUser = await updateProfile({ name })

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        imageUrl: updatedUser.imageUrl,
        credits: updatedUser.credits,
        plan: updatedUser.plan
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})