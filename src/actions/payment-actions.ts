'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { stripe, CREDIT_PLANS, type CreditPlanName } from '@/lib/stripe'
import { PurchaseStatus, CreditTransactionType } from '@prisma/client'
import { addCredits } from './credit-actions'
import { revalidatePath } from 'next/cache'

// Criar sessão de checkout do Stripe
export async function createCheckoutSession(planName: CreditPlanName) {
  const { userId } = await auth()
  if (!userId) throw new Error('Usuário não autenticado')

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true }
  })

  if (!user) throw new Error('Usuário não encontrado')

  const plan = CREDIT_PLANS[planName]
  if (!plan) throw new Error('Plano não encontrado')

  // Buscar ou criar o plano no banco
  let dbPlan = await prisma.plan.findUnique({
    where: { name: planName }
  })

  if (!dbPlan) {
    // Criar produto no Stripe se não existir
    const stripeProduct = await stripe.products.create({
      name: `PromptMesh - ${plan.displayName}`,
      description: `Pacote de ${plan.credits} créditos para PromptMesh`,
      metadata: {
        planName,
        credits: plan.credits.toString(),
        bonus: plan.bonus.toString()
      }
    })

    // Criar preço no Stripe
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(plan.price * 100), // Converter para centavos
      currency: 'brl',
      metadata: {
        planName,
        credits: plan.credits.toString()
      }
    })

    // Salvar no banco
    dbPlan = await prisma.plan.create({
      data: {
        name: planName,
        displayName: plan.displayName,
        price: plan.price,
        credits: plan.credits,
        bonus: plan.bonus,
        features: plan.features,
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id
      }
    })
  }

  // Criar registro de compra pendente
  const purchase = await prisma.purchase.create({
    data: {
      userId: user.id,
      planId: dbPlan.id,
      amount: plan.price,
      credits: Math.round(plan.credits * (1 + plan.bonus)), // Aplicar bônus
      status: PurchaseStatus.PENDING
    }
  })

  // Criar sessão do Stripe
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    payment_method_types: ['card', 'pix'],
    line_items: [
      {
        price: dbPlan.stripePriceId!,
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: {
      userId: user.id,
      purchaseId: purchase.id,
      planName,
      credits: purchase.credits.toString()
    }
  })

  // Atualizar compra com ID da sessão
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { stripeSessionId: session.id }
  })

  return { sessionId: session.id, url: session.url }
}

// Processar webhook do Stripe
export async function handleStripeWebhook(event: any) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object)
      break
    
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object)
      break
    
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object)
      break
    
    default:
      console.log(`Evento não tratado: ${event.type}`)
  }
}

// Processar checkout completado
async function handleCheckoutCompleted(session: any) {
  const purchase = await prisma.purchase.findUnique({
    where: { stripeSessionId: session.id },
    include: { user: true, plan: true }
  })

  if (!purchase) {
    console.error('Compra não encontrada para sessão:', session.id)
    return
  }

  // Atualizar status da compra
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: {
      status: PurchaseStatus.COMPLETED,
      stripePaymentId: session.payment_intent
    }
  })

  // Adicionar créditos ao usuário
  await addCredits(
    purchase.userId,
    purchase.credits,
    CreditTransactionType.PURCHASE,
    `Compra de ${purchase.credits} créditos - ${purchase.plan?.displayName}`,
    {
      planName: purchase.plan?.name,
      stripeSessionId: session.id,
      amount: purchase.amount
    },
    purchase.id
  )

  console.log(`Créditos adicionados: ${purchase.credits} para usuário ${purchase.userId}`)
}

// Processar pagamento bem-sucedido
async function handlePaymentSucceeded(paymentIntent: any) {
  console.log('Pagamento bem-sucedido:', paymentIntent.id)
  // Lógica adicional se necessário
}

// Processar falha no pagamento
async function handlePaymentFailed(paymentIntent: any) {
  const purchase = await prisma.purchase.findUnique({
    where: { stripePaymentId: paymentIntent.id }
  })

  if (purchase) {
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { status: PurchaseStatus.FAILED }
    })
  }

  console.log('Pagamento falhou:', paymentIntent.id)
}

// Buscar histórico de compras
export async function getPurchaseHistory(page = 1, limit = 10) {
  const { userId } = await auth()
  if (!userId) throw new Error('Usuário não autenticado')

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true }
  })

  if (!user) throw new Error('Usuário não encontrado')

  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit
  })

  const total = await prisma.purchase.count({
    where: { userId: user.id }
  })

  return {
    purchases,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

// Verificar status de uma sessão de checkout
export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return session
  } catch (error) {
    console.error('Erro ao buscar sessão:', error)
    return null
  }
}

// Buscar todos os planos disponíveis
export async function getAvailablePlans() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  })

  return plans
}