import React from "react";
import { useFeatureFlag } from "@/react/useFeatureFlag";

type ExparoFeatureFlagProps<T> = {
  experimentKey: string;
  children: React.ReactNode | ((payload: T | undefined) => React.ReactNode);
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
};

export function ExparoFeatureFlag<T>({
  experimentKey,
  fallback,
  loading,
  children,
}: ExparoFeatureFlagProps<T>) {
  const { isEnabled, payload, isLoading, isFetching, error, isRunning } =
    useFeatureFlag<T>(experimentKey);

  if (!isEnabled || error || !isRunning) {
    return fallback;
  }

  if (isLoading && loading) {
    return loading;
  }

  if (typeof children === "function") {
    return children(payload);
  }

  return children;
}
