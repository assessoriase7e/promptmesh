"use client";

import { useState, useEffect } from "react";
import { PromptTemplate, PromptCategory } from "@/types";

const STORAGE_KEY = "promptmesh_saved_prompts";
const CATEGORIES_KEY = "promptmesh_prompt_categories";

// Categorias padrão
const defaultCategories: PromptCategory[] = [
  {
    id: "general",
    name: "Geral",
    description: "Prompts gerais para diversos usos",
    color: "#6b7280",
  },
  {
    id: "style",
    name: "Estilos",
    description: "Prompts para estilos específicos",
    color: "#8b5cf6",
  },
  {
    id: "photography",
    name: "Fotografia",
    description: "Prompts para fotografia e retratos",
    color: "#06b6d4",
  },
  {
    id: "art",
    name: "Arte",
    description: "Prompts artísticos e criativos",
    color: "#f59e0b",
  },
  {
    id: "editing",
    name: "Edição",
    description: "Prompts para edição de imagens",
    color: "#10b981",
  },
];

// Templates padrão
const defaultTemplates: PromptTemplate[] = [
  {
    id: "realistic-portrait",
    name: "Retrato Realista",
    prompt: "retrato fotográfico profissional, iluminação suave, alta qualidade, 8k, detalhes ultra-realistas",
    category: "photography",
    tags: ["retrato", "realista", "fotografia"],
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: "anime-style",
    name: "Estilo Anime",
    prompt: "estilo anime, arte digital, cores vibrantes, traços limpos, alta qualidade",
    category: "style",
    tags: ["anime", "digital", "colorido"],
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: "cinematic-lighting",
    name: "Iluminação Cinematográfica",
    prompt: "iluminação cinematográfica dramática, contraste alto, atmosfera épica, qualidade de filme",
    category: "photography",
    tags: ["cinema", "iluminação", "dramático"],
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: "watercolor-art",
    name: "Arte Aquarela",
    prompt: "pintura em aquarela, cores suaves, textura de papel, estilo artístico tradicional",
    category: "art",
    tags: ["aquarela", "pintura", "tradicional"],
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: "enhance-details",
    name: "Melhorar Detalhes",
    prompt: "adicionar mais detalhes, melhorar qualidade, nitidez aprimorada, textura realista",
    category: "editing",
    tags: ["detalhes", "qualidade", "edição"],
    createdAt: new Date(),
    usageCount: 0,
  },
];

export const useSavedPrompts = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [categories, setCategories] = useState<PromptCategory[]>(defaultCategories);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados do localStorage
  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem(STORAGE_KEY);
      const savedCategories = localStorage.getItem(CATEGORIES_KEY);

      if (savedTemplates) {
        const parsed = JSON.parse(savedTemplates);
        setTemplates(
          parsed.map((t: any) => ({
            ...t,
            createdAt: new Date(t.createdAt),
          }))
        );
      } else {
        // Primeira vez - usar templates padrão
        setTemplates(defaultTemplates);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTemplates));
      }

      if (savedCategories) {
        setCategories(JSON.parse(savedCategories));
      } else {
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
      }
    } catch (error) {
      console.error("Erro ao carregar prompts salvos:", error);
      setTemplates(defaultTemplates);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salvar template
  const saveTemplate = (name: string, prompt: string, category: string, tags: string[] = []) => {
    const newTemplate: PromptTemplate = {
      id: `template-${Date.now()}`,
      name,
      prompt,
      category,
      tags,
      createdAt: new Date(),
      usageCount: 0,
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTemplates));

    return newTemplate;
  };

  // Usar template (incrementa contador)
  const useTemplate = (templateId: string) => {
    const updatedTemplates = templates.map((t) => (t.id === templateId ? { ...t, usageCount: t.usageCount + 1 } : t));

    setTemplates(updatedTemplates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTemplates));

    return templates.find((t) => t.id === templateId);
  };

  // Deletar template
  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter((t) => t.id !== templateId);
    setTemplates(updatedTemplates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTemplates));
  };

  // Buscar templates
  const searchTemplates = (query: string) => {
    if (!query.trim()) return templates;

    const lowercaseQuery = query.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(lowercaseQuery) ||
        t.prompt.toLowerCase().includes(lowercaseQuery) ||
        t.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  // Obter templates por categoria
  const getTemplatesByCategory = (categoryId: string) => {
    return templates.filter((t) => t.category === categoryId);
  };

  // Obter templates mais usados
  const getMostUsedTemplates = (limit: number = 5) => {
    return [...templates].sort((a, b) => b.usageCount - a.usageCount).slice(0, limit);
  };

  return {
    templates,
    categories,
    isLoading,
    saveTemplate,
    useTemplate,
    deleteTemplate,
    searchTemplates,
    getTemplatesByCategory,
    getMostUsedTemplates,
  };
};
