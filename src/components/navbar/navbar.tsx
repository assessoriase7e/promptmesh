"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, CreditCard, HelpCircle, Menu, LogIn, UserPlus } from "lucide-react";
import { CreditDisplay } from "./credit-display";
import Link from "next/link";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar = ({ onToggleSidebar }: NavbarProps) => {
  const { user } = useUser();

  return (
    <nav className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className=" mx-auto h-full flex items-center justify-between px-4">
        {/* Logo e Menu Mobile */}
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="sm" className="md:hidden" onClick={onToggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PM</span>
            </div>
            <span className="font-bold text-xl hidden sm:block">PromptMesh</span>
          </div>

          {/* Menu de Navegação */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pricing">
                <CreditCard className="h-4 w-4 mr-2" />
                Preços
              </Link>
            </Button>
          </div>
        </div>

        {/* Informações do usuário */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Saldo de créditos */}
              <div className="hidden sm:flex">
                <CreditDisplay />
              </div>

              {/* Menu do usuário */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: "w-8 h-8",
                        },
                      }}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {user?.firstName} {user?.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/pricing">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Planos e Cobrança
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/support">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Ajuda e Suporte
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            /* Botões de Login/Cadastro */
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Cadastrar
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
