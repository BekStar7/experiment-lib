import { createLazyFileRoute } from "@tanstack/react-router";
import ExperimentPage from "@/features/experiment/experiment-page.tsx";
import { useQuery } from "@tanstack/react-query";
import { projectQueries } from "@/services/queries/project.ts";

export const Route = createLazyFileRoute(
  "/_authenticated/project/$projectId/experiment/$experimentId/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId, experimentId } = Route.useParams();

  const { data, status, error } = useQuery(projectQueries.getProjects());

  if (status === "pending") {
    return <div>Loading...</div>;
  }

  if (status === "error") {
    return <div>Error: {error.message}</div>;
  }

  const project = data.find((p) => p.id === projectId);
  if (!project) {
    return <div>Project not found</div>;
  }

  const experiment = project.experiments.find((e) => e.id === experimentId);

  if (!experiment) {
    return <div>Experiment not found</div>;
  }

  return (
    <div>
      <ExperimentPage
        key={`experimentPage-${experiment.id}`}
        projectId={projectId}
        experiment={experiment}
      />
    </div>
  );
}
