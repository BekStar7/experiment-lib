import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/features/ui/dialog.tsx";
import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsAPI } from "@/services/api/projects.ts";
import { projectQueries } from "@/services/queries/project.ts";
import { toast } from "sonner";
import ProjectForm from "@/features/project/project-form.tsx";
import { z } from "zod";
import { createOrUpdateProjectSchema } from "@/schemas/projects.ts";

type AddProjectDialogProps = React.PropsWithChildren;

const AddProjectDialog: React.FC<AddProjectDialogProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false);

  const queryClient = useQueryClient();

  const { mutate, status, error } = useMutation({
    mutationFn: projectsAPI.createProject,
    mutationKey: ["project", "create"],
    onSuccess: async (data) => {
      queryClient.setQueryData(
        projectQueries.getProjects().queryKey,
        (oldData) => {
          if (!oldData || oldData.length === 0) oldData = [];
          return [...oldData, data];
        },
      );

      setOpen(false);
      toast.success("Project created successfully");
    },
  });

  const onSubmit = (data: z.infer<typeof createOrUpdateProjectSchema>) =>
    mutate(data);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add new Project</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new project to manage your experiments.
          </DialogDescription>
        </DialogHeader>
        <ProjectForm onSubmit={onSubmit} status={status} error={error} />
      </DialogContent>
    </Dialog>
  );
};

export default AddProjectDialog;
