"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "@/lib/db-utils";

/**
 * Busca usuário por Clerk ID
 */
export async function getUserByClerkId(clerkId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        plan: true,
        projects: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 5, // Últimos 5 projetos
        },
        _count: {
          select: {
            projects: true,
            executions: true,
            templates: true,
          },
        },
      },
    });

    return user;
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    throw new Error("Falha ao buscar usuário");
  }
}

/**
 * Cria um novo usuário no banco
 */
export async function createUser(data: {
  clerkId: string;
  email: string;
  name?: string | null;
  imageUrl?: string | null;
}) {
  try {
    // Buscar plano gratuito
    const freePlan = await prisma.plan.findUnique({
      where: { name: "free" },
    });

    if (!freePlan) {
      throw new Error("Plano gratuito não encontrado");
    }

    const user = await prisma.user.create({
      data: {
        clerkId: data.clerkId,
        email: data.email,
        name: data.name,
        imageUrl: data.imageUrl,
        planId: freePlan.id,
        credits: freePlan.credits,
      },
      include: { plan: true },
    });

    // Log de auditoria
    await createAuditLog("create", "user", user.id, user.id, {
      clerkId: data.clerkId,
      email: data.email,
      source: "user_action",
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return user;
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    throw new Error("Falha ao criar usuário");
  }
}

/**
 * Atualiza dados do usuário
 */
export async function updateUser(data: {
  clerkId: string;
  email?: string;
  name?: string | null;
  imageUrl?: string | null;
}) {
  try {
    const user = await prisma.user.update({
      where: { clerkId: data.clerkId },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      },
      include: { plan: true },
    });

    // Log de auditoria
    await createAuditLog("update", "user", user.id, user.id, {
      clerkId: data.clerkId,
      updatedFields: Object.keys(data).filter((key) => key !== "clerkId"),
      source: "user_action",
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return user;
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw new Error("Falha ao atualizar usuário");
  }
}

/**
 * Exclui usuário do banco
 */
export async function deleteUser(clerkId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Log de auditoria antes de excluir
    await createAuditLog("delete", "user", user.id, user.id, {
      clerkId,
      email: user.email,
      source: "user_action",
    });

    await prisma.user.delete({
      where: { clerkId },
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    throw new Error("Falha ao excluir usuário");
  }
}

/**
 * Atualiza perfil do usuário autenticado
 */
export async function updateProfile(data: { name?: string }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    if (data.name && (data.name.length < 2 || data.name.length > 100)) {
      throw new Error("Nome deve ter entre 2 e 100 caracteres");
    }

    const user = await prisma.user.update({
      where: { clerkId: userId },
      data: {
        ...(data.name && { name: data.name }),
      },
      include: { plan: true },
    });

    // Log de auditoria
    await createAuditLog("update", "user", user.id, user.id, {
      updatedFields: ["name"],
      source: "profile_update",
    });

    revalidatePath("/settings");

    return user;
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    throw new Error("Falha ao atualizar perfil");
  }
}

/**
 * Deduz créditos do usuário
 */
export async function deductCredits(clerkId: string, amount: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    if (user.credits < amount) {
      throw new Error("Créditos insuficientes");
    }

    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: {
        credits: {
          decrement: amount,
        },
      },
      include: { plan: true },
    });

    // Log de auditoria
    await createAuditLog("update", "user", user.id, user.id, {
      action: "deduct_credits",
      amount,
      previousCredits: user.credits,
      newCredits: updatedUser.credits,
      source: "credit_deduction",
    });

    revalidatePath("/dashboard");

    return updatedUser;
  } catch (error) {
    console.error("Erro ao deduzir créditos:", error);
    throw new Error("Falha ao deduzir créditos");
  }
}

/**
 * Adiciona créditos ao usuário
 */
export async function addCredits(clerkId: string, amount: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: {
        credits: {
          increment: amount,
        },
      },
      include: { plan: true },
    });

    // Log de auditoria
    await createAuditLog("update", "user", user.id, user.id, {
      action: "add_credits",
      amount,
      previousCredits: user.credits,
      newCredits: updatedUser.credits,
      source: "credit_addition",
    });

    revalidatePath("/dashboard");

    return updatedUser;
  } catch (error) {
    console.error("Erro ao adicionar créditos:", error);
    throw new Error("Falha ao adicionar créditos");
  }
}

/**
 * Atualiza plano do usuário
 */
export async function updateUserPlan(clerkId: string, planId: string) {
  try {
    const [user, plan] = await Promise.all([
      prisma.user.findUnique({ where: { clerkId } }),
      prisma.plan.findUnique({ where: { id: planId } }),
    ]);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    if (!plan) {
      throw new Error("Plano não encontrado");
    }

    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: {
        planId: plan.id,
        credits: plan.credits, // Resetar créditos para o novo plano
      },
      include: { plan: true },
    });

    // Log de auditoria
    await createAuditLog("update", "user", user.id, user.id, {
      action: "plan_change",
      previousPlanId: user.planId,
      newPlanId: plan.id,
      planName: plan.name,
      source: "plan_update",
    });

    revalidatePath("/dashboard");
    revalidatePath("/settings");

    return updatedUser;
  } catch (error) {
    console.error("Erro ao atualizar plano:", error);
    throw new Error("Falha ao atualizar plano");
  }
}
