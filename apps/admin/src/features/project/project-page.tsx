import React from "react";
import {
  createOrUpdateProjectSchema,
  type Project,
} from "@/schemas/projects.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsAPI } from "@/services/api/projects.ts";
import { projectQueries } from "@/services/queries/project.ts";
import { toast } from "sonner";
import ApiKeyBlock from "@/features/project/api-key-block.tsx";
import DeleteProjectButton from "@/features/project/delete-project-button.tsx";
import ProjectForm from "@/features/project/project-form.tsx";
import { z } from "zod";
import ExperimentsList from "@/features/experiment/experiments-list.tsx";

type ProjectPageProps = {
  project: Project;
};

const ProjectPage: React.FC<ProjectPageProps> = ({ project }) => {
  const queryClient = useQueryClient();
  const { mutate, status, error } = useMutation({
    mutationFn: projectsAPI.updateProject,
    mutationKey: ["project", "create"],
    onSuccess: async (data) => {
      queryClient.setQueryData(
        projectQueries.getProjects().queryKey,
        (oldData) => {
          if (!oldData || oldData.length === 0) oldData = [];
          const newData = oldData.map((project) => {
            if (project.id === data.id) {
              return data;
            }
            return project;
          });

          return [...newData];
        },
      );

      toast.success("Project updated successfully");
    },
  });

  const onSubmit = (data: z.infer<typeof createOrUpdateProjectSchema>) =>
    mutate({
      id: project.id,
      data,
    });

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{project.title}</h1>
        <DeleteProjectButton projectId={project.id} />
      </div>
      <ProjectForm
        project={project}
        onSubmit={onSubmit}
        status={status}
        error={error}
      />
      <div className="py-4" />
      <ApiKeyBlock projectId={project.id} apiKey={project.api_key} />
      <div className="py-4" />
      <ExperimentsList
        projectId={project.id}
        experiments={project.experiments}
      />
    </div>
  );
};

export default ProjectPage;
