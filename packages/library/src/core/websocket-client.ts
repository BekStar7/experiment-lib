import { Experiment, User, Variant, WebSocketConfig } from "@/types";
import { ExperimentCallback } from "@/types/http";

export class WebSocketManager {
  private socket: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private config: WebSocketConfig;
  private experimentCallbacks: Map<string, ExperimentCallback[]> = new Map();
  private connectionStateCallbacks: ((connected: boolean) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private shouldReconnect = true;

  constructor(config: WebSocketConfig) {
    const DEFAULT_CONFIG: Partial<WebSocketConfig> = {
      reconnect: true,
      maxReconnectDelay: 30 * 1000,
      debug: false,
    };

    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public async connect(
    user?: User,
    experimentKeys: string[] = [],
  ): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.log("WebSocket already connected");
      return;
    }

    // Clear any existing reconnect timeout
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.shouldReconnect = true;

    try {
      if (!this.config.apiKey) {
        throw new Error("API key is required for WebSocket connection");
      }

      if (!user) {
        throw new Error("User is required for WebSocket connection");
      }

      // Construct the WebSocket URL with query parameters
      let wsUrl = this.config.host;

      // Add query parameters
      const params = new URLSearchParams();
      params.append("api_key", this.config.apiKey);

      // Add user identifiers
      if (user.id) params.append("user_id", user.id);
      if (user.device_id) params.append("device_id", user.device_id);
      if (user.email) params.append("email", user.email);
      if (user.external_id) params.append("external_id", user.external_id);

      // Add experiment keys if provided
      if (experimentKeys.length > 0) {
        params.append("experiments", experimentKeys.join(","));
      }

      // Append params to URL
      wsUrl += `?${params.toString()}`;

      // Create WebSocket connection
      this.socket = new WebSocket(wsUrl);

      // Set up event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = (event: CloseEvent) =>
        this.handleClose(user, event);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      this.log("Error connecting to WebSocket:", error);
      this.notifyConnectionState(false);
      this.scheduleReconnect(user);
    }
  }

  public disconnect(): void {
    this.shouldReconnect = false;

    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.log("WebSocket disconnected");
    this.notifyConnectionState(false);
  }

  public subscribeToExperiment(
    experimentKey: string,
    callback: ExperimentCallback,
  ): void {
    // Register the callback
    if (!this.experimentCallbacks.has(experimentKey)) {
      this.experimentCallbacks.set(experimentKey, []);
    }

    this.experimentCallbacks.get(experimentKey)?.push(callback);

    // If already connected, send a subscribe message
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: "subscribe_experiment",
          experiment_key: experimentKey,
        }),
      );
    }
  }

  /**
   * Unsubscribe from updates for a specific experiment
   */
  public unsubscribeFromExperiment(
    experimentKey: string,
    callback?: ExperimentCallback,
  ): void {
    if (!callback) {
      // Remove all callbacks for this experiment
      this.experimentCallbacks.delete(experimentKey);
    } else {
      // Remove only the specified callback
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

    // If connected and no more callbacks for this experiment, unsubscribe
    if (
      this.socket &&
      this.socket.readyState === WebSocket.OPEN &&
      !this.experimentCallbacks.has(experimentKey)
    ) {
      this.socket.send(
        JSON.stringify({
          type: "unsubscribe_experiment",
          experiment_key: experimentKey,
        }),
      );
    }
  }

  /**
   * Subscribe to connection state changes
   */
  public subscribeToConnectionState(
    callback: (connected: boolean) => void,
  ): void {
    this.connectionStateCallbacks.push(callback);

    // Immediately notify of current state if socket exists
    if (this.socket) {
      callback(this.socket.readyState === WebSocket.OPEN);
    } else {
      callback(false);
    }
  }

  /**
   * Unsubscribe from connection state changes
   */
  public unsubscribeFromConnectionState(
    callback: (connected: boolean) => void,
  ): void {
    const index = this.connectionStateCallbacks.indexOf(callback);

    if (index !== -1) {
      this.connectionStateCallbacks.splice(index, 1);
    }
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event): void {
    this.log("WebSocket connected");
    this.reconnectAttempts = 0;
    this.notifyConnectionState(true);
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      this.log("WebSocket message received:", data);

      if (
        data.type === "distribution_updated" ||
        data.type === "experiment_state" ||
        data.type === "experiment_updated"
      ) {
        const experimentKey = data.experiment.key;
        const experiment: Experiment = {
          id: data.experiment.id,
          key: experimentKey,
          name: data.experiment.name,
          type: data.experiment.type,
          status: data.experiment.status,
        };

        const variant: Variant = {
          id: data.variant.id,
          key: data.variant.key,
          payload: data.variant.payload,
        };

        // Notify subscribers
        const callbacks = this.experimentCallbacks.get(experimentKey) || [];
        callbacks.forEach((callback) => {
          try {
            callback(experiment, variant, data.type);
          } catch (error) {
            this.log("Error in experiment callback:", error);
          }
        });
      }
    } catch (error) {
      this.log("Error parsing WebSocket message:", error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(user: User, event: CloseEvent): void {
    this.log(`WebSocket closed with code ${event.code}: ${event.reason}`);
    this.socket = null;
    this.notifyConnectionState(false);

    // Don't reconnect if closed normally or if we shouldn't reconnect
    if (
      (event.code === 1000 || !this.shouldReconnect) &&
      event.code !== 4000 && // Authentication error
      event.code !== 4001 && // Project not found
      event.code !== 4002 && // No user identifiers
      event.code !== 4003
    ) {
      // User not found
      return;
    }

    // Schedule reconnect
    this.scheduleReconnect(user);
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    this.log("WebSocket error:", event);
    // Error handling will be done in the close event
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(user?: User): void {
    if (
      !this.config.reconnect ||
      this.reconnectAttempts >= this.maxReconnectAttempts ||
      !this.shouldReconnect
    ) {
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts),
      this.config.maxReconnectDelay || 30000,
    );

    this.log(
      `Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`,
    );

    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectAttempts++;

      // Get experiment keys from callbacks
      const experimentKeys = Array.from(this.experimentCallbacks.keys());

      // Try to reconnect
      this.connect(user, experimentKeys).catch((error) => {
        this.log("Error reconnecting:", error);
      });
    }, delay);
  }

  /**
   * Notify connection state subscribers
   */
  private notifyConnectionState(connected: boolean): void {
    this.connectionStateCallbacks.forEach((callback) => {
      try {
        callback(connected);
      } catch (error) {
        this.log("Error in connection state callback:", error);
      }
    });
  }

  /**
   * Utility function for logging
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log("[WebSocketManager]", ...args);
    }
  }
}
