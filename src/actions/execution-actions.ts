"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/db-utils";
import { ExecutionStatus, NodeType } from "@prisma/client";
import { hasEnoughCredits, consumeCredits } from "./credit-actions";
import { CREDIT_COSTS } from "@/lib/stripe";

/**
 * Inicia execução de um projeto
 */
export async function startExecution(projectId: string, metadata?: any) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { plan: true },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se o projeto pertence ao usuário
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
      include: {
        nodes: {
          orderBy: { createdAt: "asc" },
        },
        edges: true,
      },
    });

    if (!project) {
      throw new Error("Projeto não encontrado");
    }

    if (project.nodes.length === 0) {
      throw new Error("Projeto não possui nodes para executar");
    }

    // Calcular custo total baseado nos tipos de nodes
    let totalCost = 0;
    const costBreakdown: { nodeId: string; nodeType: NodeType; cost: number }[] = [];

    for (const node of project.nodes) {
      let nodeCost = 0;
      
      // Determinar custo baseado no tipo de node
      switch (node.type) {
        case NodeType.AI_GENERATOR:
          // Verificar se é geração de imagem ou vídeo baseado no conteúdo
          const nodeContent = node.content as any;
          if (nodeContent?.model?.includes('flux')) {
            nodeCost = CREDIT_COSTS.IMAGE_FLUX_SCHNELL;
          } else if (nodeContent?.model?.includes('sdxl')) {
            nodeCost = CREDIT_COSTS.IMAGE_SDXL;
          } else if (nodeContent?.model?.includes('seedance')) {
            nodeCost = CREDIT_COSTS.VIDEO_SEEDANCE;
          } else if (nodeContent?.model?.includes('kling')) {
            nodeCost = CREDIT_COSTS.VIDEO_KLING_MASTER;
          } else {
            // Custo padrão para outros tipos de geração
            nodeCost = 1;
          }
          break;
        case NodeType.IMAGE_EDITOR:
          nodeCost = CREDIT_COSTS.IMAGE_EDIT; // Custo para edição de imagem
          break;
        default:
          // Nodes que não consomem créditos (inputs, outputs, etc.)
          nodeCost = 0;
          break;
      }

      if (nodeCost > 0) {
        totalCost += nodeCost;
        costBreakdown.push({
          nodeId: node.id,
          nodeType: node.type,
          cost: nodeCost
        });
      }
    }

    // Se não há nodes que consomem créditos, aplicar custo mínimo
    if (totalCost === 0) {
      totalCost = 1; // Custo mínimo de execução
    }

    // Verificar se o usuário tem créditos suficientes
    const hasCredits = await hasEnoughCredits(totalCost);
    if (!hasCredits) {
      throw new Error(`Créditos insuficientes. Necessário: ${totalCost} créditos. Saldo atual: ${user.credits} créditos.`);
    }

    // Criar execução
    const execution = await prisma.execution.create({
      data: {
        projectId,
        userId: user.id,
        status: ExecutionStatus.PENDING,
        metadata: {
          ...metadata,
          totalCost,
          costBreakdown,
          executedAt: new Date().toISOString(),
        },
      },
      include: {
        project: {
          select: { name: true },
        },
      },
    });

    // Consumir créditos e criar transação
    await consumeCredits(
      totalCost, 
      `Execução do projeto: ${execution.project.name}`,
      { costBreakdown, nodeCount: project.nodes.length },
      execution.id
    );

    // Criar execuções para cada node
    const nodeExecutions = await Promise.all(
      project.nodes.map((node) =>
        prisma.nodeExecution.create({
          data: {
            executionId: execution.id,
            nodeId: node.id,
            status: ExecutionStatus.PENDING,
          },
        })
      )
    );

    // Log de auditoria
    await createAuditLog("create", "execution", execution.id, user.id, {
      projectId,
      projectName: execution.project.name,
      nodeCount: project.nodes.length,
      totalCost,
      costBreakdown,
      creditsDeducted: totalCost,
      source: "execution_action",
    });

    revalidatePath(`/editor/${projectId}`);
    revalidatePath("/history");
    revalidatePath("/dashboard");

    return {
      execution,
      nodeExecutions,
    };
  } catch (error) {
    console.error("Erro ao iniciar execução:", error);
    throw new Error("Falha ao iniciar execução");
  }
}

/**
 * Atualiza status da execução
 */
export async function updateExecutionStatus(
  executionId: string,
  status: ExecutionStatus,
  error?: string,
  outputs?: any
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se a execução pertence ao usuário
    const existingExecution = await prisma.execution.findFirst({
      where: {
        id: executionId,
        userId: user.id,
      },
    });

    if (!existingExecution) {
      throw new Error("Execução não encontrada");
    }

    const execution = await prisma.execution.update({
      where: { id: executionId },
      data: {
        status,
        error,
        outputs,
        endedAt: status === ExecutionStatus.COMPLETED || status === ExecutionStatus.FAILED
          ? new Date()
          : undefined,
      },
      include: {
        project: {
          select: { name: true },
        },
      },
    });

    // Log de auditoria
    await createAuditLog("update", "execution", execution.id, user.id, {
      status,
      error,
      hasOutputs: !!outputs,
      projectId: existingExecution.projectId,
      source: "execution_action",
    });

    revalidatePath(`/editor/${existingExecution.projectId}`);
    revalidatePath("/history");

    return execution;
  } catch (error) {
    console.error("Erro ao atualizar execução:", error);
    throw new Error("Falha ao atualizar execução");
  }
}

/**
 * Cancela execução em andamento
 */
