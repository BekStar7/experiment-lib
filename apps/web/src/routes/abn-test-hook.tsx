import { createFileRoute } from "@tanstack/react-router";
import { useGetVariant } from "@repo/exparo";
import { env } from "@/lib/env.ts";

export const Route = createFileRoute("/abn-test-hook")({
  component: RouteComponent,
});

function RouteComponent() {
  const { variant, isLoading, error, payload } = useGetVariant<{
    message: string;
  }>(env().VITE_ABN_TEST_KEY);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      Variant: {variant?.key}
      {payload && <div>{payload?.message ?? "No payload message"}</div>}
    </div>
  );
}
