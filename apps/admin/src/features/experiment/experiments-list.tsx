import React from "react";
import type { Project } from "@/schemas/projects.ts";
import ExperimentCard from "@/features/experiment/experiment-card.tsx";
import CreateExperimentDialog from "@/features/experiment/create-experiment-dialog.tsx";
import { Button } from "@/features/ui/button.tsx";
import type { Experiment } from "@/schemas/experiment.ts";
import { Plus } from "lucide-react";

type ExperimentsListProps = {
  projectId: Project["id"];
  experiments: Experiment[];
};

const ExperimentsList: React.FC<ExperimentsListProps> = ({
  projectId,
  experiments,
}) => {
  if (experiments.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-xl font-bold">You have no experiments</h2>
        <CreateExperimentDialog projectId={projectId}>
          <Button>Create Experiment</Button>
        </CreateExperimentDialog>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Experiments ({experiments.length})
        </h2>
        <CreateExperimentDialog projectId={projectId}>
          <Button size="icon" variant="secondary">
            <Plus className="h-4 w-4" />{" "}
            <span className="sr-only">Create Experiment</span>
          </Button>
        </CreateExperimentDialog>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {experiments.map((experiment) => (
          <ExperimentCard
            projectId={projectId}
            experiment={experiment}
            key={experiment.id}
          />
        ))}
      </div>
    </div>
  );
};

export default ExperimentsList;
