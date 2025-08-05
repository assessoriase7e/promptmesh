"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Menu, Keyboard } from "lucide-react";

interface FloatingMenuProps {
  className?: string;
}

export const FloatingMenu = ({ className }: FloatingMenuProps) => {
  const [isCommandsModalOpen, setIsCommandsModalOpen] = useState(false);

  const commands = [
    {
      category: "Navegação e Seleção",
      items: [
        { key: "Ctrl + A", description: "Selecionar todos os cards" },
        { key: "Delete / Backspace", description: "Deletar elementos selecionados" },
      ]
    },
    {
      category: "Execução",
      items: [
        { key: "Ctrl + Q", description: "Executar card selecionado" },
        { key: "Ctrl + F", description: "Executar fluxo completo" },
      ]
    },
    {
      category: "Salvamento",
      items: [
        { key: "Ctrl + S", description: "Salvar projeto manualmente" },
        { key: "Auto Save", description: "Salvamento automático a cada 5 minutos" },
      ]
    },
    {
      category: "Histórico",
      items: [
        { key: "Ctrl + Z", description: "Desfazer última ação" },
        { key: "Ctrl + Y", description: "Refazer ação" },
        { key: "Ctrl + Shift + Z", description: "Refazer ação (alternativo)" },
      ]
    },
    {
      category: "Canvas",
      items: [
        { key: "Shift + Drag", description: "Seleção múltipla" },
        { key: "Mouse Wheel", description: "Zoom in/out" },
        { key: "Drag", description: "Mover canvas" },
        { key: "Drag & Drop", description: "Adicionar novos cards ao canvas" },
      ]
    }
  ];

  return (
    <>
      <div className={className}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 bg-background/80 backdrop-blur-sm border-border/50"
            >
              <Menu className="h-4 w-4" />
              Menu
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem
              onClick={() => setIsCommandsModalOpen(true)}
              className="gap-2"
            >
              <Keyboard className="h-4 w-4" />
              Comandos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isCommandsModalOpen} onOpenChange={setIsCommandsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Comandos do Canvas
            </DialogTitle>
            <DialogDescription>
              Lista completa de atalhos e comandos disponíveis no editor de fluxo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {commands.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.items.map((command, commandIndex) => (
                    <div
                      key={commandIndex}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <span className="text-sm">{command.description}</span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-background border border-border rounded">
                        {command.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};