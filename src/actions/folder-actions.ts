"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/db-utils";

/**
 * Busca todas as pastas do usuário
 */
export async function getUserFolders() {
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
      return { success: true, folders: [] };
    }

    const folders = await prisma.folder.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: {
            projects: true,
            children: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { parentId: "asc" },
        { name: "asc" },
      ],
    });

    return { success: true, folders };
  } catch (error) {
    console.error("Erro ao buscar pastas:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro interno do servidor" 
    };
  }
}

/**
 * Cria uma nova pasta
 */
export async function createFolder(data: {
  name: string;
  color?: string;
  parentId?: string;
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

    // Verificar se a pasta pai existe (se fornecida)
    if (data.parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: data.parentId,
          userId: user.id,
        },
      });

      if (!parentFolder) {
        throw new Error("Pasta pai não encontrada");
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name: data.name,
        color: data.color,
        parentId: data.parentId,
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            projects: true,
            children: true,
          },
        },
      },
    });

    // Log de auditoria
    await createAuditLog("create", "folder", folder.id, user.id, {
      folderName: folder.name,
      parentId: data.parentId,
      source: "folder_action",
    });

    revalidatePath("/projects");

    return { success: true, folder };
  } catch (error) {
    console.error("Erro ao criar pasta:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro interno do servidor" 
    };
  }
}

/**
 * Atualiza pasta existente
 */
export async function updateFolder(
  folderId: string,
  data: {
    name?: string;
    color?: string;
    parentId?: string;
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

    // Verificar se a pasta existe e pertence ao usuário
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: user.id,
      },
    });

    if (!existingFolder) {
      throw new Error("Pasta não encontrada");
    }

    // Verificar se a pasta pai existe (se fornecida)
    if (data.parentId && data.parentId !== existingFolder.parentId) {
      // Não permitir que uma pasta seja pai de si mesma
      if (data.parentId === folderId) {
        throw new Error("Uma pasta não pode ser pai de si mesma");
      }

      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: data.parentId,
          userId: user.id,
        },
      });

      if (!parentFolder) {
        throw new Error("Pasta pai não encontrada");
      }

      // Verificar se não criaria um loop (pasta pai sendo filha da pasta atual)
      const isDescendant = await checkIfDescendant(folderId, data.parentId);
      if (isDescendant) {
        throw new Error("Não é possível mover uma pasta para dentro de uma de suas subpastas");
      }
    }

    const folder = await prisma.folder.update({
      where: { id: folderId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
      },
      include: {
        _count: {
          select: {
            projects: true,
            children: true,
          },
        },
      },
    });

    // Log de auditoria
    await createAuditLog("update", "folder", folder.id, user.id, {
      updatedFields: Object.keys(data),
      source: "folder_action",
    });

    revalidatePath("/projects");

    return { success: true, folder };
  } catch (error) {
    console.error("Erro ao atualizar pasta:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro interno do servidor" 
    };
  }
}

/**
 * Exclui pasta
 */
export async function deleteFolder(folderId: string) {
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

    // Verificar se a pasta existe e pertence ao usuário
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: user.id,
      },
      include: {
        projects: true,
        children: true,
      },
    });

    if (!folder) {
      throw new Error("Pasta não encontrada");
    }

    // Verificar se a pasta tem subpastas
    if (folder.children.length > 0) {
      throw new Error("Não é possível excluir uma pasta que contém subpastas. Mova ou exclua as subpastas primeiro.");
    }

    // Mover projetos da pasta para fora (sem pasta)
    if (folder.projects.length > 0) {
      await prisma.project.updateMany({
        where: { folderId: folderId },
        data: { folderId: null },
      });
    }

    await prisma.folder.delete({
      where: { id: folderId },
    });

    // Log de auditoria
    await createAuditLog("delete", "folder", folderId, user.id, {
      folderName: folder.name,
      projectsCount: folder.projects.length,
      source: "folder_action",
    });

    revalidatePath("/projects");

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir pasta:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro interno do servidor" 
    };
  }
}

/**
 * Move projeto para pasta
 */
export async function moveProjectToFolder(projectId: string, folderId?: string) {
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

    // Verificar se o projeto existe e pertence ao usuário
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      throw new Error("Projeto não encontrado");
    }

    // Verificar se a pasta existe (se fornecida)
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId: user.id,
        },
      });

      if (!folder) {
        throw new Error("Pasta não encontrada");
      }
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { folderId: folderId || null },
    });

    // Log de auditoria
    await createAuditLog("update", "project", projectId, user.id, {
      action: "move_to_folder",
      folderId: folderId,
      source: "folder_action",
    });

    revalidatePath("/projects");

    return { success: true };
  } catch (error) {
    console.error("Erro ao mover projeto:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro interno do servidor" 
    };
  }
}

/**
 * Função auxiliar para verificar se uma pasta é descendente de outra
 */
async function checkIfDescendant(ancestorId: string, descendantId: string): Promise<boolean> {
  const descendant = await prisma.folder.findUnique({
    where: { id: descendantId },
    select: { parentId: true },
  });

  if (!descendant || !descendant.parentId) {
    return false;
  }

  if (descendant.parentId === ancestorId) {
    return true;
  }

  return checkIfDescendant(ancestorId, descendant.parentId);
}