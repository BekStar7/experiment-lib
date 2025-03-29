import { queryOptions } from "@tanstack/react-query";
import { projectsAPI } from "@/services/api/projects.ts";

class ProjectQueries {
  getProjects = () => {
    return queryOptions({
      queryKey: ["projects"],
      queryFn: projectsAPI.getProjects,
      staleTime: Infinity,
      gcTime: Infinity,
    });
  };
}

export const projectQueries = new ProjectQueries();
