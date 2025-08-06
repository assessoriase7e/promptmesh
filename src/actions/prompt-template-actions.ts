'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Schemas de validação
const createPromptTemplateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  prompt: z.string().min(1, 'Prompt é obrigatório').max(5000, 'Prompt muito longo'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  tags: z.array(z.string()).optional().default([]),
});

const updatePromptTemplateSchema = createPromptTemplateSchema.partial().extend({
  id: z.string().min(1, 'ID é obrigatório'),
});

// Buscar todas as categorias de prompts
export const getPromptCategories = async () => {
  try {
    const categories = await prisma.promptCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { templates: true }
        }
      }
    });

    return { success: true, categories };
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return { success: false, error: 'Erro ao buscar categorias' };
  }
};

// Buscar templates de prompts do usuário
export const getUserPromptTemplates = async () => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Buscar templates do usuário + templates oficiais
    const templates = await prisma.promptTemplate.findMany({
      where: {
        OR: [
          { userId },
          { isOfficial: true }
        ]
      },
      include: {
        category: true,
        user: {
          select: { name: true, imageUrl: true }
        }
      },
      orderBy: [
        { isOfficial: 'desc' }, // Oficiais primeiro
        { usageCount: 'desc' }, // Mais usados primeiro
        { createdAt: 'desc' }   // Mais recentes primeiro
      ]
    });

    return { success: true, templates };
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    return { success: false, error: 'Erro ao buscar templates' };
  }
};

// Buscar templates por categoria
export const getPromptTemplatesByCategory = async (categoryId: string) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const templates = await prisma.promptTemplate.findMany({
      where: {
        categoryId,
        OR: [
          { userId },
          { isOfficial: true }
        ]
      },
      include: {
        category: true,
        user: {
          select: { name: true, imageUrl: true }
        }
      },
      orderBy: [
        { isOfficial: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return { success: true, templates };
  } catch (error) {
    console.error('Erro ao buscar templates por categoria:', error);
    return { success: false, error: 'Erro ao buscar templates' };
  }
};

// Buscar templates mais usados
export const getMostUsedPromptTemplates = async (limit: number = 5) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const templates = await prisma.promptTemplate.findMany({
      where: {
        OR: [
          { userId },
          { isOfficial: true }
        ]
      },
      include: {
        category: true,
        user: {
          select: { name: true, imageUrl: true }
        }
      },
      orderBy: { usageCount: 'desc' },
      take: limit
    });

    return { success: true, templates };
  } catch (error) {
    console.error('Erro ao buscar templates mais usados:', error);
    return { success: false, error: 'Erro ao buscar templates' };
  }
};

// Buscar templates por texto
export const searchPromptTemplates = async (query: string) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    if (!query.trim()) {
      return getUserPromptTemplates();
    }

    const templates = await prisma.promptTemplate.findMany({
      where: {
        AND: [
          {
            OR: [
              { userId },
              { isOfficial: true }
            ]
          },
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { prompt: { contains: query, mode: 'insensitive' } },
              { tags: { has: query.toLowerCase() } }
            ]
          }
        ]
      },
      include: {
        category: true,
        user: {
          select: { name: true, imageUrl: true }
        }
      },
      orderBy: [
        { isOfficial: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return { success: true, templates };
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    return { success: false, error: 'Erro ao buscar templates' };
  }
};

// Criar template de prompt
export const createPromptTemplate = async (data: z.infer<typeof createPromptTemplateSchema>) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const validatedData = createPromptTemplateSchema.parse(data);

    // Verificar se a categoria existe
    const category = await prisma.promptCategory.findUnique({
      where: { id: validatedData.categoryId }
    });

    if (!category) {
      return { success: false, error: 'Categoria não encontrada' };
    }

    const template = await prisma.promptTemplate.create({
      data: {
        ...validatedData,
        userId,
        tags: validatedData.tags.map(tag => tag.toLowerCase().trim())
      },
      include: {
        category: true,
        user: {
          select: { name: true, imageUrl: true }
        }
      }
    });

    revalidatePath('/editor');
    revalidatePath('/projects');

    return { success: true, template };
  } catch (error) {
    console.error('Erro ao criar template:', error);
    return { success: false, error: 'Erro ao criar template' };
  }
};

// Atualizar template de prompt
export const updatePromptTemplate = async (data: z.infer<typeof updatePromptTemplateSchema>) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const validatedData = updatePromptTemplateSchema.parse(data);

    // Verificar se o template existe e pertence ao usuário
    const existingTemplate = await prisma.promptTemplate.findUnique({
      where: { id: validatedData.id }
    });

    if (!existingTemplate) {
      return { success: false, error: 'Template não encontrado' };
    }

    if (existingTemplate.userId !== userId && !existingTemplate.isOfficial) {
      return { success: false, error: 'Sem permissão para editar este template' };
    }

    // Se mudou a categoria, verificar se existe
    if (validatedData.categoryId) {
      const category = await prisma.promptCategory.findUnique({
        where: { id: validatedData.categoryId }
      });

      if (!category) {
        return { success: false, error: 'Categoria não encontrada' };
      }
    }

    const updateData: any = { ...validatedData };
    delete updateData.id;

    if (updateData.tags) {
      updateData.tags = updateData.tags.map((tag: string) => tag.toLowerCase().trim());
    }

    const template = await prisma.promptTemplate.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        category: true,
        user: {
          select: { name: true, imageUrl: true }
        }
      }
    });

    revalidatePath('/editor');
    revalidatePath('/projects');

    return { success: true, template };
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    return { success: false, error: 'Erro ao atualizar template' };
  }
};

// Deletar template de prompt
export const deletePromptTemplate = async (templateId: string) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Verificar se o template existe e pertence ao usuário
    const template = await prisma.promptTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return { success: false, error: 'Template não encontrado' };
    }

    if (template.userId !== userId) {
      return { success: false, error: 'Sem permissão para deletar este template' };
    }

    if (template.isOfficial) {
      return { success: false, error: 'Templates oficiais não podem ser deletados' };
    }

    await prisma.promptTemplate.delete({
      where: { id: templateId }
    });

    revalidatePath('/editor');
    revalidatePath('/projects');

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar template:', error);
    return { success: false, error: 'Erro ao deletar template' };
  }
};

// Usar template (incrementar contador)
export const usePromptTemplate = async (templateId: string) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const template = await prisma.promptTemplate.findUnique({
      where: { id: templateId },
      include: {
        category: true
      }
    });

    if (!template) {
      return { success: false, error: 'Template não encontrado' };
    }

    // Incrementar contador de uso
    await prisma.promptTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } }
    });

    return { success: true, template };
  } catch (error) {
    console.error('Erro ao usar template:', error);
    return { success: false, error: 'Erro ao usar template' };
  }
};