import { PlusCircle } from "lucide-react";
import { Button } from "@/features/ui/button.tsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { variantAPI } from "@/services/api/variant.ts";
import type { Project } from "@/schemas/projects.ts";
import type { Experiment } from "@/schemas/experiment.ts";
import React from "react";
import { toast } from "sonner";
import { projectQueries } from "@/services/queries/project.ts";

type AddVariantButtonProps = {
  variantKey: string;
  projectId: Project["id"];
  experimentId: Experiment["id"];
};

const AddVariantButton: React.FC<AddVariantButtonProps> = ({
  variantKey,
  projectId,
  experimentId,
}) => {
  const queryClient = useQueryClient();
  const { mutate, status } = useMutation({
    mutationFn: variantAPI.createVariant,
    mutationKey: ["variant", "create"],
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
                  if (experiment.id === experimentId) {
                    return {
                      ...experiment,
                      variants: [...experiment.variants, data],
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
    },
    onError: (error) => {
      toast.error("Error creating variant:" + error.message);
    },
  });

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      status={status}
      onClick={() =>
        mutate({
          key: variantKey,
          rollout: 0,
          experiment: experimentId,
        })
      }
      className="flex items-center gap-1"
    >
      <PlusCircle className="h-4 w-4" />
      Add Variant
    </Button>
  );
};

export default AddVariantButton;
