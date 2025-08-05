"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "@/lib/db-utils";

interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Busca logs de auditoria com filtros e paginação
 */
export const getAuditLogs = async ({
  page = 1,
  limit = 20,
  action,
  entityType,
  entityId,
  userId,
  startDate,
  endDate,
}: GetAuditLogsParams = {}) => {
  try {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.resource = entityType;
    }

    if (entityId) {
      where.resourceId = entityId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return {
      success: false,
      error: 'Erro ao buscar logs de auditoria',
    };
  }
}

/**
 * Busca log de auditoria por ID
 */
export async function getAuditLogById(logId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const log = await prisma.auditLog.findUnique({
      where: { id: logId },
    });

    if (!log) {
      throw new Error("Log de auditoria não encontrado");
    }

    return log;
  } catch (error) {
    console.error("Erro ao buscar log de auditoria:", error);
    throw new Error("Falha ao buscar log de auditoria");
  }
}

/**
 * Busca logs de auditoria por entidade
 */
export async function getAuditLogsByEntity(entityType: string, entityId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        resource: entityType,
        resourceId: entityId,
      },
      orderBy: { createdAt: "desc" },
    });

    return logs;
  } catch (error) {
    console.error("Erro ao buscar logs por entidade:", error);
    throw new Error("Falha ao buscar logs por entidade");
  }
}

/**
 * Busca logs de auditoria por usuário
 */
export async function getAuditLogsByUser(targetUserId: string, params: {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
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

    const page = params.page || 1;
    const limit = Math.min(params.limit || 50, 100);
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {
      userId: targetUserId,
    };

    if (params.action) {
      where.action = params.action;
    }

    if (params.entityType) {
      where.resource = params.entityType;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar logs por usuário:", error);
    throw new Error("Falha ao buscar logs por usuário");
  }
}

/**
 * Cria um log de auditoria manual
 */
export const createManualAuditLog = async (
  action: string,
  entityType: string,
  entityId: string,
  metadata?: any
) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: 'Usuário não autenticado',
      };
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return {
        success: false,
        error: 'Usuário não encontrado',
      };
    }

    const log = await prisma.auditLog.create({
      data: {
        action,
        resource: entityType,
        resourceId: entityId,
        userId: user.id,
        metadata,
      },
    });

    return {
      success: true,
      data: log,
    };
  } catch (error) {
    console.error('Error creating manual audit log:', error);
    return {
      success: false,
      error: 'Erro ao criar log de auditoria',
    };
  }
};

/**
 * Busca estatísticas de auditoria
 */
export async function getAuditStats(params: {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    // Construir filtros
    const where: any = {};

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    const [
      totalLogs,
      actionStats,
      entityTypeStats,
      userStats,
      dailyStats,
    ] = await Promise.all([
      // Total de logs
      prisma.auditLog.count({ where }),

      // Estatísticas por ação
      prisma.auditLog.groupBy({
        by: ["action"],
        where,
        _count: { action: true },
        orderBy: { _count: { action: "desc" } },
      }),

      // Estatísticas por tipo de entidade
      prisma.auditLog.groupBy({
        by: ["resource"],
        where,
        _count: { resource: true },
        orderBy: { _count: { resource: "desc" } },
      }),

      // Estatísticas por usuário (top 10)
      prisma.auditLog.groupBy({
        by: ["userId"],
        where,
        _count: { userId: true },
        orderBy: { _count: { userId: "desc" } },
        take: 10,
      }),

      // Estatísticas diárias (últimos 30 dias)
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM audit_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ${params.userId ? `AND user_id = ${params.userId}` : ''}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `,
    ]);

    // Buscar informações dos usuários para as estatísticas
    const userIds = userStats.map((stat) => stat.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const userStatsWithInfo = userStats.map((stat) => {
      const user = users.find((u) => u.id === stat.userId);
      return {
        ...stat,
        user,
      };
    });

    return {
      totalLogs,
      actionStats: actionStats.map((stat) => ({
        action: stat.action,
        count: stat._count.action,
      })),
      entityTypeStats: entityTypeStats.map((stat) => ({
        entityType: stat.resource,
        count: stat._count.resource,
      })),
      userStats: userStatsWithInfo,
      dailyStats,
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de auditoria:", error);
    throw new Error("Falha ao buscar estatísticas de auditoria");
  }
}

/**
 * Limpa logs de auditoria antigos
 */
export async function cleanupOldAuditLogs(daysToKeep = 90) {
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

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deletedCount = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    // Log da limpeza
    await createAuditLog("delete", "audit_log", "cleanup", user.id, {
      action: "cleanup_old_logs",
      daysToKeep,
      deletedCount: deletedCount.count,
      cutoffDate: cutoffDate.toISOString(),
      source: "audit_action",
    });

    return {
      deletedCount: deletedCount.count,
      cutoffDate,
    };
  } catch (error) {
    console.error("Erro ao limpar logs antigos:", error);
    throw new Error("Falha ao limpar logs antigos");
  }
}

/**
 * Exporta logs de auditoria para CSV
 */
export async function exportAuditLogs(params: {
  action?: string;
  entityType?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
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

    // Construir filtros
    const where: any = {};

    if (params.action) {
      where.action = params.action;
    }

    if (params.entityType) {
      where.resource = params.entityType;
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10000, // Limite para evitar sobrecarga
    });

    // Log da exportação
    await createAuditLog("read", "audit_log", "export", user.id, {
      action: "export_logs",
      logCount: logs.length,
      filters: params,
      source: "audit_action",
    });

    return {
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.resource,
        entityId: log.resourceId,
        userId: log.userId,
        metadata: JSON.stringify(log.metadata),
        createdAt: log.createdAt.toISOString(),
      })),
      exportDate: new Date().toISOString(),
      totalCount: logs.length,
    };
  } catch (error) {
    console.error("Erro ao exportar logs de auditoria:", error);
    throw new Error("Falha ao exportar logs de auditoria");
  }
}

/**
 * Busca ações disponíveis para filtros
 */
export async function getAvailableActions() {
  try {
    const actions = await prisma.auditLog.findMany({
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" },
    });

    return actions.map((a) => a.action);
  } catch (error) {
    console.error("Erro ao buscar ações disponíveis:", error);
    throw new Error("Falha ao buscar ações disponíveis");
  }
}

/**
 * Busca tipos de entidade disponíveis para filtros
 */
export async function getAvailableEntityTypes() {
  try {
    const entityTypes = await prisma.auditLog.findMany({
      select: { resource: true },
      distinct: ["resource"],
      orderBy: { resource: "asc" },
    });

    return entityTypes.map((e) => e.resource);
  } catch (error) {
    console.error("Erro ao buscar tipos de entidade disponíveis:", error);
    throw new Error("Falha ao buscar tipos de entidade disponíveis");
  }
}