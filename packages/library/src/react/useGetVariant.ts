import { Experiment, Variant } from "@/types";
import { HookOptions, UseGetVariantReturnType } from "@/types/react";
import { useExperimentClient } from "@/react/experiment-context";
import { useQuery } from "@/react/useQuery";
import React from "react";
import { ExperimentCallback } from "@/types/http";

export const useGetVariant = <T>(
  experimentKey: Experiment["key"],
  options: HookOptions<T> = {},
): UseGetVariantReturnType<T> => {
  const experimentClient = useExperimentClient();

  const { refetchOnMount = false, defaultVariant = null } = options;

  const storedVariant = experimentClient.storageManager.getVariant(
    experimentKey,
  ) as Variant<T>;

  const [variant, setVariant] = React.useState<Variant<T> | null>(
    storedVariant || defaultVariant,
  );

  const updateVariant = (variant: Variant<T>) => {
    setVariant(variant);
    experimentClient.storageManager.setVariant(experimentKey, variant);
  };

  const [experiment, setExperiment] = React.useState<Experiment | null>(null);

  const shouldFetch =
    refetchOnMount || !variant || !experimentClient.configs.backgroundUpdate;

  const query = useQuery(
    () => {
      if (shouldFetch) {
        return experimentClient.fetchVariant<T>(experimentKey);
      }

      return Promise.resolve(variant);
    },
    [experimentKey, shouldFetch],
    {
      onSuccess: (data) => {
        updateVariant(data);
      },
    },
  );

  React.useEffect(() => {
    const handleVariantUpdate: ExperimentCallback = (
      experimentData,
      variantData,
      type,
    ) => {
      setExperiment(experimentData);
      if (type === "experiment_updated") {
        if (variant?.key === variantData.key) {
          updateVariant(variantData as Variant<T>);
        }
        return;
      }
      updateVariant(variantData as Variant<T>);
    };

    const unsubscribe = experimentClient.subscribeToExperiment(
      experimentKey,
      handleVariantUpdate,
    );

    return unsubscribe;
  }, [experimentClient, experimentKey]);

  const isA = variant?.key === "A";
  const isB = variant?.key === "B";
  const isControl = variant?.key === "control";
  const isEnabled = variant?.key === "enabled";
  const isDisabled = variant?.key === "disabled";
  const isRunning = experiment?.status === "running";

  const payload = variant?.payload;

  return {
    variant,
    experiment,
    payload,
    isLoading: variant ? false : query.isLoading,
    isFetching: query.isLoading,
    error: query.error,
    isA,
    isB,
    isControl,
    isEnabled,
    isDisabled,
    isRunning,
    refresh: query.refetch,
  };
};
