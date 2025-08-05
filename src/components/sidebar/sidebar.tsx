"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, History, Paintbrush, Settings, X, Plus, FolderOpen } from "lucide-react";
import { PromptCard } from "@/components/cards/prompt-card";
import { UploadCard } from "@/components/cards/upload-card";
import { ParametersCard } from "@/components/cards/parameters-card";
import { OutputCard } from "@/components/cards/output-card";
import { UploadPromptCard } from "@/components/cards/upload-prompt-card";
import { ResultPromptCard } from "@/components/cards/result-prompt-card";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const sidebarItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    path: "/",
    description: "Página inicial",
  },
  {
    id: "projects",
    label: "Projetos",
    icon: FolderOpen,
    path: "/projects",
    description: "Gerenciar projetos",
  },
  {
    id: "history",
    label: "Histórico",
    icon: History,
    path: "/history",
    description: "Execuções anteriores",
  },
  {
    id: "editor",
    label: "Editor Visual",
    icon: Paintbrush,
    path: "/editor",
    description: "Retoque com IA",
  },
  {
    id: "settings",
    label: "Configurações",
    icon: Settings,
    path: "/settings",
    description: "Conta e preferências",
  },
];

export const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
  const pathname = usePathname();
  
  // Verificar se estamos na rota do editor para mostrar componentes draggable
  const isEditorRoute = pathname.startsWith('/editor/');

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-background border-r z-50 transition-transform duration-300 ease-in-out",
          "md:relative md:top-0 md:h-full md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header da sidebar */}
          <div className="flex items-center justify-between p-4 border-b md:hidden">
            <span className="font-semibold">Menu</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Área com scroll para navegação e componentes */}
          <div className="flex-1 overflow-y-auto">
            {/* Navegação principal */}
            <nav className="p-4 space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;

                return (
                  <Link key={item.id} href={item.path}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-auto p-3 flex-col items-start gap-1",
                        isActive && "bg-secondary"
                      )}
                      onClick={onClose}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-8">{item.description}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Componentes Draggable - só aparecem na rota do editor */}
            {isEditorRoute && (
              <div className="px-3 py-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="h-4 w-4" />
                  <h3 className="font-medium text-sm">Componentes</h3>
                </div>
                <div className="space-y-3 pb-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Básicos</h4>
                    <PromptCard />
                    <UploadCard />
                    <ParametersCard />
                    <OutputCard />
                  </div>

                  <div className="space-y-2 pt-3 border-t">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avançados</h4>
                    <UploadPromptCard />
                    <ResultPromptCard />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer da sidebar - fixo na parte inferior */}
          <div className="p-4 border-t bg-background">
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Status: Online</span>
              </div>
              <p className="text-xs text-muted-foreground">Todos os sistemas funcionando normalmente</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
