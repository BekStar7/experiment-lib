import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/features/ui/dialog.tsx";
import CreateExperimentForm from "@/features/experiment/create-experiment-form.tsx";
import type { Project } from "@/schemas/projects.ts";

type CreateExperimentDialogProps = React.PropsWithChildren<{
  projectId: Project["id"];
}>;

const CreateExperimentDialog: React.FC<CreateExperimentDialogProps> = ({
  children,
  projectId,
}) => {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogTitle>Create experiment</DialogTitle>
        <DialogDescription className="sr-only">
          Experiments can be created with different types. You can create
          experiments with a feature flag or A/B/N testing.
        </DialogDescription>
        <CreateExperimentForm
          projectId={projectId}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateExperimentDialog;
