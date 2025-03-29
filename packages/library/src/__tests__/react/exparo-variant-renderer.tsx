import React from "react";
import { render, screen } from "@testing-library/react";
import { ExparoVariantRenderer } from "@/react/exparo-variant-renderer";
import { useExparoVariantsContext } from "@/react/exparo-variants";
import { Variant } from "@/types";

jest.mock("@/react/exparo-variants", () => ({
  useExparoVariantsContext: jest.fn(),
}));

describe("ExparoVariantRenderer", () => {
  const mockVariantA: Variant<string> = {
    id: "var-1",
    key: "A",
    payload: "variant-a-payload",
  };

  const mockVariantB: Variant<string> = {
    id: "var-2",
    key: "B",
    payload: "variant-b-payload",
  };

  const mockObjectPayloadVariant: Variant<{ message: string }> = {
    id: "var-3",
    key: "complex",
    payload: { message: "Complex payload message" },
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("should render children when variant key matches", () => {
    (useExparoVariantsContext as jest.Mock).mockReturnValue({
      variant: mockVariantA,
      isRunning: true,
    });

    const { container } = render(
      <ExparoVariantRenderer variantKey="A">
        <div data-testid="variant-content">Variant A Content</div>
      </ExparoVariantRenderer>,
    );

    expect(container.textContent).toContain("Variant A Content");
  });

  test("should render nothing when variant key does not match", () => {
    (useExparoVariantsContext as jest.Mock).mockReturnValue({
      variant: mockVariantA,
      isRunning: true,
    });

    const { container } = render(
      <ExparoVariantRenderer variantKey="B">
        <div data-testid="variant-content">Variant B Content</div>
      </ExparoVariantRenderer>,
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId("variant-content")).not.toBeInTheDocument();
  });

  test("should render nothing when variant is null", () => {
    (useExparoVariantsContext as jest.Mock).mockReturnValue({
      variant: null,
      isRunning: true,
    });

    const { container } = render(
      <ExparoVariantRenderer variantKey="A">
        <div data-testid="variant-content">Variant A Content</div>
      </ExparoVariantRenderer>,
    );

    expect(container.firstChild).toBeNull();
  });

  test("should call children as function with payload when function is provided", () => {
    (useExparoVariantsContext as jest.Mock).mockReturnValue({
      variant: mockVariantA,
      isRunning: true,
    });

    const childrenFn = jest
      .fn()
      .mockReturnValue(
        <div data-testid="function-content">Function Content</div>,
      );

    render(
      <ExparoVariantRenderer variantKey="A">
        {childrenFn}
      </ExparoVariantRenderer>,
    );

    expect(childrenFn).toHaveBeenCalledWith(mockVariantA.payload);
    expect(screen.getByTestId("function-content")).toBeInTheDocument();
  });

  test("should handle complex payload objects in children function", () => {
    (useExparoVariantsContext as jest.Mock).mockReturnValue({
      variant: mockObjectPayloadVariant,
      isRunning: true,
    });

    render(
      <ExparoVariantRenderer variantKey="complex">
        {(payload?: { message: string }) => (
          <div data-testid="complex-content">{payload?.message}</div>
        )}
      </ExparoVariantRenderer>,
    );

    expect(screen.getByTestId("complex-content")).toBeInTheDocument();
    expect(screen.getByText("Complex payload message")).toBeInTheDocument();
  });

  test("should handle undefined payload in children function", () => {
    const undefinedPayloadVariant: Variant<undefined> = {
      id: "var-4",
      key: "empty",
      payload: undefined,
    };

    (useExparoVariantsContext as jest.Mock).mockReturnValue({
      variant: undefinedPayloadVariant,
      isRunning: true,
    });

    const childrenFn = jest
      .fn()
      .mockReturnValue(
        <div data-testid="undefined-content">
          Default content for undefined
        </div>,
      );

    render(
      <ExparoVariantRenderer variantKey="empty">
        {childrenFn}
      </ExparoVariantRenderer>,
    );

    expect(childrenFn).toHaveBeenCalledWith(undefined);
    expect(screen.getByTestId("undefined-content")).toBeInTheDocument();
  });

  test("should work with different variant keys", () => {
    const variants = [
      { variant: mockVariantA, key: "A" },
      { variant: mockVariantB, key: "B" },
    ];

    variants.forEach(({ variant, key }) => {
      (useExparoVariantsContext as jest.Mock).mockReturnValue({
        variant,
        isRunning: true,
      });

      jest.clearAllMocks();

      const { container, unmount } = render(
        <ExparoVariantRenderer variantKey={key}>
          <div>Variant {key} Content</div>
        </ExparoVariantRenderer>,
      );

      expect(container.textContent).toContain(`Variant ${key} Content`);

      unmount();
    });
  });
});
