import React from "react";
import type { Variant } from "@/schemas/variant.ts";
import VariantForm from "@/features/variant/variant-form.tsx";
import type { Experiment } from "@/schemas/experiment.ts";
import ToggleVariantForm from "@/features/variant/toggle-variant-form.tsx";
import type { Project } from "@/schemas/projects.ts";

type VariantListProps = {
  projectId: Project["id"];
  experiment: Experiment;
  variants: Variant[];
};

const VariantList: React.FC<VariantListProps> = ({
  projectId,
  variants,
  experiment,
}) => {
  if (experiment.type === "toggle") {
    return (
      <ToggleVariantForm
        projectId={projectId}
        experimentId={experiment.id}
        variants={variants}
      />
    );
  }

  return (
    <VariantForm
      key={`variantForm-${variants.length}`}
      projectId={projectId}
      experimentId={experiment.id}
      variants={variants}
    />
  );
};

export default VariantList;
