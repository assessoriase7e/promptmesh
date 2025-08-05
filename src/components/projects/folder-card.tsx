'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Folder,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  FolderOpen
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Folder {
  id: string;
  name: string;
  color?: string | null;
  parentId?: string | null;
  parent?: {
    id: string;
    name: string;
  } | null;
  _count: {
    projects: number;
    children: number;
  };
}

interface FolderCardProps {
  folder: Folder;
  onClick?: () => void;
}

export const FolderCard = ({ folder, onClick }: FolderCardProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implementar edição de pasta
    console.log('Editar pasta:', folder.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Tem certeza que deseja excluir esta pasta?')) return;
    
    setIsLoading(true);
    try {
      // TODO: Implementar exclusão de pasta
      console.log('Excluir pasta:', folder.id);
    } catch (error) {
      console.error('Erro ao excluir pasta:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card 
      className="group hover:shadow-md transition-all cursor-pointer hover:scale-105"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${folder.color || '#6b7280'}20` }}
            >
              <Folder 
                className="h-5 w-5" 
                style={{ color: folder.color || '#6b7280' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{folder.name}</h3>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isLoading}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
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
        
        {/* Estatísticas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span>{folder._count.projects} projeto{folder._count.projects !== 1 ? 's' : ''}</span>
          </div>
          
          {folder._count.children > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FolderOpen className="h-3 w-3" />
              <span>{folder._count.children} subpasta{folder._count.children !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        
        {/* Indicador visual */}
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-center">
            <div 
              className="w-full h-1 rounded-full"
              style={{ backgroundColor: `${folder.color || '#6b7280'}40` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};