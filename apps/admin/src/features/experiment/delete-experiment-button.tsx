import type { Project } from "@/schemas/projects.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectQueries } from "@/services/queries/project.ts";
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
import React from "react";
import ErrorMessage from "@/features/ui/error-message.tsx";
import { useNavigate } from "@tanstack/react-router";
import { experimentAPI } from "@/services/api/experiment.ts";
import type { Experiment } from "@/schemas/experiment.ts";

type DeleteExperimentButtonProps = {
  experimentId: Experiment["id"];
  projectId: Project["id"];
};

const DeleteExperimentButton: React.FC<DeleteExperimentButtonProps> = ({
  experimentId,
  projectId,
}) => {
  const [open, setOpen] = React.useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate, status, error } = useMutation({
    mutationFn: experimentAPI.deleteExperiment,
    mutationKey: ["experiment", "delete", experimentId],
    onSuccess: async () => {
      queryClient.setQueryData(
        projectQueries.getProjects().queryKey,
        (oldData) => {
          if (!oldData || oldData.length === 0) return oldData;
          const newData = oldData.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                experiments: project.experiments.filter(
                  (experiment) => experiment.id !== experimentId,
                ),
              };
            }
            return project;
          });

          return [...newData];
        },
      );

      setOpen(false);

      await navigate({ to: "/project/$projectId", params: { projectId } });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete experiment</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure to delete this experiment?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            experiment and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ErrorMessage error={error?.message} />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            onClick={() => mutate(experimentId)}
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

export default DeleteExperimentButton;