export async function cancelExecution(executionId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se a execução pertence ao usuário
    const execution = await prisma.execution.findFirst({
      where: {
        id: executionId,
        userId: user.id,
      },
    });

    if (!execution) {
      throw new Error("Execução não encontrada");
    }

    if (execution.status !== ExecutionStatus.PENDING && execution.status !== ExecutionStatus.RUNNING) {
      throw new Error("Execução não pode ser cancelada");
    }

    // Atualizar execução e todas as execuções de nodes
    await prisma.$transaction([
      prisma.execution.update({
        where: { id: executionId },
        data: {
          status: ExecutionStatus.CANCELLED,
          endedAt: new Date(),
        },
      }),
      prisma.nodeExecution.updateMany({
        where: {
          executionId,
          status: { in: [ExecutionStatus.PENDING, ExecutionStatus.RUNNING] },
        },
        data: {
          status: ExecutionStatus.CANCELLED,
          endedAt: new Date(),
        },
      }),
    ]);

    // Log de auditoria
    await createAuditLog("update", "execution", execution.id, user.id, {
      action: "cancel",
      projectId: execution.projectId,
      source: "execution_action",
    });

    revalidatePath(`/editor/${execution.projectId}`);
    revalidatePath("/history");

    return { success: true };
  } catch (error) {
    console.error("Erro ao cancelar execução:", error);
    throw new Error("Falha ao cancelar execução");
  }
}

/**
 * Busca execuções do usuário
 */
export async function getUserExecutions(limit = 20, offset = 0) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const executions = await prisma.execution.findMany({
      where: { userId: user.id },
      include: {
        project: {
          select: { name: true, thumbnail: true },
        },
        nodeExecutions: {
          include: {
            node: {
              select: { title: true, type: true },
            },
          },
        },
      },
      orderBy: { startedAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.execution.count({
      where: { userId: user.id },
    });

    return {
      executions,
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error("Erro ao buscar execuções:", error);
    throw new Error("Falha ao buscar execuções");
  }
}

/**
 * Busca execução por ID
 */
export async function getExecutionById(executionId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const execution = await prisma.execution.findFirst({
      where: {
        id: executionId,
        userId: user.id,
      },
      include: {
        project: {
          select: { name: true, thumbnail: true },
        },
        nodeExecutions: {
          include: {
            node: {
              select: { title: true, type: true, content: true },
            },
          },
          orderBy: { startedAt: "asc" },
        },
      },
    });

    if (!execution) {
      throw new Error("Execução não encontrada");
    }

    return execution;
  } catch (error) {
    console.error("Erro ao buscar execução:", error);
    throw new Error("Falha ao buscar execução");
  }
}

/**
 * Busca execuções de um projeto
 */
export async function getProjectExecutions(projectId: string, limit = 10) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se o projeto pertence ao usuário
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      throw new Error("Projeto não encontrado");
    }

    const executions = await prisma.execution.findMany({
      where: { projectId },
      include: {
        nodeExecutions: {
          include: {
            node: {
              select: { title: true, type: true },
            },
          },
        },
      },
      orderBy: { startedAt: "desc" },
      take: limit,
    });

    return executions;
  } catch (error) {
    console.error("Erro ao buscar execuções do projeto:", error);
    throw new Error("Falha ao buscar execuções do projeto");
  }
}

/**
 * Exclui execução
 */
export async function deleteExecution(executionId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se a execução pertence ao usuário
    const execution = await prisma.execution.findFirst({
      where: {
        id: executionId,
        userId: user.id,
      },
    });

    if (!execution) {
      throw new Error("Execução não encontrada");
    }

    // Log de auditoria antes de excluir
    await createAuditLog("delete", "execution", execution.id, user.id, {
      projectId: execution.projectId,
      status: execution.status,
      source: "execution_action",
    });

    // Excluir execução (cascade vai excluir nodeExecutions)
    await prisma.execution.delete({
      where: { id: executionId },
    });

    revalidatePath("/history");
    revalidatePath(`/editor/${execution.projectId}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir execução:", error);
    throw new Error("Falha ao excluir execução");
  }
}

/**
 * Atualiza execução de node específico
 */
export async function updateNodeExecution(
  nodeExecutionId: string,
  status: ExecutionStatus,
  output?: any,
  error?: string,
  metadata?: any
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se a execução do node pertence ao usuário
    const existingNodeExecution = await prisma.nodeExecution.findFirst({
      where: {
        id: nodeExecutionId,
        execution: {
          userId: user.id,
        },
      },
      include: {
        execution: true,
        node: {
          select: { title: true, type: true },
        },
      },
    });

    if (!existingNodeExecution) {
      throw new Error("Execução do node não encontrada");
    }

    const nodeExecution = await prisma.nodeExecution.update({
      where: { id: nodeExecutionId },
      data: {
        status,
        output,
        error,
        metadata,
        endedAt: status === ExecutionStatus.COMPLETED || status === ExecutionStatus.FAILED
          ? new Date()
          : undefined,
      },
    });

    // Log de auditoria
    await createAuditLog("update", "node_execution", nodeExecution.id, user.id, {
      status,
      nodeTitle: existingNodeExecution.node.title,
      nodeType: existingNodeExecution.node.type,
      executionId: existingNodeExecution.executionId,
      source: "execution_action",
    });

    revalidatePath(`/editor/${existingNodeExecution.execution.projectId}`);
    revalidatePath("/history");

    return nodeExecution;
  } catch (error) {
    console.error("Erro ao atualizar execução do node:", error);
    throw new Error("Falha ao atualizar execução do node");
  }
}