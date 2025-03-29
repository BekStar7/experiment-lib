import { HttpClientConfig } from "@/types/http";

export interface ExperimentClientConfig {
  backgroundUpdate?: boolean;
  webSocketPath?: string;
}

export interface WebSocketConfig {
  reconnect?: boolean;
  maxReconnectDelay?: number;
  debug?: boolean;
  host: string;
  apiKey: string;
}

export interface ExperimentUpdateEvent {
  type: "experiment_updated" | "distribution_updated" | "experiment_state";
  experiment: Experiment;
  variant: Variant<any>;
}

export interface ExperimentClientProviderConfig {
  host: HttpClientConfig["baseURL"];
  apiKey: string;
  storage?: Storage;
  configs?: ExperimentClientConfig;
}

export interface Variant<T = unknown> {
  id: string;
  key: string;
  payload?: T;
}

export interface User {
  id: string;
  device_id?: string;
  email?: string;
  external_id?: string;
  first_seen?: string;
  last_seen?: string;
  latest_current_url?: string;
  latest_os?: string;
  latest_os_version?: string;
  latest_device_type?: string;
  properties?: Record<string, unknown>;
}

export interface Experiment {
  id: string;
  key: string;
  name: string;
  type: "toggle" | "multiple_variant";
  status: "draft" | "running" | "completed";
}

export interface VariantResp {
  experiment: Experiment;
  variant: Variant;
}

export interface ExperimentsResp {
  user: User;
  experiments: VariantResp[];
}
