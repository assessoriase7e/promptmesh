"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "@/lib/db-utils";
import { NodeType } from "@prisma/client";

/**
 * Cria um novo node no projeto
 */
export async function createNode(data: {
  projectId: string;
  type: NodeType;
  title: string;
  content: any;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  style?: any;
}) {
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
        id: data.projectId,
        userId: user.id,
      },
    });

    if (!project) {
      throw new Error("Projeto não encontrado");
    }

    if (!data.title || data.title.trim().length < 1) {
      throw new Error("Título do node é obrigatório");
    }

    const node = await prisma.node.create({
      data: {
        type: data.type,
        title: data.title.trim(),
        content: data.content,
        position: data.position,
        size: data.size,
        style: data.style,
        projectId: data.projectId,
      },
    });

    // Log de auditoria
    await createAuditLog("create", "node", node.id, user.id, {
      nodeType: data.type,
      nodeTitle: data.title,
      projectId: data.projectId,
      source: "node_action",
    });

    revalidatePath(`/editor/${data.projectId}`);

    return node;
  } catch (error) {
    console.error("Erro ao criar node:", error);
    throw new Error("Falha ao criar node");
  }
}

/**
 * Atualiza node existente
 */
export async function updateNode(
  nodeId: string,
  data: {
    title?: string;
    content?: any;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    style?: any;
  }
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

    // Verificar se o node pertence a um projeto do usuário
    const existingNode = await prisma.node.findFirst({
      where: {
        id: nodeId,
        project: {
          userId: user.id,
        },
      },
      include: {
        project: true,
      },
    });

    if (!existingNode) {
      throw new Error("Node não encontrado");
    }

    if (data.title && data.title.trim().length < 1) {
      throw new Error("Título do node não pode estar vazio");
    }

    const node = await prisma.node.update({
      where: { id: nodeId },
      data: {
        ...(data.title && { title: data.title.trim() }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.position && { position: data.position }),
        ...(data.size && { size: data.size }),
        ...(data.style !== undefined && { style: data.style }),
      },
    });

    // Log de auditoria
    await createAuditLog("update", "node", node.id, user.id, {
      updatedFields: Object.keys(data),
      projectId: existingNode.projectId,
      source: "node_action",
    });

    revalidatePath(`/editor/${existingNode.projectId}`);

    return node;
  } catch (error) {
    console.error("Erro ao atualizar node:", error);
    throw new Error("Falha ao atualizar node");
  }
}

/**
 * Exclui node
 */
export async function deleteNode(nodeId: string) {
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

    // Verificar se o node pertence a um projeto do usuário
    const node = await prisma.node.findFirst({
      where: {
        id: nodeId,
        project: {
          userId: user.id,
        },
      },
      include: {
        project: true,
      },
    });

    if (!node) {
      throw new Error("Node não encontrado");
    }

    // Log de auditoria antes de excluir
    await createAuditLog("delete", "node", node.id, user.id, {
      nodeType: node.type,
      nodeTitle: node.title,
      projectId: node.projectId,
      source: "node_action",
    });

    // Excluir node (cascade vai excluir edges conectados)
    await prisma.node.delete({
      where: { id: nodeId },
    });

    revalidatePath(`/editor/${node.projectId}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir node:", error);
    throw new Error("Falha ao excluir node");
  }
}

/**
 * Duplica node
 */
export async function duplicateNode(nodeId: string) {
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

    // Verificar se o node pertence a um projeto do usuário
    const originalNode = await prisma.node.findFirst({
      where: {
        id: nodeId,
        project: {
          userId: user.id,
        },
      },
    });

    if (!originalNode) {
      throw new Error("Node não encontrado");
    }

    // Criar posição offset para o novo node
    const position = originalNode.position as { x: number; y: number };
    const newPosition = {
      x: position.x + 50,
      y: position.y + 50,
    };

    const newNode = await prisma.node.create({
      data: {
        type: originalNode.type,
        title: `${originalNode.title} (Cópia)`,
        content: originalNode.content,
        position: newPosition,
        size: originalNode.size,
        style: originalNode.style,
        projectId: originalNode.projectId,
      },
    });

    // Log de auditoria
    await createAuditLog("create", "node", newNode.id, user.id, {
      action: "duplicate",
      originalNodeId: nodeId,
      nodeType: newNode.type,
      projectId: originalNode.projectId,
      source: "node_action",
    });

    revalidatePath(`/editor/${originalNode.projectId}`);

    return newNode;
  } catch (error) {
    console.error("Erro ao duplicar node:", error);
    throw new Error("Falha ao duplicar node");
  }
}

/**
 * Busca nodes de um projeto
 */
export async function getProjectNodes(projectId: string) {
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

    const nodes = await prisma.node.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });

    return nodes;
  } catch (error) {
    console.error("Erro ao buscar nodes:", error);
    throw new Error("Falha ao buscar nodes");
  }
}

/**
 * Atualiza múltiplos nodes (para operações em lote)
 */
export async function updateMultipleNodes(
  updates: Array<{
    nodeId: string;
    data: {
      position?: { x: number; y: number };
      size?: { width: number; height: number };
      style?: any;
    };
  }>
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

    // Verificar se todos os nodes pertencem ao usuário
    const nodeIds = updates.map((u) => u.nodeId);
    const nodes = await prisma.node.findMany({
      where: {
        id: { in: nodeIds },
        project: {
          userId: user.id,
        },
      },
      select: { id: true, projectId: true },
    });

    if (nodes.length !== nodeIds.length) {
      throw new Error("Alguns nodes não foram encontrados");
    }

    // Atualizar nodes em transação
    const updatedNodes = await prisma.$transaction(
      updates.map((update) =>
        prisma.node.update({
          where: { id: update.nodeId },
          data: update.data,
        })
      )
    );

    // Log de auditoria
    await createAuditLog("update", "node", "multiple", user.id, {
      action: "bulk_update",
      nodeIds,
      updateCount: updates.length,
      source: "node_action",
    });

    // Revalidar todas as páginas dos projetos afetados
    const projectIds = [...new Set(nodes.map((n) => n.projectId))];
    projectIds.forEach((projectId) => {
      revalidatePath(`/editor/${projectId}`);
    });

    return updatedNodes;
  } catch (error) {
    console.error("Erro ao atualizar múltiplos nodes:", error);
    throw new Error("Falha ao atualizar múltiplos nodes");
  }
}