import { StorageManager } from "@/core/storage-manager";
import { Experiment, ExperimentClientConfig, User, Variant } from "@/types";
import { ApiClient } from "@/core/api-client";
import { UserNotInitializedError } from "@/lib/errors";
import { WebSocketManager } from "@/core/websocket-client";
import { ExperimentCallback, HttpClientConfig } from "@/types/http";

type ExperimentClientConstructorConfig = {
  host: HttpClientConfig["baseURL"];
  apiKey: string;
  storageManager: StorageManager;
  webSocketManager?: WebSocketManager;
  configs?: ExperimentClientConfig;
};

export class ExperimentClient {
  private apiClient: ApiClient;
  public storageManager: StorageManager;
  public configs: ExperimentClientConfig;
  private webSocketManager: WebSocketManager | null = null;
  private experimentCallbacks: Map<string, ExperimentCallback[]> = new Map();

  constructor({
    host,
    apiKey,
    storageManager,
    configs,
    webSocketManager,
  }: ExperimentClientConstructorConfig) {
    const DEFAULT_CONFIGS: ExperimentClientConfig = {
      backgroundUpdate: true,
      webSocketPath: "/ws/experiments/",
    };

    this.apiClient = new ApiClient({
      baseURL: host,
      headers: [
        {
          key: "X-API-KEY",
          value: apiKey,
        },
      ],
    });

    this.storageManager = storageManager;
    this.configs = { ...DEFAULT_CONFIGS, ...configs };

    if (!this.configs.backgroundUpdate) return;

    if (webSocketManager) {
      this.webSocketManager = webSocketManager;
      return;
    }

    this.webSocketManager = new WebSocketManager({
      host: host + this.configs?.webSocketPath,
      apiKey,
    });
  }

  public async initializeUser(userData?: Partial<User>): Promise<User> {
    const storedUser = this.storageManager.getUser();

    if (storedUser) {
      return storedUser;
    }

    const user: Partial<User> = {
      device_id: userData?.device_id || this.getDeviceId(),
      ...userData,
    };

    const initializedUser = await this.apiClient.identifyUser(user);

    this.storageManager.setUser(initializedUser);

    if (this.webSocketManager) {
      // Get all experiment keys with callbacks
      const experimentKeys = Array.from(this.experimentCallbacks.keys());

      // Connect with the stored user
      await this.webSocketManager.connect(initializedUser, experimentKeys);
    }

    return initializedUser;
  }

  public async fetchVariant<T = unknown>(experimentKey: Experiment["key"]) {
    const user = this.storageManager.getUser();

    if (!user) {
      throw new UserNotInitializedError("User not initialized");
    }

    const experiment = await this.apiClient.getVariant({ experimentKey, user });

    this.storageManager.setVariant(experimentKey, experiment.variant);

    const callbacks = this.experimentCallbacks.get(experimentKey) || [];
    const experimentObj: Experiment = {
      id: experiment.experiment.id,
      key: experimentKey,
      name: experiment.experiment.name,
      type: experiment.experiment.type,
      status: experiment.experiment.status,
    };

    callbacks.forEach((callback) => {
      try {
        callback(experimentObj, experiment.variant, "experiment_state");
      } catch (error) {
        console.error(
          `Error in experiment callback for ${experimentKey}:`,
          error,
        );
      }
    });

    return experiment.variant as Variant<T>;
  }

  private getDeviceId(): string {
    const storedDeviceId = this.storageManager.getDeviceId();

    if (storedDeviceId) {
      return storedDeviceId;
    }

    const newDeviceId = crypto.randomUUID();
    this.storageManager.setDeviceId(newDeviceId);

    return newDeviceId;
  }

  public subscribeToExperiment(
    experimentKey: Experiment["key"],
    callback: ExperimentCallback,
  ) {
    if (!this.experimentCallbacks.has(experimentKey)) {
      this.experimentCallbacks.set(experimentKey, []);
    }

    this.experimentCallbacks.get(experimentKey)?.push(callback);

    const user = this.storageManager.getUser();
    if (this.webSocketManager) {
      this.webSocketManager.subscribeToExperiment(experimentKey, callback);
      if (!this.webSocketManager.isConnected() && user) {
        this.webSocketManager.connect(user, [experimentKey]);
      }
    }

    return () => this.unsubscribeFromExperiment(experimentKey, callback);
  }

  public unsubscribeFromExperiment(
    experimentKey: Experiment["key"],
    callback?: ExperimentCallback,
  ): void {
    if (!callback) {
      // Remove all callbacks for this experiment
      this.experimentCallbacks.delete(experimentKey);
    } else {
      const callbacks = this.experimentCallbacks.get(experimentKey) || [];
      const index = callbacks.indexOf(callback);

      if (index !== -1) {
        callbacks.splice(index, 1);

        if (callbacks.length === 0) {
          this.experimentCallbacks.delete(experimentKey);
        } else {
          this.experimentCallbacks.set(experimentKey, callbacks);
        }
      }
    }

    if (this.webSocketManager) {
      this.webSocketManager.unsubscribeFromExperiment(experimentKey, callback);
    }
  }
}
