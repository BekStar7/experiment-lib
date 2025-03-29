import { useMutation, useQueryClient } from "@tanstack/react-query";
import { experimentAPI } from "@/services/api/experiment.ts";
import { projectQueries } from "@/services/queries/project.ts";
import type { Experiment } from "@/schemas/experiment.ts";
import type { Project } from "@/schemas/projects.ts";

type UseExperimentUpdateProps = {
  experimentId: Experiment["id"];
  projectId: Project["id"];
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export const useExperimentUpdate = ({
  experimentId,
  projectId,
  onSuccess,
  onError,
}: UseExperimentUpdateProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: experimentAPI.updateExperiment,
    mutationKey: ["experiment", "update", experimentId],
    onSuccess: async (data) => {
      queryClient.setQueryData(
        projectQueries.getProjects().queryKey,
        (oldData) => {
          if (!oldData || oldData.length === 0) oldData = [];
          const newData = oldData.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                experiments: project.experiments.map((experiment) => {
                  if (experiment.id === data.id) {
                    return data;
                  }

                  return experiment;
                }),
              };
            }
            return project;
          });

          return [...newData];
        },
      );

      onSuccess?.();
    },
    onError,
  });
};
