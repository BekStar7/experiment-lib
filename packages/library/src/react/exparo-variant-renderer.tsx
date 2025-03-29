import React from "react";
import { Variant } from "@/types";
import { useExparoVariantsContext } from "@/react/exparo-variants";

type ExparoVariantRendererProps<T> = {
  fallback?: React.ReactNode;
  children: React.ReactNode | ((payload?: T) => React.ReactNode);
  variantKey: Variant["key"];
};

// Explicitly casting to React.ReactElement because there was an error:
// 'ExparoVariantRenderer' cannot be used as a JSX component.
// Its return type 'Element | null' is not a valid JSX element.

export function ExparoVariantRenderer<T>(
  props: ExparoVariantRendererProps<T>,
): React.ReactElement | null {
  const experiment = useExparoVariantsContext<T>();
  const variant = experiment.variant;

  if (!variant) {
    return null;
  }

  if (variant.key !== props.variantKey) {
    return null;
  }

  if (typeof props.children === "function") {
    return <>{props.children(variant.payload)}</>;
  }

  return <>{props.children}</>;
}
