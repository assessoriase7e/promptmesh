import { notFound } from 'next/navigation';
import { getProjectById } from '@/actions/project-actions';
import { getUserPromptTemplates } from '@/actions/prompt-template-actions';
import { getAllPromptCategories } from '@/actions/prompt-category-actions';
import { MainLayout } from '@/components/layout/main-layout';
import { ProjectEditor } from '@/components/editor/project-editor';

interface ProjectEditorPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectEditorPage({ params }: ProjectEditorPageProps) {
  const { projectId } = await params;
  
  // Carregar dados em paralelo
  const [project, templatesResult, categoriesResult] = await Promise.all([
    getProjectById(projectId),
    getUserPromptTemplates(),
    getAllPromptCategories()
  ]);
  
  if (!project) {
    notFound();
  }

  // Extrair dados dos resultados
  const templates = templatesResult.success ? templatesResult.templates : [];
  const categories = categoriesResult.success ? categoriesResult.categories : [];

  return (
    <MainLayout>
      <div className="h-full w-full">
        <ProjectEditor 
          projectId={projectId}
          initialData={project.canvasData}
          templates={templates}
          categories={categories}
        />
      </div>
    </MainLayout>
  );
}