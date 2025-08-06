"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/db-utils";

/**
 * Busca configuração do sistema por chave
 */
export async function getSystemConfig(key: string) {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key },
    });

    return config;
  } catch (error) {
    console.error("Erro ao buscar configuração do sistema:", error);
    throw new Error("Falha ao buscar configuração do sistema");
  }
}

/**
 * Busca todas as configurações do sistema
 */
export async function getAllSystemConfigs() {
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

    // Verificar se o usuário é admin (assumindo que existe um campo role ou similar)
    // Por enquanto, vamos permitir apenas para usuários específicos
    const configs = await prisma.systemConfig.findMany({
      orderBy: { key: "asc" },
    });

    return configs;
  } catch (error) {
    console.error("Erro ao buscar configurações do sistema:", error);
    throw new Error("Falha ao buscar configurações do sistema");
  }
}

/**
 * Define ou atualiza configuração do sistema
 */
export async function setSystemConfig(
  key: string,
  value: any
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

    if (!key || key.trim().length === 0) {
      throw new Error("Chave da configuração é obrigatória");
    }

    const existingConfig = await prisma.systemConfig.findUnique({
      where: { key },
    });

    let config;
    let action: "create" | "update";

    if (existingConfig) {
      config = await prisma.systemConfig.update({
        where: { key },
        data: {
          value,
        },
      });
      action = "update";
    } else {
      config = await prisma.systemConfig.create({
        data: {
          key: key.trim(),
          value,
        },
      });
      action = "create";
    }

    // Log de auditoria
    await createAuditLog(action, "system_config", config.id, user.id, {
      configKey: config.key,
      source: "system_config_action",
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin");

    return config;
  } catch (error) {
    console.error("Erro ao definir configuração do sistema:", error);
    throw new Error("Falha ao definir configuração do sistema");
  }
}

/**
 * Remove configuração do sistema
 */
export async function deleteSystemConfig(key: string) {
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

    const config = await prisma.systemConfig.findUnique({
      where: { key },
    });

    if (!config) {
      throw new Error("Configuração não encontrada");
    }

    // Log de auditoria antes de excluir
    await createAuditLog("delete", "system_config", config.id, user.id, {
      configKey: config.key,
      source: "system_config_action",
    });

    await prisma.systemConfig.delete({
      where: { key },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir configuração do sistema:", error);
    throw new Error("Falha ao excluir configuração do sistema");
  }
}

/**
 * Busca configurações por prefixo
 */
export async function getSystemConfigsByPrefix(prefix: string) {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          startsWith: prefix,
        },
      },
      orderBy: { key: "asc" },
    });

    return configs;
  } catch (error) {
    console.error("Erro ao buscar configurações por prefixo:", error);
    throw new Error("Falha ao buscar configurações por prefixo");
  }
}

/**
 * Atualiza múltiplas configurações de uma vez
 */
export async function updateMultipleSystemConfigs(
  configs: Array<{ key: string; value: any }>
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

    if (!configs || configs.length === 0) {
      throw new Error("Nenhuma configuração fornecida");
    }

    const results = [];

    for (const configData of configs) {
      if (!configData.key || configData.key.trim().length === 0) {
        continue;
      }

      const existingConfig = await prisma.systemConfig.findUnique({
        where: { key: configData.key },
      });

      let config;
      let action: "create" | "update";

      if (existingConfig) {
        config = await prisma.systemConfig.update({
            where: { key: configData.key },
            data: {
              value: configData.value,
            },
          });
        action = "update";
      } else {
        config = await prisma.systemConfig.create({
          data: {
            key: configData.key,
            value: configData.value,
          },
        });
        action = "create";
      }

      // Log de auditoria
      await createAuditLog(action, "system_config", config.id, user.id, {
        configKey: config.key,
        batchUpdate: true,
        source: "system_config_action",
      });

      results.push(config);
    }

    revalidatePath("/admin/settings");
    revalidatePath("/admin");

    return results;
  } catch (error) {
    console.error("Erro ao atualizar múltiplas configurações:", error);
    throw new Error("Falha ao atualizar múltiplas configurações");
  }
}

/**
 * Busca valor de configuração com fallback
 */
export async function getSystemConfigValue(key: string, defaultValue?: any) {
  try {
    const config = await getSystemConfig(key);
    return config ? config.value : defaultValue;
  } catch (error) {
    console.error("Erro ao buscar valor da configuração:", error);
    return defaultValue;
  }
}

/**
 * Verifica se uma configuração existe
 */
export async function systemConfigExists(key: string) {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key },
      select: { id: true },
    });

    return !!config;
  } catch (error) {
    console.error("Erro ao verificar existência da configuração:", error);
    return false;
  }
}

/**
 * Busca configurações de API (chaves, endpoints, etc.)
 */
export async function getApiConfigs() {
  try {
    return await getSystemConfigsByPrefix("api.");
  } catch (error) {
    console.error("Erro ao buscar configurações de API:", error);
    throw new Error("Falha ao buscar configurações de API");
  }
}

/**
 * Busca configurações de UI/UX
 */
export async function getUiConfigs() {
  try {
    return await getSystemConfigsByPrefix("ui.");
  } catch (error) {
    console.error("Erro ao buscar configurações de UI:", error);
    throw new Error("Falha ao buscar configurações de UI");
  }
}

/**
 * Busca configurações de limites e quotas
 */
export async function getLimitConfigs() {
  try {
    return await getSystemConfigsByPrefix("limit.");
  } catch (error) {
    console.error("Erro ao buscar configurações de limites:", error);
    throw new Error("Falha ao buscar configurações de limites");
  }
}

/**
 * Busca configurações de features/funcionalidades
 */
export async function getFeatureConfigs() {
  try {
    return await getSystemConfigsByPrefix("feature.");
  } catch (error) {
    console.error("Erro ao buscar configurações de features:", error);
    throw new Error("Falha ao buscar configurações de features");
  }
}

/**
 * Exporta todas as configurações para backup
 */
export async function exportSystemConfigs() {
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

    const configs = await getAllSystemConfigs();

    // Log de auditoria
    await createAuditLog("read", "system_config", "export", user.id, {
      action: "export_all",
      configCount: configs.length,
      source: "system_config_action",
    });

    return {
      exportDate: new Date().toISOString(),
      configCount: configs.length,
      configs: configs.map((config) => ({
        key: config.key,
        value: config.value,
      })),
    };
  } catch (error) {
    console.error("Erro ao exportar configurações:", error);
    throw new Error("Falha ao exportar configurações");
  }
}

/**
 * Importa configurações de backup
 */
export async function importSystemConfigs(
  configsData: Array<{ key: string; value: any; description?: string }>
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

    if (!configsData || configsData.length === 0) {
      throw new Error("Nenhuma configuração para importar");
    }

    const results = await updateMultipleSystemConfigs(configsData);

    // Log de auditoria
    await createAuditLog("create", "system_config", "import", user.id, {
      action: "import_all",
      configCount: results.length,
      source: "system_config_action",
    });

    return {
      importedCount: results.length,
      configs: results,
    };
  } catch (error) {
    console.error("Erro ao importar configurações:", error);
    throw new Error("Falha ao importar configurações");
  }
}