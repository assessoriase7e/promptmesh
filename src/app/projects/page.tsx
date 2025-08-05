import { MainLayout } from '@/components/layout/main-layout';
import { ProjectsContent } from '@/components/projects/projects-content';
import { getUserProjects } from '@/actions/project-actions';
import { getUserFolders } from '@/actions/folder-actions';

export const revalidate = 3600;

export default async function ProjectsPage() {
  const [projectsResult, foldersResult] = await Promise.all([
    getUserProjects(),
    getUserFolders(),
  ]);

  const projects = Array.isArray(projectsResult) ? projectsResult : [];
  const folders = foldersResult.success ? foldersResult.folders : [];

  return (
    <MainLayout>
      <ProjectsContent projects={projects} folders={folders} />
    </MainLayout>
  );
}