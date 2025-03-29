import { createFileRoute } from "@tanstack/react-router";
import { ExparoFeatureFlag } from "@repo/exparo";
import { env } from "@/lib/env.ts";

export const Route = createFileRoute("/feature-flag-component")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <ExparoFeatureFlag
        experimentKey={env().VITE_FEATURE_FLAG_KEY}
        fallback="not active"
      >
        active
      </ExparoFeatureFlag>
    </div>
  );
}
