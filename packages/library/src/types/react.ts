import { Experiment, Variant } from "@/types/index";

export interface HookOptions<T> {
  refetchOnMount?: boolean;
  defaultVariant?: Variant<T> | null;
}

export type UseGetVariantReturnType<T> = {
  variant: Variant<T> | null;
  experiment: Experiment | null;
  payload?: T;
  isLoading: boolean;
  isFetching: boolean;
  error?: Error;
  isA: boolean;
  isB: boolean;
  isControl: boolean;
  isEnabled: boolean;
  isDisabled: boolean;
  isRunning: boolean;
  refresh: () => void;
};

export type UseFeatureFlagReturnType<T> = Pick<
  UseGetVariantReturnType<T>,
  | "payload"
  | "isLoading"
  | "isFetching"
  | "error"
  | "refresh"
  | "isRunning"
  | "isEnabled"
  | "isControl"
>;
