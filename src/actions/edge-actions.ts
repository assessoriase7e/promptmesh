"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "@/lib/db-utils";

/**
 * Cria uma nova conexão entre nodes
 */
export async function createEdge(data: {
  projectId: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  style?: any;
  animated?: boolean;
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

    // Verificar se os nodes existem e pertencem ao projeto
    const [sourceNode, targetNode] = await Promise.all([
      prisma.node.findFirst({
        where: {
          id: data.sourceNodeId,
          projectId: data.projectId,
        },
      }),
      prisma.node.findFirst({
        where: {
          id: data.targetNodeId,
          projectId: data.projectId,
        },
      }),
    ]);

    if (!sourceNode || !targetNode) {
      throw new Error("Nodes de origem ou destino não encontrados");
    }

    // Verificar se já existe uma conexão entre esses nodes
    const existingEdge = await prisma.edge.findFirst({
      where: {
        projectId: data.projectId,
        sourceNodeId: data.sourceNodeId,
        targetNodeId: data.targetNodeId,
        sourceHandle: data.sourceHandle,
        targetHandle: data.targetHandle,
      },
    });

    if (existingEdge) {
      throw new Error("Conexão já existe entre esses nodes");
    }

    const edge = await prisma.edge.create({
      data: {
        projectId: data.projectId,
        sourceNodeId: data.sourceNodeId,
        targetNodeId: data.targetNodeId,
        sourceHandle: data.sourceHandle,
        targetHandle: data.targetHandle,
        label: data.label,
        style: data.style,
        animated: data.animated || false,
      },
      include: {
        sourceNode: {
          select: { title: true, type: true },
        },
        targetNode: {
          select: { title: true, type: true },
        },
      },
    });

    // Log de auditoria
    await createAuditLog("create", "edge", edge.id, user.id, {
      sourceNodeTitle: edge.sourceNode.title,
      targetNodeTitle: edge.targetNode.title,
      projectId: data.projectId,
      source: "edge_action",
    });

    revalidatePath(`/editor/${data.projectId}`);

    return edge;
  } catch (error) {
    console.error("Erro ao criar edge:", error);
    throw new Error("Falha ao criar conexão");
  }
}

/**
 * Atualiza edge existente
 */
export async function updateEdge(
  edgeId: string,
  data: {
    label?: string;
    style?: any;
    animated?: boolean;
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

    // Verificar se o edge pertence a um projeto do usuário
    const existingEdge = await prisma.edge.findFirst({
      where: {
        id: edgeId,
        project: {
          userId: user.id,
        },
      },
      include: {
        project: true,
      },
    });

    if (!existingEdge) {
      throw new Error("Conexão não encontrada");
    }

    const edge = await prisma.edge.update({
      where: { id: edgeId },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.style !== undefined && { style: data.style }),
        ...(data.animated !== undefined && { animated: data.animated }),
      },
      include: {
        sourceNode: {
          select: { title: true, type: true },
        },
        targetNode: {
          select: { title: true, type: true },
        },
      },
    });

    // Log de auditoria
    await createAuditLog("update", "edge", edge.id, user.id, {
      updatedFields: Object.keys(data),
      projectId: existingEdge.projectId,
      source: "edge_action",
    });

    revalidatePath(`/editor/${existingEdge.projectId}`);

    return edge;
  } catch (error) {
    console.error("Erro ao atualizar edge:", error);
    throw new Error("Falha ao atualizar conexão");
  }
}

/**
 * Exclui edge
 */
export async function deleteEdge(edgeId: string) {
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

    // Verificar se o edge pertence a um projeto do usuário
    const edge = await prisma.edge.findFirst({
      where: {
        id: edgeId,
        project: {
          userId: user.id,
        },
      },
      include: {
        project: true,
        sourceNode: {
          select: { title: true, type: true },
        },
        targetNode: {
          select: { title: true, type: true },
        },
      },
    });

    if (!edge) {
      throw new Error("Conexão não encontrada");
    }

    // Log de auditoria antes de excluir
    await createAuditLog("delete", "edge", edge.id, user.id, {
      sourceNodeTitle: edge.sourceNode.title,
      targetNodeTitle: edge.targetNode.title,
      projectId: edge.projectId,
      source: "edge_action",
    });

    await prisma.edge.delete({
      where: { id: edgeId },
    });

    revalidatePath(`/editor/${edge.projectId}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir edge:", error);
    throw new Error("Falha ao excluir conexão");
  }
}

/**
 * Busca edges de um projeto
 */
export async function getProjectEdges(projectId: string) {
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

    const edges = await prisma.edge.findMany({
      where: { projectId },
      include: {
        sourceNode: {
          select: { title: true, type: true },
        },
        targetNode: {
          select: { title: true, type: true },
        },
      },
    });

    return edges;
  } catch (error) {
    console.error("Erro ao buscar edges:", error);
    throw new Error("Falha ao buscar conexões");
  }
}

/**
 * Exclui múltiplos edges (para operações em lote)
 */
export async function deleteMultipleEdges(edgeIds: string[]) {
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

    // Verificar se todos os edges pertencem ao usuário
    const edges = await prisma.edge.findMany({
      where: {
        id: { in: edgeIds },
        project: {
          userId: user.id,
        },
      },
      select: { id: true, projectId: true },
    });

    if (edges.length !== edgeIds.length) {
      throw new Error("Algumas conexões não foram encontradas");
    }

    // Log de auditoria
    await createAuditLog("delete", "edge", "multiple", user.id, {
      action: "bulk_delete",
      edgeIds,
      deleteCount: edgeIds.length,
      source: "edge_action",
    });

    // Excluir edges
    await prisma.edge.deleteMany({
      where: { id: { in: edgeIds } },
    });

    // Revalidar todas as páginas dos projetos afetados
    const projectIds = [...new Set(edges.map((e) => e.projectId))];
    projectIds.forEach((projectId) => {
      revalidatePath(`/editor/${projectId}`);
    });

    return { success: true, deletedCount: edgeIds.length };
  } catch (error) {
    console.error("Erro ao excluir múltiplos edges:", error);
    throw new Error("Falha ao excluir múltiplas conexões");
  }
}

/**
 * Busca edges conectados a um node específico
 */
export async function getNodeEdges(nodeId: string) {
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

    // Verificar se o node pertence ao usuário
    const node = await prisma.node.findFirst({
      where: {
        id: nodeId,
        project: {
          userId: user.id,
        },
      },
    });

    if (!node) {
      throw new Error("Node não encontrado");
    }

    const edges = await prisma.edge.findMany({
      where: {
        OR: [
          { sourceNodeId: nodeId },
          { targetNodeId: nodeId },
        ],
      },
      include: {
        sourceNode: {
          select: { title: true, type: true },
        },
        targetNode: {
          select: { title: true, type: true },
        },
      },
    });

    return edges;
  } catch (error) {
    console.error("Erro ao buscar edges do node:", error);
    throw new Error("Falha ao buscar conexões do node");
  }
}