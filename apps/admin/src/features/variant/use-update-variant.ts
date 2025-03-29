import { useMutation, useQueryClient } from "@tanstack/react-query";
import { experimentAPI } from "@/services/api/experiment.ts";
import { toast } from "sonner";
import { projectQueries } from "@/services/queries/project.ts";
import type { Project } from "@/schemas/projects.ts";

type UseUpdateVariantProps = {
  projectId: Project["id"];
};

export const useUpdateVariant = ({ projectId }: UseUpdateVariantProps) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: experimentAPI.bulkEditVariants,
    mutationKey: ["experiment", "bulk-edit-variants"],
    onSuccess: (data) => {
      queryClient.setQueryData(
        projectQueries.getProjects().queryKey,
        (oldData) => {
          if (!oldData || oldData.length === 0) oldData = [];
          const newData = oldData.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                experiments: project.experiments.map((experiment) => {
                  if (experiment.id === data.experiment.id) {
                    return {
                      ...experiment,
                      variants: data.updated_variants,
                    };
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

      toast.success("Variants updated");
    },
    onError: (error) => {
      toast.error("Error updating variants: " + error.message);
    },
  });
};
