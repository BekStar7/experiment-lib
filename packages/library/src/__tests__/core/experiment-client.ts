import { ExperimentClient } from "@/core/experiment-client";
import { StorageManager } from "@/core/storage-manager";
import { ApiClient } from "@/core/api-client";
import { WebSocketManager } from "@/core/websocket-client";
import { Experiment, User, Variant, VariantResp } from "@/types";
import { UserNotInitializedError } from "@/lib/errors";

jest.mock("@/core/api-client");
jest.mock("@/core/storage-manager");
jest.mock("@/core/websocket-client");

describe("ExperimentClient", () => {
  let experimentClient: ExperimentClient;
  let mockApiClient: jest.Mocked<ApiClient>;
  let mockStorageManager: jest.Mocked<StorageManager>;
  let mockWebSocketManager: jest.Mocked<WebSocketManager>;

  const host = "https://api.example.com";
  const apiKey = "test-api-key";

  beforeEach(() => {
    jest.clearAllMocks();

    mockApiClient = new ApiClient({} as any) as jest.Mocked<ApiClient>;
    (ApiClient as jest.Mock).mockImplementation(() => mockApiClient);

    mockStorageManager = new StorageManager(
      {} as any,
    ) as jest.Mocked<StorageManager>;

    mockWebSocketManager = new WebSocketManager(
      {} as any,
    ) as jest.Mocked<WebSocketManager>;
    (WebSocketManager as jest.Mock).mockImplementation(
      () => mockWebSocketManager,
    );

    experimentClient = new ExperimentClient({
      host,
      apiKey,
      storageManager: mockStorageManager,
      webSocketManager: mockWebSocketManager,
    });
  });

  describe("constructor", () => {
    it("should initialize with default configs", () => {
      const client = new ExperimentClient({
        host,
        apiKey,
        storageManager: mockStorageManager,
      });

      expect(client.configs).toEqual(
        expect.objectContaining({
          backgroundUpdate: true,
          webSocketPath: "/ws/experiments/",
        }),
      );
    });

    it("should override defaults with provided configs", () => {
      const customConfigs = {
        backgroundUpdate: false,
        webSocketPath: "/custom/path/",
      };

      const client = new ExperimentClient({
        host,
        apiKey,
        storageManager: mockStorageManager,
        configs: customConfigs,
      });

      expect(client.configs).toEqual(expect.objectContaining(customConfigs));
    });

    it("should not initialize WebSocketManager if backgroundUpdate is false", () => {
      const client = new ExperimentClient({
        host,
        apiKey,
        storageManager: mockStorageManager,
        configs: {
          backgroundUpdate: false,
        },
      });

      expect(WebSocketManager).toHaveBeenCalledWith({});
    });
  });

  describe("initializeUser", () => {
    it("should return stored user if available", async () => {
      const mockUser: User = {
        id: "user-123",
        device_id: "test-device-id",
        email: "test@example.com",
        external_id: "test-external-id",
      };

      mockStorageManager.getUser.mockReturnValueOnce(mockUser);

      const result = await experimentClient.initializeUser();

      expect(result).toEqual(mockUser);
      expect(mockApiClient.identifyUser).not.toHaveBeenCalled();
    });

    it("should create a new user if none exists", async () => {
      const mockDeviceId = "generated-device-id";
      const partialUser = {
        email: "test@example.com",
      };

      mockStorageManager.getUser.mockReturnValueOnce(null);
      mockStorageManager.getDeviceId.mockReturnValueOnce(mockDeviceId);

      const mockApiResponse: User = {
        id: "user-123",
        device_id: mockDeviceId,
        email: "test@example.com",
      };

      mockApiClient.identifyUser.mockResolvedValueOnce(mockApiResponse);

      const result = await experimentClient.initializeUser(partialUser);

      expect(mockApiClient.identifyUser).toHaveBeenCalledWith({
        device_id: mockDeviceId,
        email: "test@example.com",
      });

      expect(mockStorageManager.setUser).toHaveBeenCalledWith(mockApiResponse);
      expect(result).toEqual(mockApiResponse);
    });

    it("should generate and store device ID if none exists", async () => {
      const generatedDeviceId = "uuid-123";

      // Mock crypto.randomUUID
      const originalRandomUUID = crypto.randomUUID;
      crypto.randomUUID = jest.fn().mockReturnValueOnce(generatedDeviceId);

      mockStorageManager.getUser.mockReturnValueOnce(null);
      mockStorageManager.getDeviceId.mockReturnValueOnce(null);

      const mockApiResponse: User = {
        id: "user-123",
        device_id: generatedDeviceId,
      };

      mockApiClient.identifyUser.mockResolvedValueOnce(mockApiResponse);

      await experimentClient.initializeUser();

      expect(mockStorageManager.setDeviceId).toHaveBeenCalledWith(
        generatedDeviceId,
      );
      expect(mockApiClient.identifyUser).toHaveBeenCalledWith({
        device_id: generatedDeviceId,
      });

      crypto.randomUUID = originalRandomUUID;
    });

    it("should connect WebSocketManager if available", async () => {
      const mockUser: User = {
        id: "user-123",
        device_id: "test-device-id",
      };

      mockStorageManager.getUser.mockReturnValueOnce(null);
      mockApiClient.identifyUser.mockResolvedValueOnce(mockUser);

      (experimentClient as any).experimentCallbacks = new Map([
        ["exp1", [jest.fn()]],
        ["exp2", [jest.fn()]],
      ]);

      await experimentClient.initializeUser();

      expect(mockWebSocketManager.connect).toHaveBeenCalledWith(
        mockUser,
        expect.arrayContaining(["exp1", "exp2"]),
      );
    });
  });

  describe("fetchVariant", () => {
    const experimentKey = "test-experiment";
    const mockUser: User = {
      id: "user-123",
      device_id: "test-device-id",
    };

    const mockExperiment: Experiment = {
      id: "exp-123",
      key: experimentKey,
      name: "Test Experiment",
      type: "toggle",
      status: "draft",
    };

    const mockVariant: Variant = {
      id: "var-123",
      key: "A",
      payload: { title: "Variant A" },
    };

    const mockApiResponse: VariantResp = {
      experiment: {
        id: mockExperiment.id,
        key: mockExperiment.key,
        name: mockExperiment.name,
        type: "toggle",
        status: "draft",
      },
      variant: mockVariant,
    };

    beforeEach(() => {
      mockStorageManager.getUser.mockReturnValueOnce(mockUser);
      mockApiClient.getVariant.mockResolvedValueOnce(mockApiResponse);
    });

    it("should throw error if user is not initialized", async () => {
      mockStorageManager.getUser(); // to override the beforeEach setup

      mockStorageManager.getUser.mockReturnValueOnce(null);

      await expect(
        experimentClient.fetchVariant(experimentKey),
      ).rejects.toThrow(new UserNotInitializedError("User not initialized"));
      expect(mockApiClient.getVariant).not.toHaveBeenCalled();
    });

    it("should fetch variant from API and store it", async () => {
      const result = await experimentClient.fetchVariant(experimentKey);

      expect(mockApiClient.getVariant).toHaveBeenCalledWith({
        experimentKey,
        user: mockUser,
      });

      expect(mockStorageManager.setVariant).toHaveBeenCalledWith(
        experimentKey,
        mockVariant,
      );

      expect(result).toEqual(mockVariant);
    });

    it("should invoke callbacks when variant is fetched", async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      (experimentClient as any).experimentCallbacks = new Map([
        [experimentKey, [callback1, callback2]],
      ]);

      await experimentClient.fetchVariant(experimentKey);

      expect(callback1).toHaveBeenCalledWith(
        expect.objectContaining(mockExperiment),
        mockVariant,
        "experiment_state",
      );

      expect(callback2).toHaveBeenCalledWith(
        expect.objectContaining(mockExperiment),
        mockVariant,
        "experiment_state",
      );
    });

    it("should handle callback errors", async () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error("Callback error");
      });

      console.error = jest.fn();

      (experimentClient as any).experimentCallbacks = new Map([
        [experimentKey, [errorCallback]],
      ]);

      await experimentClient.fetchVariant(experimentKey);

      expect(errorCallback).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("subscribeToExperiment", () => {
    const experimentKey = "test-experiment";
    const callback = jest.fn();

    it("should register callback for experiment", () => {
      experimentClient.subscribeToExperiment(experimentKey, callback);

      const callbacks = (experimentClient as any).experimentCallbacks.get(
        experimentKey,
      );
      expect(callbacks).toContain(callback);
    });

    it("should subscribe to WebSocketManager if available", () => {
      experimentClient.subscribeToExperiment(experimentKey, callback);

      expect(mockWebSocketManager.subscribeToExperiment).toHaveBeenCalledWith(
        experimentKey,
        callback,
      );
    });

    it("should connect WebSocketManager if user is available", () => {
      const mockUser: User = {
        id: "user-123",
        device_id: "test-device-id",
      };

      mockStorageManager.getUser.mockReturnValueOnce(mockUser);
      mockWebSocketManager.isConnected.mockReturnValueOnce(false);

      experimentClient.subscribeToExperiment(experimentKey, callback);

      expect(mockWebSocketManager.connect).toHaveBeenCalledWith(mockUser, [
        experimentKey,
      ]);
    });

    it("should return unsubscribe function", () => {
      const unsubscribe = experimentClient.subscribeToExperiment(
        experimentKey,
        callback,
      );

      expect(typeof unsubscribe).toBe("function");

      unsubscribe();

      expect(
        mockWebSocketManager.unsubscribeFromExperiment,
      ).toHaveBeenCalledWith(experimentKey, callback);
    });
  });

  describe("unsubscribeFromExperiment", () => {
    const experimentKey = "test-experiment";
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    beforeEach(() => {
      (experimentClient as any).experimentCallbacks = new Map([
        [experimentKey, [callback1, callback2]],
        ["other-experiment", [jest.fn()]],
      ]);
    });

    it("should remove specific callback if provided", () => {
      experimentClient.unsubscribeFromExperiment(experimentKey, callback1);

      const callbacks = (experimentClient as any).experimentCallbacks.get(
        experimentKey,
      );
      expect(callbacks).not.toContain(callback1);
      expect(callbacks).toContain(callback2);
    });

    it("should remove all callbacks if none provided", () => {
      experimentClient.unsubscribeFromExperiment(experimentKey);

      expect(
        (experimentClient as any).experimentCallbacks.has(experimentKey),
      ).toBe(false);
      expect(
        (experimentClient as any).experimentCallbacks.has("other-experiment"),
      ).toBe(true);
    });

    it("should unsubscribe from WebSocketManager", () => {
      experimentClient.unsubscribeFromExperiment(experimentKey, callback1);

      expect(
        mockWebSocketManager.unsubscribeFromExperiment,
      ).toHaveBeenCalledWith(experimentKey, callback1);
    });
  });
});
