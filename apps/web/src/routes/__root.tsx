import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ExperimentClientProvider } from "@repo/exparo";
import { env } from "@/lib/env.ts";

export const Route = createRootRoute({
  component: () => (
    <ExperimentClientProvider
      apiKey={env().VITE_API_KEY}
      host={env().VITE_HOST}
    >
      <Link to="/">Home</Link>
      <Outlet />
      <TanStackRouterDevtools />
    </ExperimentClientProvider>
  ),
});
