import { notFound } from 'next/navigation';
import { getProjectById } from '@/actions/project-actions';
import { MainLayout } from '@/components/layout/main-layout';
import { ProjectEditor } from '@/components/editor/project-editor';

interface ProjectEditorPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectEditorPage({ params }: ProjectEditorPageProps) {
  const { projectId } = await params;
  
  const project = await getProjectById(projectId);
  
  if (!project) {
    notFound();
  }

  return (
    <MainLayout>
      <div className="h-full w-full">
        <ProjectEditor 
          projectId={projectId}
          initialData={project.canvasData}
        />
      </div>
    </MainLayout>
  );
}