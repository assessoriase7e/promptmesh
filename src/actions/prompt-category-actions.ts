'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Schemas de validação
const createPromptCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome muito longo'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal').optional().default('#3B82F6'),
});

const updatePromptCategorySchema = createPromptCategorySchema.partial().extend({
  id: z.string().min(1, 'ID é obrigatório'),
});

// Buscar todas as categorias
export const getAllPromptCategories = async () => {
  try {
    const categories = await prisma.promptCategory.findMany({
      orderBy: [
        { isSystem: 'desc' }, // Categorias do sistema primeiro
        { name: 'asc' }
      ],
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

// Buscar categoria por ID
export const getPromptCategoryById = async (categoryId: string) => {
  try {
    const category = await prisma.promptCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { templates: true }
        }
      }
    });

    if (!category) {
      return { success: false, error: 'Categoria não encontrada' };
    }

    return { success: true, category };
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    return { success: false, error: 'Erro ao buscar categoria' };
  }
};

// Criar categoria de prompt (apenas admin)
export const createPromptCategory = async (data: z.infer<typeof createPromptCategorySchema>) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Verificar se é admin (você pode implementar sua lógica de admin aqui)
    // Por enquanto, vou permitir que qualquer usuário crie categorias
    
    const validatedData = createPromptCategorySchema.parse(data);

    // Verificar se já existe uma categoria com o mesmo nome
    const existingCategory = await prisma.promptCategory.findFirst({
      where: { 
        name: {
          equals: validatedData.name,
          mode: 'insensitive'
        }
      }
    });

    if (existingCategory) {
      return { success: false, error: 'Já existe uma categoria com este nome' };
    }

    const category = await prisma.promptCategory.create({
      data: validatedData,
      include: {
        _count: {
          select: { templates: true }
        }
      }
    });

    revalidatePath('/editor');
    revalidatePath('/projects');

    return { success: true, category };
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return { success: false, error: 'Erro ao criar categoria' };
  }
};

// Atualizar categoria de prompt (apenas admin)
export const updatePromptCategory = async (data: z.infer<typeof updatePromptCategorySchema>) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const validatedData = updatePromptCategorySchema.parse(data);

    // Verificar se a categoria existe
    const existingCategory = await prisma.promptCategory.findUnique({
      where: { id: validatedData.id }
    });

    if (!existingCategory) {
      return { success: false, error: 'Categoria não encontrada' };
    }

    // Não permitir editar categorias do sistema
    if (existingCategory.isSystem) {
      return { success: false, error: 'Categorias do sistema não podem ser editadas' };
    }

    // Se mudou o nome, verificar se não existe outra com o mesmo nome
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const duplicateCategory = await prisma.promptCategory.findFirst({
        where: { 
          name: {
            equals: validatedData.name,
            mode: 'insensitive'
          },
          id: { not: validatedData.id }
        }
      });

      if (duplicateCategory) {
        return { success: false, error: 'Já existe uma categoria com este nome' };
      }
    }

    const updateData: any = { ...validatedData };
    delete updateData.id;

    const category = await prisma.promptCategory.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        _count: {
          select: { templates: true }
        }
      }
    });

    revalidatePath('/editor');
    revalidatePath('/projects');

    return { success: true, category };
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return { success: false, error: 'Erro ao atualizar categoria' };
  }
};

// Deletar categoria de prompt (apenas admin)
export const deletePromptCategory = async (categoryId: string) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Verificar se a categoria existe
    const category = await prisma.promptCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { templates: true }
        }
      }
    });

    if (!category) {
      return { success: false, error: 'Categoria não encontrada' };
    }

    // Não permitir deletar categorias do sistema
    if (category.isSystem) {
      return { success: false, error: 'Categorias do sistema não podem ser deletadas' };
    }

    // Verificar se há templates usando esta categoria
    if (category._count.templates > 0) {
      return { success: false, error: 'Não é possível deletar categoria que possui templates' };
    }

    await prisma.promptCategory.delete({
      where: { id: categoryId }
    });

    revalidatePath('/editor');
    revalidatePath('/projects');

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    return { success: false, error: 'Erro ao deletar categoria' };
  }
};

// Seed das categorias padrão do sistema
export const seedDefaultCategories = async () => {
  try {
    const defaultCategories = [
      {
        name: 'Geral',
        description: 'Templates de uso geral',
        color: '#3B82F6',
        isSystem: true
      },
      {
        name: 'Criativo',
        description: 'Templates para criação de conteúdo criativo',
        color: '#8B5CF6',
        isSystem: true
      },
      {
        name: 'Análise',
        description: 'Templates para análise e revisão',
        color: '#10B981',
        isSystem: true
      },
      {
        name: 'Código',
        description: 'Templates para programação e desenvolvimento',
        color: '#F59E0B',
        isSystem: true
      },
      {
        name: 'Marketing',
        description: 'Templates para marketing e vendas',
        color: '#EF4444',
        isSystem: true
      },
      {
        name: 'Educação',
        description: 'Templates educacionais e de ensino',
        color: '#06B6D4',
        isSystem: true
      }
    ];

    const createdCategories = [];

    for (const categoryData of defaultCategories) {
      // Verificar se já existe
      const existing = await prisma.promptCategory.findFirst({
        where: { name: categoryData.name }
      });

      if (!existing) {
        const category = await prisma.promptCategory.create({
          data: categoryData
        });
        createdCategories.push(category);
      }
    }

    return { success: true, categories: createdCategories };
  } catch (error) {
    console.error('Erro ao criar categorias padrão:', error);
    return { success: false, error: 'Erro ao criar categorias padrão' };
  }
};