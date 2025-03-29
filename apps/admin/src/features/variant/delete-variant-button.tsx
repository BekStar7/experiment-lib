import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/features/ui/alert-dialog.tsx";
import { Button } from "@/features/ui/button.tsx";
import ErrorMessage from "@/features/ui/error-message.tsx";
import React from "react";
import type { Project } from "@/schemas/projects.ts";
import type { Variant } from "@/schemas/variant.ts";
import type { Experiment } from "@/schemas/experiment.ts";
import { variantAPI } from "@/services/api/variant.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectQueries } from "@/services/queries/project.ts";

type DeleteVariantButtonProps = React.PropsWithChildren<{
  projectId: Project["id"];
  experimentId: Experiment["id"];
  variantId: Variant["id"];
}>;

const DeleteVariantButton: React.FC<DeleteVariantButtonProps> = ({
  children,
  projectId,
  experimentId,
  variantId,
}) => {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const { mutate, status, error } = useMutation({
    mutationFn: variantAPI.deleteVariant,
    mutationKey: ["variant", "delete", variantId],
    onSuccess: () => {
      queryClient.setQueryData(
        projectQueries.getProjects().queryKey,
        (oldData) => {
          if (!oldData || oldData.length === 0) return oldData;
          const newData = oldData.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                experiments: project.experiments.map((experiment) => {
                  if (experiment.id === experimentId) {
                    return {
                      ...experiment,
                      variants: experiment.variants.filter(
                        (variant) => variant.id !== variantId,
                      ),
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

      setOpen(false);
    },
  });
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure to delete this variant?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            variant and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ErrorMessage error={error?.message} />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            onClick={() => mutate(variantId)}
            status={status}
            variant="destructive"
          >
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteVariantButton;
