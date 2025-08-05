import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FolderOpen, History, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getUserProjects } from '@/actions/project-actions';
import { getUserFolders } from '@/actions/folder-actions';
import { auth } from '@clerk/nextjs/server';

export default async function Home() {
  const { userId } = await auth();
  
  // Só buscar dados se o usuário estiver logado
  let projects: any[] = [];
  let folders: any[] = [];
  
  if (userId) {
    try {
      const [projectsResult, foldersResult] = await Promise.all([
        getUserProjects(),
        getUserFolders()
      ]);
      
      // getUserProjects retorna diretamente o array
      projects = Array.isArray(projectsResult) ? projectsResult : [];
      // getUserFolders retorna objeto com success e folders
      folders = foldersResult.success ? foldersResult.folders : [];
    } catch (error) {
      // Se houver erro (usuário não encontrado, etc.), manter arrays vazios
      console.error('Erro ao buscar dados do usuário:', error);
    }
  }

  const recentProjects = projects.slice(0, 3);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Bem-vindo ao PromptMesh
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Crie fluxos visuais poderosos com IA. Conecte, processe e gere conteúdo de forma intuitiva.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link href={userId ? "/projects/new" : "/sign-in"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-purple-600" />
                  Novo Projeto
                </CardTitle>
                <CardDescription>
                  {userId ? "Comece um novo fluxo do zero" : "Faça login para criar projetos"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 transition-colors" />
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link href={userId ? "/projects" : "/sign-in"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-blue-600" />
                  Meus Projetos
                </CardTitle>
                <CardDescription>
                  {userId ? "Gerencie seus projetos e pastas" : "Faça login para ver seus projetos"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {userId ? `${projects.length} projeto${projects.length !== 1 ? 's' : ''}` : "Acesse sua conta"}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link href={userId ? "/history" : "/sign-in"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-green-600" />
                  Histórico
                </CardTitle>
                <CardDescription>
                  {userId ? "Veja suas execuções recentes" : "Faça login para ver seu histórico"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-green-600 transition-colors" />
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Projetos Recentes - Apenas para usuários logados */}
        {userId && (
          <section>
            {recentProjects.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Projetos Recentes</h2>
                  <Link href="/projects">
                    <Button variant="outline" size="sm">
                      Ver todos
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentProjects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                        {project.description && (
                          <CardDescription className="line-clamp-2">
                            {project.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
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
                        
                        <div className="flex gap-2">
                          <Link href={`/editor/${project.id}`} className="flex-1">
                            <Button size="sm" className="w-full">
                              <Zap className="h-3 w-3 mr-2" />
                              Abrir
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent className="space-y-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Plus className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Nenhum projeto ainda</h3>
                    <p className="text-muted-foreground">
                      Crie seu primeiro projeto para começar a usar o PromptMesh
                    </p>
                  </div>
                  <Link href="/projects/new">
                    <Button size="lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Projeto
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* Seção para usuários não logados */}
        {!userId && (
          <section>
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Bem-vindo ao PromptMesh</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Crie fluxos visuais de prompts de IA de forma intuitiva. 
                    Conecte, configure e execute seus prompts em um canvas interativo.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button asChild size="lg">
                      <Link href="/sign-in">
                        Fazer Login
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link href="/sign-up">
                        Criar Conta
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        )}
      </div>
    </MainLayout>
  );
}
