"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "@/lib/db-utils";

/**
 * Busca templates públicos
 */
export async function getPublicTemplates(
  category?: string,
  tags?: string[],
  limit = 20,
  offset = 0
) {
  try {
    const templates = await prisma.template.findMany({
      where: {
        isPublic: true,
        ...(category && { category }),
        ...(tags && tags.length > 0 && {
          tags: {
            hasSome: tags,
          },
        }),
      },
      include: {
        user: {
          select: { name: true, imageUrl: true },
        },
      },
      orderBy: [
        { isOfficial: "desc" },
        { downloads: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
      skip: offset,
    });

    const total = await prisma.template.count({
      where: {
        isPublic: true,
        ...(category && { category }),
        ...(tags && tags.length > 0 && {
          tags: {
            hasSome: tags,
          },
        }),
      },
    });

    return {
      templates,
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error("Erro ao buscar templates públicos:", error);
    throw new Error("Falha ao buscar templates públicos");
  }
}

/**
 * Busca templates do usuário
 */
export async function getUserTemplates() {
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

    const templates = await prisma.template.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    return templates;
  } catch (error) {
    console.error("Erro ao buscar templates do usuário:", error);
    throw new Error("Falha ao buscar templates do usuário");
  }
}

/**
 * Busca template por ID
 */
export async function getTemplateById(templateId: string) {
  try {
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        user: {
          select: { name: true, imageUrl: true },
        },
      },
    });

    if (!template) {
      throw new Error("Template não encontrado");
    }

    // Se o template não é público, verificar se pertence ao usuário
    if (!template.isPublic) {
      const { userId } = await auth();

      if (!userId) {
        throw new Error("Usuário não autenticado");
      }

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user || template.userId !== user.id) {
        throw new Error("Template não encontrado");
      }
    }

    return template;
  } catch (error) {
    console.error("Erro ao buscar template:", error);
    throw new Error("Falha ao buscar template");
  }
}

/**
 * Cria template a partir de um projeto
 */
export async function createTemplate(data: {
  projectId: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
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
      include: {
        nodes: true,
        edges: true,
      },
    });

    if (!project) {
      throw new Error("Projeto não encontrado");
    }

    if (!data.name || data.name.trim().length < 2) {
      throw new Error("Nome do template deve ter pelo menos 2 caracteres");
    }

    if (data.name.length > 100) {
      throw new Error("Nome do template deve ter no máximo 100 caracteres");
    }

    // Preparar dados do template
    const templateData = {
      name: project.name,
      description: project.description,
      nodes: project.nodes,
      edges: project.edges,
      canvasData: project.canvasData,
    };

    const template = await prisma.template.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        category: data.category || null,
        tags: data.tags || [],
        isPublic: data.isPublic || false,
        userId: user.id,
        templateData,
        thumbnail: project.thumbnail,
      },
    });

    // Log de auditoria
    await createAuditLog("create", "template", template.id, user.id, {
      templateName: template.name,
      projectId: data.projectId,
      isPublic: template.isPublic,
      source: "template_action",
    });

    revalidatePath("/templates");
    revalidatePath("/dashboard");

    return template;
  } catch (error) {
    console.error("Erro ao criar template:", error);
    throw new Error("Falha ao criar template");
  }
}

/**
 * Atualiza template
 */
export async function updateTemplate(
  templateId: string,
  data: {
    name?: string;
    description?: string;
    category?: string;
    tags?: string[];
    isPublic?: boolean;
    thumbnail?: string;
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

    // Verificar se o template pertence ao usuário
    const existingTemplate = await prisma.template.findFirst({
      where: {
        id: templateId,
        userId: user.id,
      },
    });

    if (!existingTemplate) {
      throw new Error("Template não encontrado");
    }

    if (data.name && (data.name.trim().length < 2 || data.name.length > 100)) {
      throw new Error("Nome do template deve ter entre 2 e 100 caracteres");
    }

    const template = await prisma.template.update({
      where: { id: templateId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
      },
    });

    // Log de auditoria
    await createAuditLog("update", "template", template.id, user.id, {
      updatedFields: Object.keys(data),
      source: "template_action",
    });

    revalidatePath("/templates");
    revalidatePath("/dashboard");

    return template;
  } catch (error) {
    console.error("Erro ao atualizar template:", error);
    throw new Error("Falha ao atualizar template");
  }
}

