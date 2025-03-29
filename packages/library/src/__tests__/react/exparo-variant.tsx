import React from "react";
import { render, screen } from "@testing-library/react";
import {
  ExparoVariants,
  useExparoVariantsContext,
} from "@/react/exparo-variants";
import { useGetVariant } from "@/react/useGetVariant";
import { Experiment, Variant } from "@/types";

jest.mock("@/react/useGetVariant", () => ({
  useGetVariant: jest.fn(),
}));

describe("ExparoVariants", () => {
  const experimentKey = "test-experiment";

  const mockRunningExperiment: Experiment = {
    id: "exp-1",
    key: experimentKey,
    name: "Test Experiment",
    status: "running",
    type: "toggle",
  };

  const mockPausedExperiment: Experiment = {
    id: "exp-2",
    key: experimentKey,
    name: "Test Experiment",
    status: "completed",
    type: "toggle",
  };

  const mockVariantA: Variant<string> = {
    id: "var-1",
    key: "A",
    payload: "variant-a-payload",
  };

  const TestConsumer = () => {
    const context = useExparoVariantsContext();
    return <div data-testid="context-value">{JSON.stringify(context)}</div>;
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("should render children when experiment is running and not loading", () => {
    (useGetVariant as jest.Mock).mockReturnValue({
      variant: mockVariantA,
      experiment: mockRunningExperiment,
      payload: mockVariantA.payload,
      isLoading: false,
      isFetching: false,
      error: null,
      isA: true,
      isB: false,
      isControl: false,
      isEnabled: false,
      isDisabled: false,
      isRunning: true,
      refresh: jest.fn(),
    });

    render(
      <ExparoVariants experimentKey={experimentKey}>
        <div data-testid="children-content">Child content</div>
      </ExparoVariants>,
    );

    expect(screen.getByTestId("children-content")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  test("should render fallback when experiment is not running", () => {
    (useGetVariant as jest.Mock).mockReturnValue({
      variant: mockVariantA,
      experiment: mockPausedExperiment,
      payload: mockVariantA.payload,
      isLoading: false,
      isFetching: false,
      error: null,
      isA: true,
      isB: false,
      isControl: false,
      isEnabled: false,
      isDisabled: false,
      isRunning: false,
      refresh: jest.fn(),
    });

    render(
      <ExparoVariants experimentKey={experimentKey}>
        <div data-testid="children-content">Child content</div>
      </ExparoVariants>,
    );

    expect(screen.queryByTestId("children-content")).not.toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  test("should render loading component when isLoading is true and loading prop is provided", () => {
    (useGetVariant as jest.Mock).mockReturnValue({
      variant: mockVariantA,
      experiment: mockRunningExperiment,
      payload: mockVariantA.payload,
      isLoading: true,
      isFetching: true,
      error: null,
      isA: true,
      isB: false,
      isControl: false,
      isEnabled: false,
      isDisabled: false,
      isRunning: true,
      refresh: jest.fn(),
    });

    render(
      <ExparoVariants
        experimentKey={experimentKey}
        loading={<div data-testid="loading-indicator">Loading...</div>}
      >
        <div data-testid="children-content">Child content</div>
      </ExparoVariants>,
    );

    expect(screen.queryByTestId("children-content")).not.toBeInTheDocument();
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("should render children when isLoading is true but no loading prop is provided", () => {
    (useGetVariant as jest.Mock).mockReturnValue({
      variant: mockVariantA,
      experiment: mockRunningExperiment,
      payload: mockVariantA.payload,
      isLoading: true,
      isFetching: true,
      error: null,
      isA: true,
      isB: false,
      isControl: false,
      isEnabled: false,
      isDisabled: false,
      isRunning: true,
      refresh: jest.fn(),
    });

    render(
      <ExparoVariants experimentKey={experimentKey}>
        <div data-testid="children-content">Child content</div>
      </ExparoVariants>,
    );

    expect(screen.getByTestId("children-content")).toBeInTheDocument();
  });

  test("should render custom fallback when provided", () => {
    (useGetVariant as jest.Mock).mockReturnValue({
      variant: null,
      experiment: mockPausedExperiment,
      payload: undefined,
      isLoading: false,
      isFetching: false,
      error: null,
      isA: false,
      isB: false,
      isControl: false,
      isEnabled: false,
      isDisabled: false,
      isRunning: false,
      refresh: jest.fn(),
    });

    render(
      <ExparoVariants
        experimentKey={experimentKey}
        fallback={<div data-testid="custom-fallback">Custom fallback</div>}
      >
        <div data-testid="children-content">Child content</div>
      </ExparoVariants>,
    );

    expect(screen.queryByTestId("children-content")).not.toBeInTheDocument();
    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
  });

  test("should provide experiment data to context", () => {
    const mockExperimentData = {
      variant: mockVariantA,
      experiment: mockRunningExperiment,
      payload: mockVariantA.payload,
      isLoading: false,
      isFetching: false,
      error: null,
      isA: true,
      isB: false,
      isControl: false,
      isEnabled: false,
      isDisabled: false,
      isRunning: true,
      refresh: jest.fn(),
    };

    (useGetVariant as jest.Mock).mockReturnValue(mockExperimentData);

    render(
      <ExparoVariants experimentKey={experimentKey}>
        <TestConsumer />
      </ExparoVariants>,
    );

    const contextElement = screen.getByTestId("context-value");
    const contextValue = JSON.parse(contextElement.textContent || "{}");

    const { refresh, ...mockDataWithoutRefresh } = mockExperimentData;

    expect(contextValue).toMatchObject(mockDataWithoutRefresh);
  });

  test("should throw error when useExparoVariantsContext is used outside provider", () => {
    const consoleError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestConsumer />);
    }).toThrow(
      "useExparoVariantsContext must be used within a ExparoVariantsProvider",
    );

    console.error = consoleError;
  });

  test("should call useGetVariant with correct experiment key", () => {
    render(<ExparoVariants experimentKey={experimentKey}></ExparoVariants>);

    expect(useGetVariant).toHaveBeenCalledWith(experimentKey);
  });
});
