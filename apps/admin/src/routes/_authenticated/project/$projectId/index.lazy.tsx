import { createLazyFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { projectQueries } from "@/services/queries/project.ts";
import ProjectPage from "@/features/project/project-page.tsx";

export const Route = createLazyFileRoute("/_authenticated/project/$projectId/")(
  {
    component: RouteComponent,
  },
);

function RouteComponent() {
  const projectId = Route.useParams().projectId;

  const { data, isLoading, error } = useQuery(projectQueries.getProjects());
  const project = data?.find((project) => project.id === projectId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!project) {
    return <div>Project you are looking for does not exist</div>;
  }

  return <ProjectPage key={`projectPage-${project.id}`} project={project} />;
}
