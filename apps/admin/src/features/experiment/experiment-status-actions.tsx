import type { Experiment } from "@/schemas/experiment.ts";
import type { Project } from "@/schemas/projects.ts";
import React from "react";
import { Button } from "@/features/ui/button.tsx";
import { Check, Play, RotateCcw } from "lucide-react";
import { getExperimentStatus } from "@/features/experiment/experiment-utils.ts";
import { useExperimentUpdate } from "@/features/experiment/use-experiment-update.ts";
import { toast } from "sonner";

type ExperimentStatusActionsProps = {
  projectId: Project["id"];
  experimentId: Experiment["id"];
  status: Experiment["status"];
};

const ExperimentStatusActions: React.FC<ExperimentStatusActionsProps> = ({
  projectId,
  status,
  experimentId,
}) => {
  const { mutate, status: mutationStatus } = useExperimentUpdate({
    experimentId,
    projectId,
    onSuccess: () => {
      toast.success("Experiment status updated");
    },
    onError: (error) => {
      toast.error("Error updating experiment status: " + error.message);
    },
  });

  const handleStatusUpdate = (status: Experiment["status"]) => {
    mutate({
      id: experimentId,
      data: {
        status,
      },
    });
  };

  if (status === "draft") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground font-medium">
          {getExperimentStatus(status)}
        </span>
        <Button
          status={mutationStatus}
          onClick={() => handleStatusUpdate("running")}
          variant="outline"
          size="sm"
        >
          <Play className="h-4 w-4 text-green-400" />
          <span>Activate the experiment</span>
        </Button>
      </div>
    );
  }

  if (status === "running") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-green-400 font-medium">
          {getExperimentStatus(status)}
        </span>
        <Button
          status={mutationStatus}
          onClick={() => handleStatusUpdate("completed")}
          variant="outline"
          size="sm"
        >
          <Check className="h-4 w-4 text-green-400" />
          <span>Complete the experiment</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-green-400 font-medium">
        {getExperimentStatus(status)}
      </span>
      <Button
        status={mutationStatus}
        onClick={() => handleStatusUpdate("running")}
        variant="outline"
        size="sm"
      >
        <RotateCcw className="h-4 w-4" />
        <span>Restart the experiment</span>
      </Button>
    </div>
  );
};

export default ExperimentStatusActions;
