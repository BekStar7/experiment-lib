import type { Project } from "@/schemas/projects.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsAPI } from "@/services/api/projects.ts";
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

type DeleteProjectButtonProps = {
  projectId: Project["id"];
};

const DeleteProjectButton: React.FC<DeleteProjectButtonProps> = ({
  projectId,
}) => {
  const [open, setOpen] = React.useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate, status, error } = useMutation({
    mutationFn: projectsAPI.deleteProject,
    mutationKey: ["project", "delete", projectId],
    onSuccess: async () => {
      queryClient.setQueryData(
        projectQueries.getProjects().queryKey,
        (oldData) => {
          if (!oldData || oldData.length === 0) return oldData;
          const newData = oldData.filter((project) => project.id !== projectId);
          return [...newData];
        },
      );

      setOpen(false);

      await navigate({ to: "/" });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete project</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure to delete this project?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            project, experiments and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ErrorMessage error={error?.message} />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            onClick={() => mutate(projectId)}
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

export default DeleteProjectButton;
