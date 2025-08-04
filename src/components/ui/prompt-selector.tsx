"use client";

import { useState } from "react";
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
import { BookOpen, Plus, Search, Star, Trash2 } from "lucide-react";
import { useSavedPrompts } from "@/hooks/use-saved-prompts";
import { PromptTemplate } from "@/types";

interface PromptSelectorProps {
  onSelectPrompt: (prompt: string) => void;
  currentPrompt?: string;
}

export const PromptSelector = ({ onSelectPrompt, currentPrompt }: PromptSelectorProps) => {
  const {
    templates,
    categories,
    isLoading,
    saveTemplate,
    useTemplate,
    deleteTemplate,
    searchTemplates,
    getTemplatesByCategory,
    getMostUsedTemplates,
  } = useSavedPrompts();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("general");
  const [newTemplateTags, setNewTemplateTags] = useState("");

  const filteredTemplates = () => {
    let filtered = searchQuery ? searchTemplates(searchQuery) : templates;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    return filtered;
  };

  const handleSelectTemplate = (template: PromptTemplate) => {
    useTemplate(template.id);
    onSelectPrompt(template.prompt);
  };

  const handleSaveCurrentPrompt = () => {
    if (!currentPrompt?.trim() || !newTemplateName.trim()) return;

    const tags = newTemplateTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    saveTemplate(newTemplateName, currentPrompt, newTemplateCategory, tags);

    // Reset form
    setNewTemplateName("");
    setNewTemplateTags("");
    setIsDialogOpen(false);
  };

  const mostUsed = getMostUsedTemplates(3);

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <BookOpen className="h-3 w-3 mr-1" />
        Carregando...
      </Button>
    );
  }

  return (
    <div className="flex gap-1">
      {/* Dropdown de templates */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <BookOpen className="h-3 w-3 mr-1" />
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
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
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
          {filteredTemplates().length > 0 ? (
            filteredTemplates().map((template) => {
              const category = categories.find((c) => c.id === template.category);
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
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate(template.id);
                        }}
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
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
              <Button onClick={handleSaveCurrentPrompt} disabled={!newTemplateName.trim()}>
                Salvar Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
