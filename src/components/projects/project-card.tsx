'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Play,
  Calendar,
  Layers,
  Folder
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import moment from 'moment';

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
  const [isLoading, setIsLoading] = useState(false);

  const handleDuplicate = async () => {
    setIsLoading(true);
    try {
      // TODO: Implementar duplicação
      console.log('Duplicar projeto:', project.id);
    } catch (error) {
      console.error('Erro ao duplicar projeto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
    
    setIsLoading(true);
    try {
      // TODO: Implementar exclusão
      console.log('Excluir projeto:', project.id);
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{project.name}</h3>
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {project.description}
              </p>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isLoading}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/editor/${project.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate} disabled={isLoading}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete} 
                disabled={isLoading}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Thumbnail ou placeholder */}
        <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
          {project.thumbnail ? (
            <img 
              src={project.thumbnail} 
              alt={project.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Layers className="h-8 w-8 text-purple-400" />
          )}
        </div>
        
        {/* Informações */}
        <div className="space-y-3">
          {/* Pasta */}
          {project.folder && (
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: project.folder.color || '#6b7280' }}
              />
              <span className="text-xs text-muted-foreground">
                {project.folder.name}
              </span>
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
            <span>
              Atualizado {moment(project.updatedAt).fromNow()}
            </span>
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
          <Button variant="outline" size="sm" disabled={isLoading}>
            <Play className="h-3 w-3 mr-2" />
            Executar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};