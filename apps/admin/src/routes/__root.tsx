import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import type { AuthContext } from "@/features/layout/auth/auth-context.tsx";
import RouterDevtools from "@/features/layout/router-dev-tools.tsx";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

type RouterContext = {
  auth: AuthContext;
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <main className="max-w-screen-xl mx-auto">
      <Outlet />
      <RouterDevtools />
      <ReactQueryDevtools />
    </main>
  ),
});
