import { prisma } from './prisma'
import { NodeType, ExecutionStatus } from '@prisma/client'

// ===== UTILITÁRIOS DE USUÁRIO =====
export async function getUserByClerkId(clerkId: string) {
  return await prisma.user.findUnique({
    where: { clerkId },
    include: { plan: true }
  })
}

export async function createUserFromClerk(clerkData: {
  clerkId: string
  email: string
  name?: string
  imageUrl?: string
}) {
  // Buscar plano gratuito
  const freePlan = await prisma.plan.findUnique({
    where: { name: 'free' }
  })

  return await prisma.user.create({
    data: {
      clerkId: clerkData.clerkId,
      email: clerkData.email,
      name: clerkData.name,
      imageUrl: clerkData.imageUrl,
      planId: freePlan?.id,
      credits: freePlan?.credits ?? 0
    },
    include: { plan: true }
  })
}

// ===== UTILITÁRIOS DE PROJETO =====
export async function getUserProjects(userId: string) {
  return await prisma.project.findMany({
    where: { userId },
    include: {
      nodes: true,
      edges: true,
      _count: {
        select: { executions: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })
}

export async function getProjectWithDetails(projectId: string, userId: string) {
  return await prisma.project.findFirst({
    where: { 
      id: projectId,
      userId // Garantir que o usuário só acesse seus próprios projetos
    },
    include: {
      nodes: true,
      edges: true,
      executions: {
        orderBy: { startedAt: 'desc' },
        take: 10
      }
    }
  })
}

// ===== UTILITÁRIOS DE EXECUÇÃO =====
export async function createExecution(projectId: string, userId: string) {
  return await prisma.execution.create({
    data: {
      projectId,
      userId,
      status: ExecutionStatus.PENDING
    }
  })
}

export async function updateExecutionStatus(
  executionId: string, 
  status: ExecutionStatus,
  error?: string,
  outputs?: any
) {
  return await prisma.execution.update({
    where: { id: executionId },
    data: {
      status,
      error,
      outputs,
      endedAt: status === ExecutionStatus.COMPLETED || status === ExecutionStatus.FAILED 
        ? new Date() 
        : undefined
    }
  })
}

export async function createNodeExecution(
  executionId: string,
  nodeId: string,
  input?: any
) {
  return await prisma.nodeExecution.create({
    data: {
      executionId,
      nodeId,
      input,
      status: ExecutionStatus.PENDING
    }
  })
}

export async function updateNodeExecution(
  nodeExecutionId: string,
  status: ExecutionStatus,
  output?: any,
  error?: string,
  metadata?: any
) {
  return await prisma.nodeExecution.update({
    where: { id: nodeExecutionId },
    data: {
      status,
      output,
      error,
      metadata,
      endedAt: status === ExecutionStatus.COMPLETED || status === ExecutionStatus.FAILED 
        ? new Date() 
        : undefined
    }
  })
}

// ===== UTILITÁRIOS DE TEMPLATE =====
export async function getPublicTemplates(category?: string) {
  return await prisma.template.findMany({
    where: {
      isPublic: true,
      ...(category && { category })
    },
    include: {
      user: {
        select: { name: true, imageUrl: true }
      }
    },
    orderBy: [
      { isOfficial: 'desc' },
      { downloads: 'desc' },
      { createdAt: 'desc' }
    ]
  })
}

export async function getUserTemplates(userId: string) {
  return await prisma.template.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  })
}

// ===== UTILITÁRIOS DE ARQUIVO =====
export async function createFileRecord(fileData: {
  name: string
  url: string
  size: number
  mimeType: string
  uploadKey: string
  metadata?: any
  expiresAt?: Date
}) {
  return await prisma.file.create({
    data: fileData
  })
}

export async function getExpiredFiles() {
  return await prisma.file.findMany({
    where: {
      expiresAt: {
        lte: new Date()
      }
    }
  })
}

export async function deleteExpiredFiles() {
  const expiredFiles = await getExpiredFiles()
  
  if (expiredFiles.length > 0) {
    await prisma.file.deleteMany({
      where: {
        id: {
          in: expiredFiles.map(f => f.id)
        }
      }
    })
  }
  
  return expiredFiles
}

// ===== UTILITÁRIOS DE CRÉDITOS =====
export async function deductUserCredits(userId: string, amount: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true }
  })

  if (!user || user.credits < amount) {
    throw new Error('Créditos insuficientes')
  }

  return await prisma.user.update({
    where: { id: userId },
    data: {
      credits: {
        decrement: amount
      }
    }
  })
}

export async function addUserCredits(userId: string, amount: number) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      credits: {
        increment: amount
      }
    }
  })
}

// ===== UTILITÁRIOS DE AUDITORIA =====
export async function createAuditLog(
  action: string,
  resource: string,
  resourceId: string,
  userId?: string,
  metadata?: any
) {
  return await prisma.auditLog.create({
    data: {
      action,
      resource,
      resourceId,
      userId,
      metadata
    }
  })
}

// ===== UTILITÁRIOS DE CONFIGURAÇÃO =====
export async function getSystemConfig(key: string) {
  const config = await prisma.systemConfig.findUnique({
    where: { key }
  })
  return config?.value
}

export async function setSystemConfig(key: string, value: any) {
  return await prisma.systemConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  })
}