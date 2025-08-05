import { MainLayout } from '@/components/layout/main-layout';
import { CreateProjectForm } from '@/components/projects/create-project-form';
import { getUserFolders } from '@/actions/folder-actions';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 3600;

export default async function NewProjectPage() {
  const foldersResult = await getUserFolders();
  const folders = foldersResult.success ? foldersResult.folders : [];

  return (
    <MainLayout>
      <div className="h-full p-6 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Link href="/projects">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Criar Novo Projeto</h1>
            </div>
          </div>

          {/* Formulário */}
          <CreateProjectForm folders={folders} />
        </div>
      </div>
    </MainLayout>
  );
}