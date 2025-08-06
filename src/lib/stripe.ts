import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY não está definida nas variáveis de ambiente')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
})

// Configuração dos planos de créditos
export const CREDIT_PLANS = {
  starter: {
    name: 'starter',
    displayName: 'Starter',
    price: 5.00,
    credits: 50,
    bonus: 0,
    features: ['50 créditos', 'Geração de imagens', 'Suporte básico'],
  },
  standard: {
    name: 'standard',
    displayName: 'Padrão',
    price: 10.00,
    credits: 120,
    bonus: 0.2, // 20% de bônus
    features: ['120 créditos', 'Geração de imagens e vídeos', 'Suporte prioritário', '+20% de bônus'],
  },
  professional: {
    name: 'professional',
    displayName: 'Profissional',
    price: 20.00,
    credits: 300,
    bonus: 0.5, // 50% de bônus
    features: ['300 créditos', 'Geração ilimitada', 'Suporte premium', '+50% de bônus', 'Templates exclusivos'],
  },
  enterprise: {
    name: 'enterprise',
    displayName: 'Empresarial',
    price: 50.00,
    credits: 800,
    bonus: 0.6, // 60% de bônus
    features: ['800 créditos', 'Geração ilimitada', 'Suporte dedicado', '+60% de bônus', 'API personalizada', 'Integração customizada'],
  },
} as const

// Custos em créditos por tipo de geração
export const CREDIT_COSTS = {
  IMAGE_FLUX_SCHNELL: 1,    // Imagem FLUX.1 Schnell
  IMAGE_SDXL: 2,            // Imagem SDXL
  VIDEO_KLING_MASTER: 10,   // Vídeo Kling 2.1 Master (5s)
  VIDEO_SEEDANCE: 5,        // Vídeo Seedance (5s)
  TEXT_GENERATION: 1,       // Geração de texto
  IMAGE_UPSCALE: 2,         // Upscale de imagem
  IMAGE_EDIT: 3,            // Edição de imagem
} as const

export type CreditPlanName = keyof typeof CREDIT_PLANS
export type CreditCostType = keyof typeof CREDIT_COSTS