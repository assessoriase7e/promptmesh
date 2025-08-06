"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/db-utils";

/**
 * Busca todos os planos disponíveis
 */
export async function getAllPlans() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { price: "asc" },
    });

    return plans;
  } catch (error) {
    console.error("Erro ao buscar planos:", error);
    throw new Error("Falha ao buscar planos");
  }
}

/**
 * Busca plano por ID
 */
export async function getPlanById(planId: string) {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            planId: true,
          },
        },
      },
    });

    if (!plan) {
      throw new Error("Plano não encontrado");
    }

    return plan;
  } catch (error) {
    console.error("Erro ao buscar plano:", error);
    throw new Error("Falha ao buscar plano");
  }
}

/**
 * Cria novo plano
 */
export async function createPlan(data: {
  name: string;
  displayName: string;
  price: number;
  credits: number;
  features: string[];
  isActive?: boolean;
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
      throw new Error("Nome do plano é obrigatório");
    }

    if (!data.displayName || data.displayName.trim().length === 0) {
      throw new Error("Nome de exibição do plano é obrigatório");
    }

    if (data.price < 0) {
      throw new Error("Preço não pode ser negativo");
    }

    if (data.credits < 0) {
      throw new Error("Créditos não podem ser negativos");
    }

    // Verificar se já existe um plano com o mesmo nome
    const existingPlan = await prisma.plan.findFirst({
      where: { name: data.name.trim() },
    });

    if (existingPlan) {
      throw new Error("Já existe um plano com este nome");
    }

    const plan = await prisma.plan.create({
      data: {
        name: data.name.trim(),
        displayName: data.displayName.trim(),
        price: data.price,
        credits: data.credits,
        features: data.features || [],
        isActive: data.isActive ?? true,
      },
    });

    // Log de auditoria
    await createAuditLog("create", "plan", plan.id, user.id, {
      planName: plan.name,
      displayName: plan.displayName,
      price: plan.price,
      credits: plan.credits,
      featuresCount: Array.isArray(plan.features) ? plan.features.length : 0,
      source: "plan_action",
    });

    revalidatePath("/admin/plans");
    revalidatePath("/pricing");

    return plan;
  } catch (error) {
    console.error("Erro ao criar plano:", error);
    throw new Error("Falha ao criar plano");
  }
}

/**
 * Atualiza plano existente
 */
export async function updatePlan(
  planId: string,
  data: {
    name?: string;
    displayName?: string;
    price?: number;
    credits?: number;
    features?: string[];
    isActive?: boolean;
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

    const existingPlan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!existingPlan) {
      throw new Error("Plano não encontrado");
    }

    // Validações
    if (data.name && data.name.trim().length === 0) {
      throw new Error("Nome do plano não pode estar vazio");
    }

    if (data.displayName && data.displayName.trim().length === 0) {
      throw new Error("Nome de exibição do plano não pode estar vazio");
    }

    if (data.price !== undefined && data.price < 0) {
      throw new Error("Preço não pode ser negativo");
    }

    if (data.credits !== undefined && data.credits < 0) {
      throw new Error("Créditos não podem ser negativos");
    }

    // Verificar se o novo nome já existe (se estiver sendo alterado)
    if (data.name && data.name.trim() !== existingPlan.name) {
      const nameExists = await prisma.plan.findFirst({
        where: {
          name: data.name.trim(),
          id: { not: planId },
        },
      });

      if (nameExists) {
        throw new Error("Já existe um plano com este nome");
      }
    }

    const updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName.trim();
    }
    if (data.price !== undefined) {
      updateData.price = data.price;
    }
    if (data.credits !== undefined) {
      updateData.credits = data.credits;
    }
    if (data.features !== undefined) {
      updateData.features = data.features;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    const plan = await prisma.plan.update({
      where: { id: planId },
      data: updateData,
    });

    // Log de auditoria
    await createAuditLog("update", "plan", plan.id, user.id, {
      planName: plan.name,
      updatedFields: Object.keys(updateData),
      source: "plan_action",
    });

    revalidatePath("/admin/plans");
    revalidatePath("/pricing");

    return plan;
  } catch (error) {
    console.error("Erro ao atualizar plano:", error);
    throw new Error("Falha ao atualizar plano");
  }
}

/**
 * Exclui plano
 */
export async function deletePlan(planId: string) {
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

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        users: true,
      },
    });

    if (!plan) {
      throw new Error("Plano não encontrado");
    }

    // Verificar se há usuários usando este plano
    if (plan.users.length > 0) {
      throw new Error("Não é possível excluir um plano que possui usuários associados");
    }

    // Log de auditoria antes de excluir
    await createAuditLog("delete", "plan", plan.id, user.id, {
      planName: plan.name,
      price: plan.price,
      credits: plan.credits,
      source: "plan_action",
    });

    await prisma.plan.delete({
      where: { id: planId },
    });

    revalidatePath("/admin/plans");
    revalidatePath("/pricing");

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir plano:", error);
    throw new Error("Falha ao excluir plano");
  }
}

/**
 * Busca planos ativos
 */
export async function getActivePlans() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });

    return plans;
  } catch (error) {
    console.error("Erro ao buscar planos ativos:", error);
    throw new Error("Falha ao buscar planos ativos");
  }
}

/**
 * Busca estatísticas de planos
 */