/**
 * Exclui template
 */
export async function deleteTemplate(templateId: string) {
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

    // Verificar se o template pertence ao usuário
    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        userId: user.id,
      },
    });

    if (!template) {
      throw new Error("Template não encontrado");
    }

    // Log de auditoria antes de excluir
    await createAuditLog("delete", "template", template.id, user.id, {
      templateName: template.name,
      isPublic: template.isPublic,
      downloads: template.downloads,
      source: "template_action",
    });

    await prisma.template.delete({
      where: { id: templateId },
    });

    revalidatePath("/templates");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir template:", error);
    throw new Error("Falha ao excluir template");
  }
}

/**
 * Cria projeto a partir de template
 */
export async function createProjectFromTemplate(
  templateId: string,
  projectName?: string
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

    // Buscar template
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error("Template não encontrado");
    }

    // Verificar se o template é público ou pertence ao usuário
    if (!template.isPublic && template.userId !== user.id) {
      throw new Error("Template não encontrado");
    }

    const templateData = template.templateData as any;

    // Criar novo projeto
    const project = await prisma.project.create({
      data: {
        name: projectName || `${template.name} (Projeto)`,
        description: template.description,
        userId: user.id,
        canvasData: templateData.canvasData,
        thumbnail: template.thumbnail,
      },
    });

    // Mapear IDs antigos para novos
    const nodeIdMap = new Map<string, string>();

    // Criar nodes
    if (templateData.nodes && Array.isArray(templateData.nodes)) {
      for (const nodeData of templateData.nodes) {
        const newNode = await prisma.node.create({
          data: {
            type: nodeData.type,
            title: nodeData.title,
            content: nodeData.content,
            position: nodeData.position,
            size: nodeData.size,
            style: nodeData.style,
            projectId: project.id,
          },
        });
        nodeIdMap.set(nodeData.id, newNode.id);
      }
    }

    // Criar edges
    if (templateData.edges && Array.isArray(templateData.edges)) {
      for (const edgeData of templateData.edges) {
        const newSourceNodeId = nodeIdMap.get(edgeData.sourceNodeId);
        const newTargetNodeId = nodeIdMap.get(edgeData.targetNodeId);

        if (newSourceNodeId && newTargetNodeId) {
          await prisma.edge.create({
            data: {
              label: edgeData.label,
              style: edgeData.style,
              animated: edgeData.animated,
              projectId: project.id,
              sourceNodeId: newSourceNodeId,
              targetNodeId: newTargetNodeId,
              sourceHandle: edgeData.sourceHandle,
              targetHandle: edgeData.targetHandle,
            },
          });
        }
      }
    }

    // Incrementar downloads do template
    await prisma.template.update({
      where: { id: templateId },
      data: {
        downloads: {
          increment: 1,
        },
      },
    });

    // Log de auditoria
    await createAuditLog("create", "project", project.id, user.id, {
      action: "from_template",
      templateId,
      templateName: template.name,
      source: "template_action",
    });

    revalidatePath("/dashboard");
    revalidatePath("/templates");

    return project;
  } catch (error) {
    console.error("Erro ao criar projeto a partir do template:", error);
    throw new Error("Falha ao criar projeto a partir do template");
  }
}

/**
 * Busca categorias de templates
 */
export async function getTemplateCategories() {
  try {
    const categories = await prisma.template.findMany({
      where: {
        isPublic: true,
        category: { not: null },
      },
      select: { category: true },
      distinct: ["category"],
    });

    return categories
      .map((c) => c.category)
      .filter((c): c is string => c !== null)
      .sort();
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    throw new Error("Falha ao buscar categorias");
  }
}

/**
 * Busca tags populares de templates
 */
export async function getPopularTemplateTags(limit = 20) {
  try {
    const tags = await prisma.template.findMany({
      where: {
        isPublic: true,
        tags: { isEmpty: false },
      },
      select: { tags: true },
    });

    // Contar frequência das tags
    const tagCount = new Map<string, number>();
    tags.forEach((template) => {
      template.tags.forEach((tag) => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    });

    // Ordenar por frequência e retornar as mais populares
    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag);
  } catch (error) {
    console.error("Erro ao buscar tags populares:", error);
    throw new Error("Falha ao buscar tags populares");
  }
}