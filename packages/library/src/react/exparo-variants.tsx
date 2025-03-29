import React from "react";
import { Experiment } from "@/types";
import { UseGetVariantReturnType } from "@/types/react";
import { useGetVariant } from "@/react/useGetVariant";

type ExparoVariantsContextType<T> = UseGetVariantReturnType<T>;

const ExparoVariantsContext = React.createContext<
  ExparoVariantsContextType<any> | undefined
>(undefined);

type ExparoVariantsProps = React.PropsWithChildren<{
  experimentKey: Experiment["key"];
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}>;

function ExparoVariants<T>({
  experimentKey,
  fallback = <div>Something went wrong</div>,
  loading = null,
  children,
}: ExparoVariantsProps) {
  const value = useGetVariant<T>(experimentKey);
  const memoizedValue = React.useMemo(() => value, [value]);

  return (
    <ExparoVariantsContext.Provider value={memoizedValue}>
      <ExparoVariantInner
        value={memoizedValue}
        fallback={fallback}
        loading={loading}
      >
        {children}
      </ExparoVariantInner>
    </ExparoVariantsContext.Provider>
  );
}

type ExparoVariantInnerProps<T> = React.PropsWithChildren<{
  fallback: React.ReactNode;
  loading: React.ReactNode;
  value: UseGetVariantReturnType<T>;
}>;

function ExparoVariantInner<T>({
  value,
  fallback,
  loading,
  children,
}: ExparoVariantInnerProps<T>): React.ReactElement | null {
  // Checking for JSX because there was an error:
  // 'ExparoVariantInner' cannot be used as a JSX component.
  // Its return type 'Element | null' is not a valid JSX element.
  // Type 'undefined' is not assignable to type 'Element | null'

  if (!value || !value.variant || !value.isRunning) {
    return React.isValidElement(fallback) ? fallback : <>{fallback}</>;
  }

  if (value.isLoading && loading) {
    return React.isValidElement(loading) ? loading : <>{loading}</>;
  }

  return <>{children}</>;
}

function useExparoVariantsContext<T>() {
  const context = React.useContext(
    ExparoVariantsContext as React.Context<
      ExparoVariantsContextType<T> | undefined
    >,
  );
  if (!context) {
    throw new Error(
      "useExparoVariantsContext must be used within a ExparoVariantsProvider",
    );
  }
  return context;
}

export { ExparoVariants, useExparoVariantsContext };
