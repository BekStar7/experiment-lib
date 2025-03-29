import { renderHook, act } from "@testing-library/react";
import { useGetVariant } from "@/react/useGetVariant"; // Update path as needed
import { useExperimentClient } from "@/react/experiment-context";
import { useQuery } from "@/react/useQuery";
import { Experiment, Variant } from "@/types";
import { ExperimentCallback } from "@/types/http";

jest.mock("@/react/experiment-context", () => ({
  useExperimentClient: jest.fn(),
}));

jest.mock("@/react/useQuery", () => ({
  useQuery: jest.fn(),
}));

describe("useGetVariant", () => {
  let mockExperimentClient: {
    storageManager: {
      getVariant: jest.Mock;
      setVariant: jest.Mock;
    };
    fetchVariant: jest.Mock;
    subscribeToExperiment: jest.Mock;
    configs: {
      backgroundUpdate: boolean;
    };
  };

  let mockQueryResult: {
    isLoading: boolean;
    error: Error | null;
    refetch: jest.Mock;
  };

  let mockQueryFetcher: jest.Mock;
  let mockQueryOptions: any;
  let mockUnsubscribe: jest.Mock;
  let experimentCallback: ExperimentCallback;

  const experimentKey = "test-experiment";

  const mockVariantA: Variant<string> = {
    id: "var-123",
    key: "A",
    payload: "variant-a-payload",
  };

  const mockVariantB: Variant<string> = {
    id: "var-456",
    key: "B",
    payload: "variant-b-payload",
  };

  const mockControlVariant: Variant<string> = {
    id: "var-789",
    key: "control",
    payload: "control-payload",
  };

  const mockEnabledVariant: Variant<string> = {
    id: "var-101112",
    key: "enabled",
    payload: "enabled-payload",
  };

  const mockDisabledVariant: Variant<string> = {
    id: "var-131415",
    key: "disabled",
    payload: "disabled-payload",
  };

  const mockExperiment: Experiment = {
    id: "exp-123",
    key: experimentKey,
    name: "Test Experiment",
    status: "running",
    type: "toggle",
  };

  beforeEach(() => {
    jest.resetAllMocks();

    mockQueryResult = {
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    };

    mockQueryFetcher = jest.fn();

    (useQuery as jest.Mock).mockImplementation((fetcher, deps, options) => {
      mockQueryFetcher = fetcher;
      mockQueryOptions = options;
      return mockQueryResult;
    });

    mockUnsubscribe = jest.fn();
    mockExperimentClient = {
      storageManager: {
        getVariant: jest.fn(),
        setVariant: jest.fn(),
      },
      fetchVariant: jest.fn(),
      subscribeToExperiment: jest.fn().mockImplementation((key, callback) => {
        experimentCallback = callback;
        return mockUnsubscribe;
      }),
      configs: {
        backgroundUpdate: true,
      },
    };
    (useExperimentClient as jest.Mock).mockReturnValue(mockExperimentClient);
  });

  test("should initialize with stored variant when available", () => {
    mockExperimentClient.storageManager.getVariant.mockReturnValue(
      mockVariantA,
    );

    const { result } = renderHook(() => useGetVariant(experimentKey));

    expect(result.current.variant).toEqual(mockVariantA);
    expect(result.current.isA).toBe(true);
    expect(result.current.isB).toBe(false);
    expect(result.current.payload).toBe("variant-a-payload");
    expect(result.current.isLoading).toBe(false);
  });

  test("should initialize with default variant when provided and no stored variant", () => {
    mockExperimentClient.storageManager.getVariant.mockReturnValue(null);

    const { result } = renderHook(() =>
      useGetVariant(experimentKey, { defaultVariant: mockVariantB }),
    );

    expect(result.current.variant).toEqual(mockVariantB);
    expect(result.current.isA).toBe(false);
    expect(result.current.isB).toBe(true);
    expect(result.current.payload).toBe("variant-b-payload");
  });

  test("should fetch variant when no stored variant exists", async () => {
    mockExperimentClient.storageManager.getVariant.mockReturnValue(null);
    mockQueryResult.isLoading = true;

    const { result } = renderHook(() => useGetVariant(experimentKey));

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      mockQueryOptions.onSuccess(mockVariantA);
    });

    expect(mockExperimentClient.storageManager.setVariant).toHaveBeenCalledWith(
      experimentKey,
      mockVariantA,
    );
    expect(result.current.variant).toEqual(mockVariantA);
  });

  test("should not fetch variant when backgroundUpdate is true and variant exists", async () => {
    mockExperimentClient.storageManager.getVariant.mockReturnValue(
      mockVariantA,
    );
    mockExperimentClient.configs.backgroundUpdate = true;

    renderHook(() => useGetVariant(experimentKey));

    let fetchResult;
    await act(async () => {
      fetchResult = await mockQueryFetcher();
    });

    expect(fetchResult).toEqual(mockVariantA);
    expect(mockExperimentClient.fetchVariant).not.toHaveBeenCalled();
  });

  test("should fetch variant when refetchOnMount is true regardless of stored variant", async () => {
    mockExperimentClient.storageManager.getVariant.mockReturnValue(
      mockVariantA,
    );
    mockExperimentClient.fetchVariant.mockResolvedValue(mockVariantB);

    renderHook(() => useGetVariant(experimentKey, { refetchOnMount: true }));

    await act(async () => {
      await mockQueryFetcher();
    });

    expect(mockExperimentClient.fetchVariant).toHaveBeenCalledWith(
      experimentKey,
    );
  });

  test("should subscribe to experiment updates and handle callbacks", async () => {
    mockExperimentClient.storageManager.getVariant.mockReturnValue(
      mockVariantA,
    );

    const { result } = renderHook(() => useGetVariant(experimentKey));

    expect(mockExperimentClient.subscribeToExperiment).toHaveBeenCalledWith(
      experimentKey,
      expect.any(Function),
    );

    const updatedVariant = { ...mockVariantA, payload: "updated-payload" };
    await act(async () => {
      experimentCallback(mockExperiment, updatedVariant, "experiment_updated");
    });

    expect(result.current.experiment).toEqual(mockExperiment);
    expect(result.current.variant?.payload).toBe("updated-payload");
    expect(result.current.isRunning).toBe(true);

    await act(async () => {
      experimentCallback(mockExperiment, mockVariantB, "distribution_updated");
    });

    expect(result.current.isA).toBe(false);
    expect(result.current.isB).toBe(true);
  });

  test("should handle experiment_updated with different variant", async () => {
    mockExperimentClient.storageManager.getVariant.mockReturnValue(
      mockVariantA,
    );

    const { result } = renderHook(() => useGetVariant(experimentKey));

    await act(async () => {
      experimentCallback(mockExperiment, mockVariantB, "experiment_updated");
    });

    expect(result.current.variant?.key).toBe("A");
    expect(result.current.isA).toBe(true);
    expect(result.current.isB).toBe(false);
  });

  test("should clean up subscription on unmount", () => {
    const { unmount } = renderHook(() => useGetVariant(experimentKey));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  test("should handle special variant flags correctly", () => {
    const variantTestCases: {
      variant: Variant<string>;
      flag: "isControl" | "isEnabled" | "isDisabled";
    }[] = [
      { variant: mockControlVariant, flag: "isControl" },
      { variant: mockEnabledVariant, flag: "isEnabled" },
      { variant: mockDisabledVariant, flag: "isDisabled" },
    ];

    variantTestCases.forEach(({ variant, flag }) => {
      mockExperimentClient.storageManager.getVariant.mockReturnValue(variant);

      const { result } = renderHook(() => useGetVariant(experimentKey));

      expect(result.current[flag]).toBe(true);
    });
  });

  test("should handle experiment status for isRunning flag", async () => {
    mockExperimentClient.storageManager.getVariant.mockReturnValue(
      mockVariantA,
    );

    const { result } = renderHook(() => useGetVariant(experimentKey));

    expect(result.current.isRunning).toBe(false);

    await act(async () => {
      experimentCallback(mockExperiment, mockVariantA, "experiment_updated");
    });

    expect(result.current.isRunning).toBe(true);

    await act(async () => {
      experimentCallback(
        { ...mockExperiment, status: "completed" },
        mockVariantA,
        "experiment_updated",
      );
    });

    expect(result.current.isRunning).toBe(false);
  });

  test("should handle errors from fetch variant", async () => {
    mockExperimentClient.storageManager.getVariant.mockReturnValue(null);

    const error = new Error("Failed to fetch variant");
    mockQueryResult.error = error;
    mockQueryResult.isLoading = false;

    const { result } = renderHook(() => useGetVariant(experimentKey));

    expect(result.current.error).toBe(error);
  });

  test("should expose refresh function from useQuery", () => {
    const { result } = renderHook(() => useGetVariant(experimentKey));

    act(() => {
      result.current.refresh();
    });

    expect(mockQueryResult.refetch).toHaveBeenCalled();
  });
});