export async function getPlanStats() {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const [totalPlans, activePlans, planUsage] = await Promise.all([
      prisma.plan.count(),
      prisma.plan.count({ where: { isActive: true } }),
      prisma.plan.findMany({
        include: {
          _count: {
            select: { users: true },
          },
        },
        orderBy: { price: "asc" },
      }),
    ]);

    const planStatsWithUsage = planUsage.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      credits: plan.credits,
      isActive: plan.isActive,
      userCount: plan._count.users,
      revenue: plan.price * plan._count.users,
    }));

    const totalRevenue = planStatsWithUsage.reduce((sum, plan) => sum + plan.revenue, 0);

    const totalUsers = planStatsWithUsage.reduce((sum, plan) => sum + plan.userCount, 0);

    return {
      totalPlans,
      activePlans,
      inactivePlans: totalPlans - activePlans,
      totalUsers,
      totalRevenue,
      planUsage: planStatsWithUsage,
      averageRevenuePerUser: totalUsers > 0 ? totalRevenue / totalUsers : 0,
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de planos:", error);
    throw new Error("Falha ao buscar estatísticas de planos");
  }
}

/**
 * Ativa ou desativa plano
 */
export async function togglePlanStatus(planId: string) {
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

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error("Plano não encontrado");
    }

    const updatedPlan = await prisma.plan.update({
      where: { id: planId },
      data: { isActive: !plan.isActive },
    });

    // Log de auditoria
    await createAuditLog("update", "plan", plan.id, user.id, {
      planName: plan.name,
      action: updatedPlan.isActive ? "activated" : "deactivated",
      source: "plan_action",
    });

    revalidatePath("/admin/plans");
    revalidatePath("/pricing");

    return updatedPlan;
  } catch (error) {
    console.error("Erro ao alterar status do plano:", error);
    throw new Error("Falha ao alterar status do plano");
  }
}

/**
 * Busca usuários de um plano específico
 */
export async function getPlanUsers(
  planId: string,
  params: {
    page?: number;
    limit?: number;
  }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error("Plano não encontrado");
    }

    const page = params.page || 1;
    const limit = Math.min(params.limit || 50, 100);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { planId },
        select: {
          id: true,
          email: true,
          name: true,
          credits: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: { planId } }),
    ]);

    return {
      plan,
      users,
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
    console.error("Erro ao buscar usuários do plano:", error);
    throw new Error("Falha ao buscar usuários do plano");
  }
}

/**
 * Migra usuários de um plano para outro
 */
export async function migrateUsersToNewPlan(fromPlanId: string, toPlanId: string, userIds?: string[]) {
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

    const [fromPlan, toPlan] = await Promise.all([
      prisma.plan.findUnique({ where: { id: fromPlanId } }),
      prisma.plan.findUnique({ where: { id: toPlanId } }),
    ]);

    if (!fromPlan || !toPlan) {
      throw new Error("Plano de origem ou destino não encontrado");
    }

    // Construir filtro para usuários
    const where: any = { planId: fromPlanId };
    if (userIds && userIds.length > 0) {
      where.id = { in: userIds };
    }

    // Buscar usuários a serem migrados
    const usersToMigrate = await prisma.user.findMany({
      where,
      select: { id: true, email: true, name: true },
    });

    if (usersToMigrate.length === 0) {
      throw new Error("Nenhum usuário encontrado para migração");
    }

    // Realizar a migração
    const result = await prisma.user.updateMany({
      where,
      data: { planId: toPlanId },
    });

    // Log de auditoria
    await createAuditLog("update", "plan", "migration", user.id, {
      action: "migrate_users",
      fromPlan: fromPlan.name,
      toPlan: toPlan.name,
      userCount: result.count,
      userIds: usersToMigrate.map((u) => u.id),
      source: "plan_action",
    });

    revalidatePath("/admin/plans");
    revalidatePath("/admin/users");

    return {
      migratedCount: result.count,
      fromPlan,
      toPlan,
      users: usersToMigrate,
    };
  } catch (error) {
    console.error("Erro ao migrar usuários:", error);
    throw new Error("Falha ao migrar usuários");
  }
}

/**
 * Duplica plano existente
 */
export async function duplicatePlan(planId: string, newName: string) {
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

    const originalPlan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!originalPlan) {
      throw new Error("Plano original não encontrado");
    }

    if (!newName || newName.trim().length === 0) {
      throw new Error("Nome do novo plano é obrigatório");
    }

    // Verificar se já existe um plano com o novo nome
    const existingPlan = await prisma.plan.findFirst({
      where: { name: newName.trim() },
    });

    if (existingPlan) {
      throw new Error("Já existe um plano com este nome");
    }

    const newPlan = await prisma.plan.create({
      data: {
        name: newName.trim(),
        displayName: originalPlan.displayName,
        price: originalPlan.price,
        credits: originalPlan.credits,
        features: originalPlan.features,
        isActive: false, // Novo plano começa inativo
      },
    });

    // Log de auditoria
    await createAuditLog("create", "plan", newPlan.id, user.id, {
      action: "duplicate_plan",
      originalPlanId: originalPlan.id,
      originalPlanName: originalPlan.name,
      newPlanName: newPlan.name,
      source: "plan_action",
    });

    revalidatePath("/admin/plans");

    return newPlan;
  } catch (error) {
    console.error("Erro ao duplicar plano:", error);
    throw new Error("Falha ao duplicar plano");
  }
}
