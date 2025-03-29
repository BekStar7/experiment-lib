import { AxiosRequestConfig } from "axios";
import { Experiment, Variant } from "@/types/index";

export interface RetryConfig {
  attempts: number;
  initialDelay: number;
  maxDelay: number;
  shouldRetry: (error: unknown) => boolean;
}

export interface InterceptorHeader {
  key: string;
  value: string;
}

export interface HttpClientConfig {
  baseURL: string;
  headers: InterceptorHeader[];
  timeout?: number;
  retry?: Partial<RetryConfig>;
}

export interface RequestOptions
  extends Omit<AxiosRequestConfig, "baseURL" | "cancelToken"> {
  skipRetry?: boolean;
}

export interface ExperimentCallback {
  (
    experiment: Experiment,
    variant: Variant,
    type: "experiment_updated" | "distribution_updated" | "experiment_state",
  ): void;
}
