"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/db-utils";

/**
 * Registra arquivo no banco após upload
 */
export async function createFileRecord(data: {
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadKey: string;
  metadata?: any;
  expiresAt?: Date;
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

    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Nome do arquivo é obrigatório");
    }

    if (!data.url || !data.uploadKey) {
      throw new Error("URL e chave de upload são obrigatórias");
    }

    const file = await prisma.file.create({
      data: {
        name: data.name.trim(),
        url: data.url,
        size: data.size,
        mimeType: data.mimeType,
        uploadKey: data.uploadKey,
        metadata: data.metadata,
        expiresAt: data.expiresAt,
      },
    });

    // Log de auditoria
    await createAuditLog("create", "file", file.id, user.id, {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.mimeType,
      hasExpiration: !!file.expiresAt,
      source: "file_action",
    });

    return file;
  } catch (error) {
    console.error("Erro ao registrar arquivo:", error);
    throw new Error("Falha ao registrar arquivo");
  }
}

/**
 * Busca arquivo por ID
 */
export async function getFileById(fileId: string) {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error("Arquivo não encontrado");
    }

    // Verificar se o arquivo não expirou
    if (file.expiresAt && file.expiresAt < new Date()) {
      throw new Error("Arquivo expirado");
    }

    return file;
  } catch (error) {
    console.error("Erro ao buscar arquivo:", error);
    throw new Error("Falha ao buscar arquivo");
  }
}

/**
 * Busca arquivo por chave de upload
 */
export async function getFileByUploadKey(uploadKey: string) {
  try {
    const file = await prisma.file.findUnique({
      where: { uploadKey },
    });

    if (!file) {
      throw new Error("Arquivo não encontrado");
    }

    // Verificar se o arquivo não expirou
    if (file.expiresAt && file.expiresAt < new Date()) {
      throw new Error("Arquivo expirado");
    }

    return file;
  } catch (error) {
    console.error("Erro ao buscar arquivo por chave:", error);
    throw new Error("Falha ao buscar arquivo");
  }
}

/**
 * Atualiza metadados do arquivo
 */
export async function updateFileMetadata(fileId: string, metadata: any) {
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

    const existingFile = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!existingFile) {
      throw new Error("Arquivo não encontrado");
    }

    const file = await prisma.file.update({
      where: { id: fileId },
      data: { metadata },
    });

    // Log de auditoria
    await createAuditLog("update", "file", file.id, user.id, {
      fileName: file.name,
      action: "metadata_update",
      source: "file_action",
    });

    return file;
  } catch (error) {
    console.error("Erro ao atualizar metadados do arquivo:", error);
    throw new Error("Falha ao atualizar metadados do arquivo");
  }
}

/**
 * Exclui arquivo
 */
export async function deleteFile(fileId: string) {
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

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error("Arquivo não encontrado");
    }

    // Log de auditoria antes de excluir
    await createAuditLog("delete", "file", file.id, user.id, {
      fileName: file.name,
      fileSize: file.size,
      uploadKey: file.uploadKey,
      source: "file_action",
    });

    await prisma.file.delete({
      where: { id: fileId },
    });

    return { success: true, uploadKey: file.uploadKey };
  } catch (error) {
    console.error("Erro ao excluir arquivo:", error);
    throw new Error("Falha ao excluir arquivo");
  }
}

/**
 * Busca arquivos expirados
 */
export async function getExpiredFiles() {
  try {
    const expiredFiles = await prisma.file.findMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    return expiredFiles;
  } catch (error) {
    console.error("Erro ao buscar arquivos expirados:", error);
    throw new Error("Falha ao buscar arquivos expirados");
  }
}

/**
 * Remove arquivos expirados do banco
 */
export async function cleanupExpiredFiles() {
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

    const expiredFiles = await getExpiredFiles();

    if (expiredFiles.length === 0) {
      return { deletedCount: 0, files: [] };
    }

    // Log de auditoria
    await createAuditLog("delete", "file", "cleanup", user.id, {
      action: "cleanup_expired",
      fileCount: expiredFiles.length,
      fileIds: expiredFiles.map((f) => f.id),
      source: "file_action",
    });

    await prisma.file.deleteMany({
      where: {
        id: {
          in: expiredFiles.map((f) => f.id),
        },
      },
    });

    return {
      deletedCount: expiredFiles.length,
      files: expiredFiles.map((f) => ({
        id: f.id,
        name: f.name,
        uploadKey: f.uploadKey,
      })),
    };
  } catch (error) {
    console.error("Erro ao limpar arquivos expirados:", error);
    throw new Error("Falha ao limpar arquivos expirados");
  }
}

/**
 * Busca arquivos por tipo MIME
 */
export async function getFilesByMimeType(mimeType: string, limit = 50) {
  try {
    const files = await prisma.file.findMany({
      where: {
        mimeType: {
          startsWith: mimeType,
        },
        expiresAt: {
          gt: new Date(), // Apenas arquivos não expirados
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return files;
  } catch (error) {
    console.error("Erro ao buscar arquivos por tipo:", error);
    throw new Error("Falha ao buscar arquivos por tipo");
  }
}

/**
 * Busca estatísticas de arquivos
 */
export async function getFileStats() {
  try {
    const [totalFiles, totalSize, expiredCount, imageCount, videoCount] = await Promise.all([
      prisma.file.count(),
      prisma.file.aggregate({
        _sum: { size: true },
      }),
      prisma.file.count({
        where: {
          expiresAt: {
            lte: new Date(),
          },
        },
      }),
      prisma.file.count({
        where: {
          mimeType: {
            startsWith: "image/",
          },
        },
      }),
      prisma.file.count({
        where: {
          mimeType: {
            startsWith: "video/",
          },
        },
      }),
    ]);

    return {
      totalFiles,
      totalSize: totalSize._sum.size || 0,
      expiredCount,
      imageCount,
      videoCount,
      otherCount: totalFiles - imageCount - videoCount,
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de arquivos:", error);
    throw new Error("Falha ao buscar estatísticas de arquivos");
  }
}

/**
 * Cria arquivo temporário (com expiração em 7 dias)
 */
export async function createTemporaryFile(data: {
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadKey: string;
  metadata?: any;
}) {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    return await createFileRecord({
      ...data,
      expiresAt,
    });
  } catch (error) {
    console.error("Erro ao criar arquivo temporário:", error);
    throw new Error("Falha ao criar arquivo temporário");
  }
}

/**
 * Converte arquivo temporário em permanente
 */
export async function makePermanentFile(fileId: string) {
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

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error("Arquivo não encontrado");
    }

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: { expiresAt: null },
    });

    // Log de auditoria
    await createAuditLog("update", "file", file.id, user.id, {
      fileName: file.name,
      action: "make_permanent",
      source: "file_action",
    });

    return updatedFile;
  } catch (error) {
    console.error("Erro ao tornar arquivo permanente:", error);
    throw new Error("Falha ao tornar arquivo permanente");
  }
}