"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { CreditTransactionType } from "@prisma/client";

// Buscar saldo de créditos do usuário
export async function getUserCredits() {
  const { userId } = await auth();
  if (!userId) throw new Error("Usuário não autenticado");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { credits: true },
  });

  // Se o usuário não existir no banco (race condition com webhook), retornar 0
  return user?.credits || 0;
}

// Buscar histórico de transações de créditos
export async function getCreditHistory(page = 1, limit = 20) {
  const { userId } = await auth();
  if (!userId) throw new Error("Usuário não autenticado");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  // Se o usuário não existir no banco (race condition com webhook), retornar dados vazios
  if (!user) {
    return {
      transactions: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0,
      },
    };
  }

  const transactions = await prisma.creditTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      purchase: {
        select: { amount: true, status: true },
      },
      execution: {
        select: { id: true, status: true },
      },
    },
  });

  const total = await prisma.creditTransaction.count({
    where: { userId: user.id },
  });

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

// Adicionar créditos ao usuário
export async function addCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  description: string,
  metadata?: any,
  purchaseId?: string,
  executionId?: string
) {
  return await prisma.$transaction(async (tx) => {
    // Atualizar saldo do usuário
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: amount,
        },
      },
    });

    // Criar registro da transação
    const transaction = await tx.creditTransaction.create({
      data: {
        userId,
        type,
        amount,
        description,
        metadata,
        purchaseId,
        executionId,
      },
    });

    return { user, transaction };
  });
}

// Consumir créditos do usuário
export async function consumeCredits(amount: number, description: string, metadata?: any, executionId?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Usuário não autenticado");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, credits: true },
  });

  if (!user) throw new Error("Usuário não encontrado");
  if (user.credits < amount) {
    throw new Error("Créditos insuficientes");
  }

  return await prisma.$transaction(async (tx) => {
    // Atualizar saldo do usuário
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        credits: {
          decrement: amount,
        },
      },
    });

    // Criar registro da transação
    const transaction = await tx.creditTransaction.create({
      data: {
        userId: user.id,
        type: CreditTransactionType.USAGE,
        amount: -amount, // Negativo para indicar consumo
        description,
        metadata,
        executionId,
      },
    });

    return { user: updatedUser, transaction };
  });
}

// Verificar se o usuário tem créditos suficientes
export async function hasEnoughCredits(amount: number) {
  const { userId } = await auth();
  if (!userId) return false;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { credits: true },
  });

  return (user?.credits || 0) >= amount;
}

// Dar bônus de boas-vindas para novos usuários
export async function giveWelcomeBonus(userClerkId: string) {
  console.log(`🎁 Iniciando processo de bônus de boas-vindas para usuário: ${userClerkId}`);

  const user = await prisma.user.findUnique({
    where: { clerkId: userClerkId },
    select: { id: true, credits: true, email: true },
  });

  if (!user) {
    console.error(`❌ Usuário não encontrado: ${userClerkId}`);
    throw new Error("Usuário não encontrado");
  }

  console.log(`📊 Usuário encontrado: ${user.email}, créditos atuais: ${user.credits}`);

  // Verificar se já recebeu o bônus (se tem mais de 0 créditos)
  if (user.credits > 0) {
    console.log(`⚠️ Usuário já possui ${user.credits} créditos, bônus não aplicado`);
    return null;
  }

  const welcomeCredits = 15;
  console.log(`💰 Aplicando bônus de ${welcomeCredits} créditos...`);

  try {
    const result = await addCredits(
      user.id,
      welcomeCredits,
      CreditTransactionType.WELCOME_BONUS,
      "Bônus de boas-vindas - 15 créditos gratuitos!"
    );

    console.log(`✅ Bônus aplicado com sucesso! Novos créditos: ${result.user.credits}`);
    return result;
  } catch (error) {
    console.error(`❌ Erro ao aplicar bônus:`, error);
    throw error;
  }
}

