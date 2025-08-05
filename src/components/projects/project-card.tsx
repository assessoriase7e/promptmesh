"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Copy, Play, Calendar, Layers, GripVertical } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteProject, duplicateProject } from "@/actions/project-actions";
import { toast } from "sonner";
import moment from "moment";
import "moment/locale/pt-br";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  thumbnail?: string | null;
  folderId?: string | null;
  folder?: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count: {
    nodes: number;
    executions: number;
  };
}

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      await duplicateProject(project.id);
      toast.success("Projeto duplicado com sucesso!");
    } catch (error) {
      console.error("Erro ao duplicar projeto:", error);
      toast.error("Erro ao duplicar projeto");
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteProject(project.id);
      if (result.success) {
        toast.success("Projeto excluído com sucesso!");
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error("Erro ao excluir projeto:", error);
      toast.error("Erro ao excluir projeto");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={`group hover:shadow-md transition-all duration-200 cursor-pointer ${
          isDragging ? "opacity-50 rotate-3 scale-105" : ""
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <Link href={`/editor/${project.id}`}>
                <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                )}
              </Link>
            </div>
            <div className="flex items-center gap-1">
              {/* Drag Handle */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isDuplicating || isDeleting}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
                    <Copy className="mr-2 h-4 w-4" />
                    {isDuplicating ? "Duplicando..." : "Duplicar"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Thumbnail ou placeholder */}
          <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
            {project.thumbnail ? (
              <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <Layers className="h-8 w-8 text-purple-400" />
            )}
          </div>

          {/* Informações */}
          <div className="space-y-3">
            {/* Pasta */}
            {project.folder && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.folder.color || "#6b7280" }} />
                <span className="text-xs text-muted-foreground">{project.folder.name}</span>
              </div>
            )}

            {/* Estatísticas */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                <span>{project._count.nodes} nodes</span>
              </div>
              <div className="flex items-center gap-1">
                <Play className="h-3 w-3" />
                <span>{project._count.executions} exec.</span>
              </div>
            </div>

            {/* Data de atualização */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Atualizado {moment(project.updatedAt).fromNow()}</span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            <Link href={`/editor/${project.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Edit className="h-3 w-3 mr-2" />
                Editar
              </Button>
            </Link>
            <Button variant="outline" size="sm" disabled={isDuplicating || isDeleting}>
              <Play className="h-3 w-3 mr-2" />
              Executar
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o projeto "{project.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
