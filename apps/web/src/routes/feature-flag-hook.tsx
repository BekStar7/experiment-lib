import { createFileRoute } from "@tanstack/react-router";
import { useFeatureFlag } from "@repo/exparo";
import { env } from "@/lib/env.ts";

export const Route = createFileRoute("/feature-flag-hook")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isEnabled, isLoading, error, payload } = useFeatureFlag<{
    message: string;
  }>(env().VITE_FEATURE_FLAG_KEY);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      {isEnabled ? "Active" : "Not active"}
      {payload && <div>{payload.message}</div>}
    </div>
  );
}
