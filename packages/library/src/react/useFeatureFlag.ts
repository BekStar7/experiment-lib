import { Experiment } from "@/types";
import { useGetVariant } from "@/react/useGetVariant";
import { HookOptions, UseFeatureFlagReturnType } from "@/types/react";

export const useFeatureFlag = <T>(
  experimentKey: Experiment["key"],
  options: HookOptions<T> = {},
): UseFeatureFlagReturnType<T> => {
  const {
    payload,
    isLoading,
    isFetching,
    error,
    refresh,
    isRunning,
    isEnabled,
    isControl,
  } = useGetVariant<T>(experimentKey, options);

  return {
    payload,
    isLoading,
    isFetching,
    error,
    refresh,
    isRunning,
    isEnabled,
    isControl,
  };
};
