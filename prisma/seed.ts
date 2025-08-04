import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar planos padrão
  const freePlan = await prisma.plan.upsert({
    where: { name: 'free' },
    update: {},
    create: {
      name: 'free',
      displayName: 'Gratuito',
      price: 0,
      credits: 10,
      features: [
        'até_3_projetos',
        'execucoes_limitadas',
        'templates_basicos',
        'suporte_comunidade'
      ],
      isActive: true,
    },
  })

  const proPlan = await prisma.plan.upsert({
    where: { name: 'pro' },
    update: {},
    create: {
      name: 'pro',
      displayName: 'Pro',
      price: 29.90,
      credits: 500,
      features: [
        'projetos_ilimitados',
        'execucoes_ilimitadas',
        'todos_templates',
        'suporte_prioritario',
        'api_access',
        'colaboracao'
      ],
      isActive: true,
    },
  })

  const enterprisePlan = await prisma.plan.upsert({
    where: { name: 'enterprise' },
    update: {},
    create: {
      name: 'enterprise',
      displayName: 'Enterprise',
      price: 99.90,
      credits: 2000,
      features: [
        'tudo_do_pro',
        'white_label',
        'sso',
        'suporte_dedicado',
        'custom_integrations',
        'advanced_analytics'
      ],
      isActive: true,
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

  console.log('✅ Seed concluído!')
  console.log(`📋 Planos criados: ${freePlan.displayName}, ${proPlan.displayName}, ${enterprisePlan.displayName}`)
  console.log('🎨 Templates oficiais criados')
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