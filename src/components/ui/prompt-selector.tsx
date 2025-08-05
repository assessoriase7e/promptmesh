"use client";

import { useState, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Search, Star, Trash2, Loader2 } from "lucide-react";
import { usePromptContext } from "@/contexts/prompt-context";
import { createPromptTemplate, deletePromptTemplate, usePromptTemplate } from "@/actions/prompt-template-actions";
import { PromptTemplate } from "@/types";
import { toast } from "sonner";

interface PromptSelectorProps {
  onSelectPrompt: (prompt: string) => void;
  currentPrompt?: string;
}

export const PromptSelector = ({ onSelectPrompt, currentPrompt }: PromptSelectorProps) => {
  const { templates, categories } = usePromptContext();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("");
  const [newTemplateTags, setNewTemplateTags] = useState("");

  // Definir categoria padrão quando as categorias carregarem
  useState(() => {
    if (categories.length > 0 && !newTemplateCategory) {
      setNewTemplateCategory(categories[0]?.id || "");
    }
  });

  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(query) ||
          template.prompt.toLowerCase().includes(query) ||
          template.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filtrar por categoria
    if (selectedCategory !== "all") {
      filtered = filtered.filter((template) => template.categoryId === selectedCategory);
    }

    return filtered;
  }, [templates, searchQuery, selectedCategory]);

  const mostUsed = useMemo(() => {
    return templates
      .filter((template) => template.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 3);
  }, [templates]);

  const handleSelectTemplate = async (template: PromptTemplate) => {
    startTransition(async () => {
      try {
        await usePromptTemplate(template.id);
        onSelectPrompt(template.prompt);
        toast.success("Template aplicado!");
      } catch (error) {
        toast.error("Erro ao usar template");
      }
    });
  };

  const handleDeleteTemplate = async (templateId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    startTransition(async () => {
      try {
        const result = await deletePromptTemplate(templateId);
        if (result.success) {
          toast.success("Template deletado!");
        } else {
          toast.error(result.error || "Erro ao deletar template");
        }
      } catch (error) {
        toast.error("Erro ao deletar template");
      }
    });
  };

  const handleSaveCurrentPrompt = async () => {
    if (!currentPrompt?.trim() || !newTemplateName.trim() || !newTemplateCategory) return;

    const tags = newTemplateTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    startTransition(async () => {
      try {
        const result = await createPromptTemplate({
          name: newTemplateName,
          prompt: currentPrompt,
          categoryId: newTemplateCategory,
          tags,
        });

        if (result.success) {
          toast.success("Template salvo!");
          // Reset form
          setNewTemplateName("");
          setNewTemplateTags("");
          setIsDialogOpen(false);
        } else {
          toast.error(result.error || "Erro ao salvar template");
        }
      } catch (error) {
        toast.error("Erro ao salvar template");
      }
    });
  };

  if (templates.length === 0 && categories.length === 0) {
    return (
      <Button variant="outline" size="sm" disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        ) : (
          <BookOpen className="h-3 w-3 mr-1" />
        )}
        Carregando...
      </Button>
    );
  }

  return (
    <div className="flex gap-1">
      {/* Dropdown de templates */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <BookOpen className="h-3 w-3 mr-1" />
            )}
            Templates
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
          {/* Busca */}
          <div className="p-2 space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Buscar templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-8"
              />
            </div>

            {/* Filtro por categoria */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DropdownMenuSeparator />

          {/* Mais usados */}
          {mostUsed.length > 0 && selectedCategory === "all" && !searchQuery && (
            <>
              <DropdownMenuLabel className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                Mais Usados
              </DropdownMenuLabel>
              {mostUsed.map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="flex flex-col items-start gap-1 p-3"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-sm">{template.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {template.usageCount}x
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{template.prompt}</p>
                  <div className="flex gap-1 mt-1">
                    {template.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Lista de templates */}
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => {
              const category = categories.find((c) => c.id === template.categoryId);
              return (
                <DropdownMenuItem
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="flex flex-col items-start gap-1 p-3"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-sm">{template.name}</span>
                    <div className="flex items-center gap-1">
                      {category && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDeleteTemplate(template.id, e)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{template.prompt}</p>
                  {template.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </DropdownMenuItem>
              );
            })
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery ? "Nenhum template encontrado" : "Nenhum template salvo"}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Botão para salvar prompt atual */}
      {currentPrompt?.trim() && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-3 w-3 mr-1" />
              Salvar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Salvar Template de Prompt</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome do Template</label>
                <Input
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Ex: Retrato Profissional"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Categoria</label>
                <Select value={newTemplateCategory} onValueChange={setNewTemplateCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Tags (separadas por vírgula)</label>
                <Input
                  value={newTemplateTags}
                  onChange={(e) => setNewTemplateTags(e.target.value)}
                  placeholder="Ex: retrato, profissional, iluminação"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Prompt</label>
                <div className="p-3 bg-muted rounded-md text-sm">{currentPrompt}</div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveCurrentPrompt} 
                disabled={isPending || !newTemplateName.trim() || !newTemplateCategory}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Salvar Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
