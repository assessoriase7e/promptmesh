"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/db-utils";
import { currentUser } from "@clerk/nextjs/server";
import { giveWelcomeBonus, giveFirstMonthCredits } from "./credit-actions";
import { prisma } from "@/lib/prisma";

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
 * Garante que o usuário existe no banco de dados
 * Resolve problema de timing entre Clerk e webhook
 */
export async function ensureUserExists() {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    // Buscar dados do Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      throw new Error("Usuário não encontrado no Clerk");
    }

    // Buscar plano gratuito
    const freePlan = await prisma.plan.findUnique({
      where: { name: "free" },
    });

    if (!freePlan) {
      throw new Error("Plano gratuito não encontrado");
    }

    // Usar upsert para evitar race condition
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        // Atualizar dados se o usuário já existe
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: clerkUser.fullName,
        imageUrl: clerkUser.imageUrl,
      },
      create: {
        // Criar usuário se não existe
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: clerkUser.fullName,
        imageUrl: clerkUser.imageUrl,
        planId: freePlan.id,
        credits: freePlan.credits,
      },
      include: { plan: true },
    });

    // Verificar se é um usuário novo (sem créditos de bônus ainda)
    const isNewUser = user.credits === freePlan.credits;

    if (isNewUser) {
      console.log(`✅ Novo usuário criado: ${userId}`);

      // Log de auditoria apenas para novos usuários
      await createAuditLog("create", "user", user.id, user.id, {
        clerkId: userId,
        email: user.email,
        source: "ensure_user_exists",
      });

      // Aplicar créditos de boas-vindas e primeiro mês apenas para novos usuários
      try {
        // Aplicar bônus de boas-vindas (15 créditos)
        const bonusResult = await giveWelcomeBonus(userId);
        if (bonusResult) {
          console.log(`✅ Bônus de boas-vindas aplicado via ensureUserExists: ${userId}`);
        }

        // Aplicar créditos do primeiro mês (20 créditos)
        const firstMonthResult = await giveFirstMonthCredits(userId);
        if (firstMonthResult) {
          console.log(`✅ Créditos do primeiro mês aplicados via ensureUserExists: ${userId}`);
          console.log(`🎯 Total de créditos: ${firstMonthResult.user.credits}`);
        }
      } catch (creditError) {
        console.error("❌ Erro ao aplicar créditos via ensureUserExists:", creditError);
        // Não falhar a criação do usuário por causa dos créditos
      }
    } else {
      console.log(`✅ Usuário existente encontrado: ${userId}`);
    }

    return user;
  } catch (error) {
    console.error("Erro ao garantir existência do usuário:", error);
    throw new Error("Falha ao garantir existência do usuário");
  }
}

/**
 * Cria um novo usuário no banco (ou retorna existente se já existe)
 */
export async function createUser(data: {
  clerkId: string;
  email: string;
  name?: string | null;
  imageUrl?: string | null;
}) {
  try {
    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: data.clerkId },
      include: { plan: true },
    });

    if (existingUser) {
      console.log(`✅ Usuário já existe: ${data.clerkId}`);
      return existingUser;
    }

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

    console.log(`✅ Novo usuário criado: ${data.clerkId}`);

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
