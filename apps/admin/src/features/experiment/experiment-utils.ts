import type { Experiment } from "@/schemas/experiment.ts";

const experimentStatuses = {
  draft: "Draft",
  running: "Running",
  completed: "Completed",
};

export const getExperimentStatus = (status: Experiment["status"]) => {
  return experimentStatuses[status];
};

export const getExperimentType = (type: Experiment["type"]) => {
  return type === "toggle" ? "Feature flag" : "A/B/N testing";
};

export const getComponentUseCode = (
  experiment: Experiment,
  withPayload: boolean = false,
) => {
  if (experiment.type === "toggle") {
    return `<ExparoFeatureFlag experimentKey="${experiment.key}" fallback={<span>Not active</span>}>
  ${withPayload ? "{(payload?: { message: string }) => <div>{payload?.message}</div>}" : "Active"}
</ExparoFeatureFlag>`;
  }

  if (withPayload) {
    if (experiment.variants.length < 1) return "";

    return `<ExparoVariantRenderer variantKey="${experiment.variants[0].key}">
  {(payload?: { message: string }) => <div>{payload?.message}</div>}
</ExparoVariantRenderer>`;
  }

  return `<ExparoVariants experimentKey="${experiment.key}" fallback={<span>Falback component</span>}>
${experiment.variants
  .map(
    (variant) =>
      `  <ExparoVariantRenderer variantKey="${variant.key}">
    ${variant.key}
  </ExparoVariantRenderer>`,
  )
  .join("\n")}
</ExparoVariants>`;
};

export const getHookUseCode = (experiment: Experiment) => {
  if (experiment.type === "toggle") {
    return `function SampleComponent() {
  const {
    isEnabled,
    isLoading,
    error,
    isRunning,
    payload
  } = useFeatureFlag<{ message: string }>("${experiment.key}");

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!isRunning) {
    return <div>Experiment is not running</div>;
  }

  return (
    <div>
      {isEnabled ? "Active" : "Not active"}
      {payload && <div>{payload.message}</div>}
    </div>
  );
}`;
  }

  return `function SampleComponent() {
  const {
    variant,
    isLoading,
    error,
    isRunning,
    payload,
   } = useGetVariant<{ message: string }>("${experiment.key}");

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!isRunning) {
    return <div>Experiment is not running</div>;
  }

  return (
    <div>
${experiment.variants
  .map(
    (variant) =>
      `      {variant?.key === "${variant.key}" && <div>Variant ${variant.key}</div>}`,
  )
  .join("\n")}
      {payload && <div>{payload.message}</div>}
    </div>
  );
}`;
};
