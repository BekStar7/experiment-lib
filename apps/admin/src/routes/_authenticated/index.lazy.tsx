import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { projectQueries } from "@/services/queries/project.ts";
import AddProjectDialog from "@/features/project/add-project-dialog.tsx";
import { Button } from "@/features/ui/button.tsx";
import { Plus } from "lucide-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/features/ui/card.tsx";
import DeleteProjectButton from "@/features/project/delete-project-button.tsx";

export const Route = createLazyFileRoute("/_authenticated/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, status, error } = useQuery(projectQueries.getProjects());

  if (status === "pending") {
    return <div>Loading...</div>;
  }

  if (status === "error") {
    return <div>Error: {error.message}</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div>
        <h1>You have no projects</h1>
        <AddProjectDialog>
          <Button>Add Project</Button>
        </AddProjectDialog>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">
          You have {data.length} project{data.length > 1 && "s"}
        </h1>
        <AddProjectDialog>
          <Button variant="secondary" size="icon">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add Project</span>
          </Button>
        </AddProjectDialog>
      </div>
      <div className="py-2" />
      <div className="grid grid-cols-2 gap-2">
        {data.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardFooter className="gap-2">
              <Button asChild>
                <Link
                  to="/project/$projectId"
                  params={{ projectId: project.id }}
                >
                  Settings
                </Link>
              </Button>
              <DeleteProjectButton projectId={project.id} />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