// Buscar estatísticas de uso de créditos
export async function getCreditStats() {
  const { userId } = await auth();
  if (!userId) throw new Error("Usuário não autenticado");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  // Se o usuário não existir no banco (race condition com webhook), retornar dados vazios
  if (!user) {
    return {
      totalSpent: 0,
      totalEarned: 0,
      recentTransactions: [],
    };
  }

  const [totalSpent, totalEarned, last30Days] = await Promise.all([
    // Total gasto
    prisma.creditTransaction.aggregate({
      where: {
        userId: user.id,
        amount: { lt: 0 },
      },
      _sum: { amount: true },
    }),

    // Total ganho
    prisma.creditTransaction.aggregate({
      where: {
        userId: user.id,
        amount: { gt: 0 },
      },
      _sum: { amount: true },
    }),

    // Últimos 30 dias
    prisma.creditTransaction.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return {
    totalSpent: Math.abs(totalSpent._sum.amount || 0),
    totalEarned: totalEarned._sum.amount || 0,
    recentTransactions: last30Days,
  };
}

// Dar créditos do primeiro mês para novos usuários
export async function giveFirstMonthCredits(userClerkId: string) {
  console.log(`📅 Iniciando processo de créditos do primeiro mês para usuário: ${userClerkId}`);

  const user = await prisma.user.findUnique({
    where: { clerkId: userClerkId },
    select: { id: true, credits: true, email: true, lastFreeCreditsDate: true },
  });

  if (!user) {
    console.error(`❌ Usuário não encontrado: ${userClerkId}`);
    throw new Error("Usuário não encontrado");
  }

  console.log(`📊 Usuário encontrado: ${user.email}, créditos atuais: ${user.credits}`);

  // Verificar se já recebeu créditos mensais (se lastFreeCreditsDate existe)
  if (user.lastFreeCreditsDate) {
    console.log(`⚠️ Usuário já recebeu créditos mensais, não aplicando primeiro mês`);
    return null;
  }

  const firstMonthCredits = 20;
  const now = new Date();
  console.log(`💰 Aplicando créditos do primeiro mês: ${firstMonthCredits} créditos...`);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar saldo e data dos créditos gratuitos
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          credits: {
            increment: firstMonthCredits,
          },
          lastFreeCreditsDate: now,
        },
      });

      // Criar registro da transação
      const transaction = await tx.creditTransaction.create({
        data: {
          userId: user.id,
          type: CreditTransactionType.MONTHLY_FREE,
          amount: firstMonthCredits,
          description: `Créditos do primeiro mês - ${now.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          })}`,
          metadata: {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            previousBalance: user.credits,
            isFirstMonth: true,
          },
        },
      });

      return { user: updatedUser, transaction };
    });

    console.log(`✅ Créditos do primeiro mês aplicados! Novos créditos: ${result.user.credits}`);
    return result;
  } catch (error) {
    console.error(`❌ Erro ao aplicar créditos do primeiro mês:`, error);
    throw error;
  }
}

// Verificar e adicionar créditos mensais gratuitos
export async function checkAndAddMonthlyCredits() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      credits: true,
      lastFreeCreditsDate: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Verificar se já recebeu créditos este mês
  if (user.lastFreeCreditsDate) {
    const lastCreditMonth = user.lastFreeCreditsDate.getMonth();
    const lastCreditYear = user.lastFreeCreditsDate.getFullYear();

    // Se já recebeu este mês, não dar mais créditos
    if (lastCreditMonth === currentMonth && lastCreditYear === currentYear) {
      return null;
    }
  }

  // Verificar se a conta tem pelo menos 1 dia (evitar dar créditos imediatamente após criação)
  const accountAge = now.getTime() - user.createdAt.getTime();
  const oneDayInMs = 24 * 60 * 60 * 1000;

  if (accountAge < oneDayInMs) {
    return null;
  }

  const monthlyCredits = 20;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar saldo e data dos créditos gratuitos
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          credits: {
            increment: monthlyCredits,
          },
          lastFreeCreditsDate: now,
        },
      });

      // Criar registro da transação
      const transaction = await tx.creditTransaction.create({
        data: {
          userId: user.id,
          type: CreditTransactionType.MONTHLY_FREE,
          amount: monthlyCredits,
          description: `Créditos gratuitos mensais - ${now.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          })}`,
          metadata: {
            month: currentMonth + 1,
            year: currentYear,
            previousBalance: user.credits,
          },
        },
      });

      return { user: updatedUser, transaction };
    });

    return result;
  } catch (error) {
    console.error("Erro ao adicionar créditos mensais:", error);
    return null;
  }
}
