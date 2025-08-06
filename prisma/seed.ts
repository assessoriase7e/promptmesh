import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar planos de créditos
  // Plano gratuito para novos usuários
  const freePlan = await prisma.plan.upsert({
    where: { name: 'free' },
    update: {},
    create: {
      name: 'free',
      displayName: 'Gratuito',
      price: 0.00,
      credits: 0, // Créditos são dados via webhook
      bonus: 0,
      features: [
        '15 créditos de boas-vindas',
        'Geração básica de imagens',
        'Suporte por email'
      ],
      isActive: true,
    },
  })

  const starterPlan = await prisma.plan.upsert({
    where: { name: 'starter' },
    update: {},
    create: {
      name: 'starter',
      displayName: 'Starter',
      price: 5.00,
      credits: 50,
      bonus: 0,
      features: [
        '50 créditos',
        'Geração de imagens FLUX',
        'Geração de imagens SDXL',
        'Suporte por email'
      ],
      isActive: true,
      stripeProductId: 'prod_starter', // Será atualizado com o ID real do Stripe
      stripePriceId: 'price_starter', // Será atualizado com o ID real do Stripe
    },
  })

  const standardPlan = await prisma.plan.upsert({
    where: { name: 'standard' },
    update: {},
    create: {
      name: 'standard',
      displayName: 'Padrão',
      price: 10.00,
      credits: 100,
      bonus: 20,
      features: [
        '100 créditos + 20 bônus',
        'Geração de imagens FLUX',
        'Geração de imagens SDXL',
        'Geração de vídeos Seedance',
        'Suporte prioritário'
      ],
      isActive: true,
      stripeProductId: 'prod_standard',
      stripePriceId: 'price_standard',
    },
  })

  const professionalPlan = await prisma.plan.upsert({
    where: { name: 'professional' },
    update: {},
    create: {
      name: 'professional',
      displayName: 'Profissional',
      price: 20.00,
      credits: 200,
      bonus: 100,
      features: [
        '200 créditos + 100 bônus',
        'Geração de imagens FLUX',
        'Geração de imagens SDXL',
        'Geração de vídeos Seedance',
        'Geração de vídeos Kling',
        'Suporte prioritário',
        'API access'
      ],
      isActive: true,
      stripeProductId: 'prod_professional',
      stripePriceId: 'price_professional',
    },
  })

  const enterprisePlan = await prisma.plan.upsert({
    where: { name: 'enterprise' },
    update: {},
    create: {
      name: 'enterprise',
      displayName: 'Empresarial',
      price: 50.00,
      credits: 500,
      bonus: 300,
      features: [
        '500 créditos + 300 bônus',
        'Todas as funcionalidades',
        'Geração ilimitada',
        'Suporte dedicado',
        'API access completo',
        'Integração personalizada'
      ],
      isActive: true,
      stripeProductId: 'prod_enterprise',
      stripePriceId: 'price_enterprise',
    },
  })

  // Criar configurações do sistema
  await prisma.systemConfig.upsert({
    where: { key: 'max_file_size' },
    update: {},
    create: {
      key: 'max_file_size',
      value: 10485760, // 10MB
    },
  })

  await prisma.systemConfig.upsert({
    where: { key: 'supported_file_types' },
    update: {},
    create: {
      key: 'supported_file_types',
      value: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    },
  })

  await prisma.systemConfig.upsert({
    where: { key: 'file_retention_days' },
    update: {},
    create: {
      key: 'file_retention_days',
      value: 7,
    },
  })

  // Criar templates oficiais básicos
  await prisma.template.upsert({
    where: { id: 'template-marketing-post' },
    update: {},
    create: {
      id: 'template-marketing-post',
      name: 'Post para Redes Sociais',
      description: 'Template para criar posts atrativos para redes sociais com IA',
      category: 'marketing',
      tags: ['social-media', 'marketing', 'content'],
      isPublic: true,
      isOfficial: true,
      templateData: {
        nodes: [
          {
            id: 'input-1',
            type: 'PROMPT_INPUT',
            title: 'Descrição do Produto',
            position: { x: 100, y: 100 },
            content: {
              placeholder: 'Descreva seu produto ou serviço...',
              required: true
            }
          },
          {
            id: 'ai-1',
            type: 'AI_GENERATOR',
            title: 'Gerador de Copy',
            position: { x: 400, y: 100 },
            content: {
              model: 'gpt-4',
              prompt: 'Crie um copy atrativo para redes sociais baseado na descrição: {input-1}',
              maxTokens: 200
            }
          },
          {
            id: 'output-1',
            type: 'OUTPUT',
            title: 'Post Final',
            position: { x: 700, y: 100 },
            content: {
              format: 'text'
            }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'input-1',
            target: 'ai-1'
          },
          {
            id: 'edge-2',
            source: 'ai-1',
            target: 'output-1'
          }
        ]
      }
    },
  })

  await prisma.template.upsert({
    where: { id: 'template-image-enhancement' },
    update: {},
    create: {
      id: 'template-image-enhancement',
      name: 'Melhoria de Imagem com IA',
      description: 'Template para melhorar qualidade e estilo de imagens usando IA',
      category: 'design',
      tags: ['image', 'enhancement', 'ai', 'design'],
      isPublic: true,
      isOfficial: true,
      templateData: {
        nodes: [
          {
            id: 'input-1',
            type: 'IMAGE_INPUT',
            title: 'Imagem Original',
            position: { x: 100, y: 100 },
            content: {
              acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
              maxSize: 10485760
            }
          },
          {
            id: 'ai-1',
            type: 'AI_GENERATOR',
            title: 'Melhorador de Imagem',
            position: { x: 400, y: 100 },
            content: {
              model: 'stability-ai/stable-diffusion',
              type: 'image-enhancement',
              settings: {
                upscale: true,
                denoise: true,
                enhance_details: true
              }
            }
          },
          {
            id: 'output-1',
            type: 'OUTPUT',
            title: 'Imagem Melhorada',
            position: { x: 700, y: 100 },
            content: {
              format: 'image',
              downloadable: true
            }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'input-1',
            target: 'ai-1'
          },
          {
            id: 'edge-2',
            source: 'ai-1',
            target: 'output-1'
          }
        ]
      }
    },
  })

  // Criar categorias de prompts para geração de imagens e vídeos
  const portraitCategory = await prisma.promptCategory.upsert({
    where: { name: 'Retratos' },
    update: {},
    create: {
      name: 'Retratos',
      description: 'Templates para geração de retratos e pessoas',
      color: '#3B82F6',
    },
  })

  const landscapeCategory = await prisma.promptCategory.upsert({
    where: { name: 'Paisagens' },
    update: {},
    create: {
      name: 'Paisagens',
      description: 'Templates para paisagens e cenários',
      color: '#10B981',
    },
  })

  const artCategory = await prisma.promptCategory.upsert({
    where: { name: 'Arte Digital' },
    update: {},
    create: {
      name: 'Arte Digital',
      description: 'Templates para arte conceitual e digital',
      color: '#8B5CF6',
    },
  })

  const productCategory = await prisma.promptCategory.upsert({
    where: { name: 'Produtos' },
    update: {},
    create: {
      name: 'Produtos',
      description: 'Templates para fotografia de produtos',
      color: '#F59E0B',
    },
  })

  const videoCategory = await prisma.promptCategory.upsert({
    where: { name: 'Vídeos' },
    update: {},
    create: {
      name: 'Vídeos',
      description: 'Templates para geração de vídeos',
      color: '#EF4444',
    },
  })

  // Criar templates de prompts para geração de imagens e vídeos
  await prisma.promptTemplate.upsert({
    where: { id: 'prompt-retrato-profissional' },
    update: {},
    create: {
      id: 'prompt-retrato-profissional',
      name: 'Retrato Profissional',
      prompt: 'Professional headshot of a [IDADE] year old [GÊNERO], [ETNIA], wearing [ROUPA], [EXPRESSÃO] expression, studio lighting, clean background, high resolution, photorealistic, shot with 85mm lens, shallow depth of field',
      categoryId: portraitCategory.id,
      isOfficial: true,
      usageCount: 0,
    },
  })

  await prisma.promptTemplate.upsert({
    where: { id: 'prompt-paisagem-natural' },
    update: {},
    create: {
      id: 'prompt-paisagem-natural',
      name: 'Paisagem Natural',
      prompt: '[TIPO_PAISAGEM] landscape during [HORA_DO_DIA], [CLIMA], dramatic lighting, vibrant colors, ultra-wide angle, high detail, 8K resolution, cinematic composition, [ELEMENTOS_EXTRAS]',
      categoryId: landscapeCategory.id,
      isOfficial: true,
      usageCount: 0,
    },
  })

  await prisma.promptTemplate.upsert({
    where: { id: 'prompt-arte-conceitual' },
    update: {},
    create: {
      id: 'prompt-arte-conceitual',
      name: 'Arte Conceitual',
      prompt: '[CONCEITO] in the style of [ESTILO_ARTÍSTICO], digital art, concept art, detailed illustration, vibrant colors, dynamic composition, [MOOD], trending on artstation, 4K',
      categoryId: artCategory.id,
      isOfficial: true,
      usageCount: 0,
    },
  })

  await prisma.promptTemplate.upsert({
    where: { id: 'prompt-produto-comercial' },
    update: {},
    create: {
      id: 'prompt-produto-comercial',
      name: 'Fotografia de Produto',
      prompt: 'Commercial product photography of [PRODUTO], clean white background, professional studio lighting, high resolution, sharp focus, minimalist composition, [ÂNGULO], photorealistic, e-commerce style',
      categoryId: productCategory.id,
      isOfficial: true,
      usageCount: 0,
    },
  })

  await prisma.promptTemplate.upsert({
    where: { id: 'prompt-video-promocional' },
    update: {},
    create: {
      id: 'prompt-video-promocional',
      name: 'Vídeo Promocional',
      prompt: 'Create a [DURAÇÃO] second promotional video showing [PRODUTO/SERVIÇO], dynamic camera movements, [ESTILO_VISUAL], upbeat music, modern transitions, [CALL_TO_ACTION], 1080p quality',
      categoryId: videoCategory.id,
      isOfficial: true,
      usageCount: 0,
    },
  })

  await prisma.promptTemplate.upsert({
    where: { id: 'prompt-animacao-logo' },
    update: {},
    create: {
      id: 'prompt-animacao-logo',
      name: 'Animação de Logo',
      prompt: 'Animated logo reveal for [NOME_EMPRESA], [ESTILO_ANIMAÇÃO] animation, [DURAÇÃO] seconds, smooth transitions, [CORES_PRINCIPAIS], professional look, [EFEITOS_ESPECIAIS], 4K resolution',
      categoryId: videoCategory.id,
      isOfficial: true,
      usageCount: 0,
    },
  })

  console.log('✅ Seed concluído!')
  console.log(`📋 Planos criados: ${freePlan.displayName}, ${starterPlan.displayName}, ${standardPlan.displayName}, ${professionalPlan.displayName}, ${enterprisePlan.displayName}`)
  console.log('🎨 Templates oficiais criados')
  console.log(`📝 Categorias de prompts criadas: ${portraitCategory.name}, ${landscapeCategory.name}, ${artCategory.name}, ${productCategory.name}, ${videoCategory.name}`)
  console.log('💡 Templates de prompts para imagens e vídeos criados')
  console.log('⚙️ Configurações do sistema definidas')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Erro no seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })