"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/db-utils";

/**
 * Busca todos os projetos do usuário
 */
export async function getUserProjects() {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    // Se o usuário não existir no banco (race condition com webhook), retornar array vazio
    if (!user) {
      return [];
    }

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            nodes: true,
            executions: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return projects;
  } catch (error) {
    console.error("Erro ao buscar projetos:", error);
    throw new Error("Falha ao buscar projetos");
  }
}

/**
 * Busca projeto por ID
 */
export async function getProjectById(projectId: string) {
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
        executions: {
          orderBy: { startedAt: "desc" },
          take: 10,
          include: {
            nodeExecutions: {
              include: {
                node: {
                  select: { title: true, type: true },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error("Projeto não encontrado");
    }

    return project;
  } catch (error) {
    console.error("Erro ao buscar projeto:", error);
    throw new Error("Falha ao buscar projeto");
  }
}

/**
 * Cria um novo projeto
 */
export async function createProject(data: {
  name: string;
  description?: string;
  folderId?: string;
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

    if (!data.name || data.name.trim().length < 2) {
      throw new Error("Nome do projeto deve ter pelo menos 2 caracteres");
    }

    if (data.name.length > 100) {
      throw new Error("Nome do projeto deve ter no máximo 100 caracteres");
    }

    // Verificar se a pasta existe (se fornecida)
    if (data.folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: data.folderId,
          userId: user.id,
        },
      });

      if (!folder) {
        throw new Error("Pasta não encontrada");
      }
    }

    const project = await prisma.project.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        folderId: data.folderId || null,
        userId: user.id,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            nodes: true,
            executions: true,
          },
        },
      },
    });

    // Log de auditoria
    await createAuditLog("create", "project", project.id, user.id, {
      projectName: project.name,
      source: "project_action",
    });

    revalidatePath("/projects");
    revalidatePath("/dashboard");
    revalidatePath("/editor");

    return project;
  } catch (error) {
    console.error("Erro ao criar projeto:", error);
    throw new Error("Falha ao criar projeto");
  }
}

/**
 * Atualiza projeto
 */
export async function updateProject(
  projectId: string,
  data: {
    name?: string;
    description?: string;
    thumbnail?: string;
    isPublic?: boolean;
    canvasData?: any;
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

    // Verificar se o projeto pertence ao usuário
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!existingProject) {
      throw new Error("Projeto não encontrado");
    }

    if (data.name && (data.name.trim().length < 2 || data.name.length > 100)) {
      throw new Error("Nome do projeto deve ter entre 2 e 100 caracteres");
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        ...(data.canvasData !== undefined && { canvasData: data.canvasData }),
      },
      include: {
        _count: {
          select: {
            nodes: true,
            executions: true,
          },
        },
      },
    });

    // Log de auditoria
    await createAuditLog("update", "project", project.id, user.id, {
      updatedFields: Object.keys(data),
      source: "project_action",
    });

    revalidatePath("/dashboard");
    revalidatePath("/editor");
    revalidatePath(`/editor/${projectId}`);

    return project;
  } catch (error) {
    console.error("Erro ao atualizar projeto:", error);
    throw new Error("Falha ao atualizar projeto");
  }
}

/**
 * Duplica projeto
 */
export async function duplicateProject(projectId: string) {
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

    // Buscar projeto original com todos os dados
    const originalProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
      include: {
        nodes: true,
        edges: true,
      },
    });

    if (!originalProject) {
      throw new Error("Projeto não encontrado");
    }

    // Criar novo projeto
    const newProject = await prisma.project.create({
      data: {
        name: `${originalProject.name} (Cópia)`,
        description: originalProject.description,
        userId: user.id,
        canvasData: originalProject.canvasData,
      },
    });

    // Mapear IDs antigos para novos
    const nodeIdMap = new Map<string, string>();

    // Duplicar nodes
    for (const node of originalProject.nodes) {
      const newNode = await prisma.node.create({
        data: {
          type: node.type,
          title: node.title,
          content: node.content,
          position: node.position,
          size: node.size,
          style: node.style,
          projectId: newProject.id,
        },
      });
      nodeIdMap.set(node.id, newNode.id);
    }

    // Duplicar edges com novos IDs
    for (const edge of originalProject.edges) {
      const newSourceNodeId = nodeIdMap.get(edge.sourceNodeId);
      const newTargetNodeId = nodeIdMap.get(edge.targetNodeId);

      if (newSourceNodeId && newTargetNodeId) {
        await prisma.edge.create({
          data: {
            label: edge.label,
            style: edge.style,
            animated: edge.animated,
            projectId: newProject.id,
            sourceNodeId: newSourceNodeId,
            targetNodeId: newTargetNodeId,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
          },
        });
      }
    }

    // Log de auditoria
    await createAuditLog("create", "project", newProject.id, user.id, {
      action: "duplicate",
      originalProjectId: projectId,
      source: "project_action",
    });

    revalidatePath("/dashboard");

    return newProject;
  } catch (error) {
    console.error("Erro ao duplicar projeto:", error);
    throw new Error("Falha ao duplicar projeto");
  }
}

/**
 * Exclui projeto
 */
export async function deleteProject(projectId: string) {
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

    // Log de auditoria antes de excluir
    await createAuditLog("delete", "project", project.id, user.id, {
      projectName: project.name,
      source: "project_action",
    });

    // Excluir projeto (cascade vai excluir nodes, edges, executions)
    await prisma.project.delete({
      where: { id: projectId },
    });

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir projeto:", error);
    throw new Error("Falha ao excluir projeto");
  }
}

/**
 * Busca projetos públicos
 */
export async function getPublicProjects(limit = 20) {
  try {
    const projects = await prisma.project.findMany({
      where: { isPublic: true },
      include: {
        user: {
          select: {
            name: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            nodes: true,
            executions: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    return projects;
  } catch (error) {
    console.error("Erro ao buscar projetos públicos:", error);
    throw new Error("Falha ao buscar projetos públicos");
  }
}