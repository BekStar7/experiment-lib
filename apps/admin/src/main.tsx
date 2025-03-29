import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/features/layout/auth/auth-context.tsx";
import ThemeProvider from "@/features/layout/theme/theme.tsx";
import { Toaster } from "@/features/ui/sonner.tsx";
import { ResponsiveTooltipProvider } from "@/features/ui/responsive-tooltip.tsx";

import "@/styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const router = createRouter({
  routeTree,
  context: { auth: undefined!, queryClient },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const InnerApp = () => {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
};

const rootElement = document.getElementById("app")!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ResponsiveTooltipProvider>
            <AuthProvider>
              <InnerApp />
              <Toaster />
            </AuthProvider>
          </ResponsiveTooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
