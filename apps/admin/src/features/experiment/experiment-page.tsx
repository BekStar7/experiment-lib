import type { Experiment } from "@/schemas/experiment.ts";
import React from "react";
import UpdateExperimentForm from "@/features/experiment/edit-experiment-form.tsx";
import type { Project } from "@/schemas/projects.ts";
import ExperimentStatusActions from "@/features/experiment/experiment-status-actions.tsx";
import { getExperimentType } from "@/features/experiment/experiment-utils.ts";
import DeleteExperimentButton from "@/features/experiment/delete-experiment-button.tsx";
import VariantList from "@/features/variant/variant-list.tsx";
import ExperimentStats from "@/features/experiment/experiment-stats.tsx";
import HowToUse from "@/features/experiment/how-to-use.tsx";

type ExperimentPageProps = {
  projectId: Project["id"];
  experiment: Experiment;
};

const ExperimentPage: React.FC<ExperimentPageProps> = ({
  experiment,
  projectId,
}) => {
  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{experiment.name}</h1>
          <p>Type: {getExperimentType(experiment.type)}</p>
        </div>
        <ExperimentStatusActions
          projectId={projectId}
          experimentId={experiment.id}
          status={experiment.status}
        />
      </div>
      <UpdateExperimentForm experiment={experiment} projectId={projectId} />
      <div className="py-4" />
      <VariantList
        projectId={projectId}
        experiment={experiment}
        variants={experiment.variants}
      />
      <div className="py-4" />
      <HowToUse experiment={experiment} />
      <div className="py-4" />
      <ExperimentStats experimentId={experiment.id} />
      <div className="py-4" />
      <DeleteExperimentButton
        experimentId={experiment.id}
        projectId={projectId}
      />
    </div>
  );
};

export default ExperimentPage;
