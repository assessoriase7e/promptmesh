'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FolderPlus, 
  Plus, 
  Search, 
  Folder, 
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  Move,
  Calendar,
  Play
} from 'lucide-react';
import Link from 'next/link';
import { CreateFolderDialog } from './create-folder-dialog';
import { ProjectCard } from './project-card';
import { FolderCard } from './folder-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface ProjectsContentProps {
  projects: Project[];
  folders: Folder[];
}

export const ProjectsContent = ({ projects, folders }: ProjectsContentProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  // Filtrar projetos por pasta selecionada e termo de busca
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFolder === null) {
      // Mostrar projetos sem pasta
      return matchesSearch && !project.folderId;
    } else if (selectedFolder === 'all') {
      // Mostrar todos os projetos
      return matchesSearch;
    } else {
      // Mostrar projetos da pasta selecionada
      return matchesSearch && project.folderId === selectedFolder;
    }
  });

  // Filtrar pastas principais (sem pai)
  const rootFolders = folders.filter(folder => !folder.parentId);

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Meus Projetos</h1>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateFolder(true)}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Nova Pasta
            </Button>
            <Link href="/projects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
            </Link>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedFolder === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFolder('all')}
            >
              Todos ({projects.length})
            </Button>
            <Button
              variant={selectedFolder === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFolder(null)}
            >
              Sem Pasta ({projects.filter(p => !p.folderId).length})
            </Button>
            {rootFolders.map(folder => (
              <Button
                key={folder.id}
                variant={selectedFolder === folder.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFolder(folder.id)}
                className="flex items-center gap-2"
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: folder.color || '#6b7280' }}
                />
                {folder.name} ({folder._count.projects})
              </Button>
            ))}
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Projetos</p>
                  <p className="text-2xl font-bold">{projects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Folder className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pastas</p>
                  <p className="text-2xl font-bold">{folders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Play className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Execuções</p>
                  <p className="text-2xl font-bold">
                    {projects.reduce((acc, p) => acc + p._count.executions, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recentes</p>
                  <p className="text-2xl font-bold">
                    {projects.filter(p => {
                      const daysDiff = Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
                      return daysDiff <= 7;
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Pastas (se não há pasta selecionada ou se "Todos" está selecionado) */}
        {(selectedFolder === null || selectedFolder === 'all') && rootFolders.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Pastas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rootFolders.map(folder => (
                <FolderCard 
                  key={folder.id} 
                  folder={folder}
                  onClick={() => setSelectedFolder(folder.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Lista de Projetos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {selectedFolder === 'all' 
                ? 'Todos os Projetos' 
                : selectedFolder === null 
                  ? 'Projetos sem Pasta'
                  : `Projetos em "${rootFolders.find(f => f.id === selectedFolder)?.name}"`
              }
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredProjects.length} projeto{filteredProjects.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? 'Tente ajustar os termos de busca ou filtros.'
                    : 'Comece criando seu primeiro projeto de fluxo visual.'
                  }
                </p>
                {!searchTerm && (
                  <Link href="/projects/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Projeto
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* Dialog de Criar Pasta */}
        <CreateFolderDialog 
          open={showCreateFolder} 
          onOpenChange={setShowCreateFolder}
        />
      </div>
    </div>
  );
};