import { ApiClient } from "@/core/api-client";
import { HttpClient } from "@/core/http-client";
import { Experiment, User, VariantResp } from "@/types";

// Mock HTTP Client
jest.mock("@/core/http-client", () => {
  return {
    HttpClient: jest.fn().mockImplementation(() => {
      return {
        request: jest.fn(),
      };
    }),
  };
});

describe("ApiClient", () => {
  let apiClient: ApiClient;
  let mockHttpClient: jest.Mocked<HttpClient>;

  const mockConfig = {
    baseURL: "https://api.example.com",
    headers: [
      {
        key: "X-API-KEY",
        value: "test-api-key",
      },
    ],
  };

  const mockUser: Omit<User, "id"> = {
    device_id: "test-device-id",
    email: "test@example.com",
    external_id: "test-external-id",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient = new ApiClient(mockConfig);
    mockHttpClient = (HttpClient as jest.Mock).mock.results[0].value;
  });

  describe("identifyUser", () => {
    it("should make a POST request to identify a user", async () => {
      const mockResponse: User = {
        id: "user-123",
        ...mockUser,
      };

      mockHttpClient.request.mockResolvedValueOnce(mockResponse);

      const result = await apiClient.identifyUser(mockUser);

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: "POST",
        url: "api/users/identify",
        data: mockUser,
      });

      expect(result).toEqual(mockResponse);
    });

    it("should handle errors from the HTTP client", async () => {
      const mockError = new Error("Network error");
      mockHttpClient.request.mockRejectedValueOnce(mockError);

      await expect(apiClient.identifyUser(mockUser)).rejects.toThrow(
        "Network error",
      );
    });
  });

  describe("getVariant", () => {
    it("should make a GET request to get a variant for an experiment", async () => {
      const experimentKey = "test-experiment";
      const mockResponse: VariantResp = {
        experiment: {
          id: "exp-123",
          key: experimentKey,
          name: "Test Experiment",
          type: "toggle",
          status: "draft",
        },
        variant: {
          id: "var-123",
          key: "A",
          payload: { title: "Variant A" },
        },
      };

      mockHttpClient.request.mockResolvedValueOnce(mockResponse);

      const result = await apiClient.getVariant({
        experimentKey,
        user: mockUser,
      });

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: "GET",
        url: `api/experiments/${experimentKey}/variant`,
        params: mockUser,
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe("getExperiments", () => {
    it("should make a GET request to get all experiments for a user", async () => {
      const mockResponse = [
        {
          experiment: {
            id: "exp-123",
            key: "test-experiment-1",
            name: "Test Experiment 1",
          },
          variant: {
            id: "var-123",
            key: "A",
            payload: { title: "Variant A" },
          },
        },
        {
          experiment: {
            id: "exp-456",
            key: "test-experiment-2",
            name: "Test Experiment 2",
          },
          variant: {
            id: "var-456",
            key: "B",
            payload: { title: "Variant B" },
          },
        },
      ];

      mockHttpClient.request.mockResolvedValueOnce(mockResponse);

      const result = await apiClient.getExperiments(mockUser);

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: "GET",
        url: "api/experiments",
        params: mockUser,
      });

      expect(result).toEqual(mockResponse);
    });
  });
});
