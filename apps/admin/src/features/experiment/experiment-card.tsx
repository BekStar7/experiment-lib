import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/features/ui/card.tsx";
import { getExperimentType } from "@/features/experiment/experiment-utils.ts";
import { Button } from "@/features/ui/button.tsx";
import { Link } from "@tanstack/react-router";
import type { Project } from "@/schemas/projects.ts";
import type { Experiment } from "@/schemas/experiment.ts";
import ExperimentStatusActions from "@/features/experiment/experiment-status-actions.tsx";

type ExperimentCardProps = {
  projectId: Project["id"];
  experiment: Experiment;
};

const ExperimentCard: React.FC<ExperimentCardProps> = ({
  projectId,
  experiment,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{experiment.name}</CardTitle>
        <CardDescription>{getExperimentType(experiment.type)}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Variants: {experiment.variants.length}</p>
      </CardContent>
      <CardFooter className="justify-between gap-2 flex-wrap">
        <Button size="sm" asChild>
          <Link
            to="/project/$projectId/experiment/$experimentId"
            params={{ projectId: projectId, experimentId: experiment.id }}
          >
            Settings
          </Link>
        </Button>
        <ExperimentStatusActions
          projectId={projectId}
          experimentId={experiment.id}
          status={experiment.status}
        />
      </CardFooter>
    </Card>
  );
};

export default ExperimentCard;
