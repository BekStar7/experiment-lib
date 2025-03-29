import {
  createFileRoute,
  Navigate,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import {
  type AuthStatus,
  useAuth,
} from "@/features/layout/auth/auth-context.tsx";
import { SidebarProvider, SidebarTrigger } from "@/features/ui/sidebar.tsx";
import AppSidebar from "@/features/layout/sidebar/app-sidebar.tsx";
import * as React from "react";
import { authStateChangeEvent } from "@/lib/events.ts";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context }) => {
    if (context.auth.getStatus() === "unauthenticated") {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const auth = useAuth();

  const navigate = useNavigate();

  React.useEffect(() => {
    const handleAuthStateChange = (
      event: CustomEvent<{ status: AuthStatus }>,
    ) => {
      if (event.detail.status === "unauthenticated") {
        auth.logout();
        navigate({ to: "/login" });
      }
    };

    window.addEventListener(
      authStateChangeEvent.event,
      handleAuthStateChange as EventListener,
    );

    return () => {
      window.removeEventListener(
        authStateChangeEvent.event,
        handleAuthStateChange as EventListener,
      );
    };
  }, []);

  if (auth.getStatus() === "loading") {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        Авторизация...
      </div>
    );
  }

  if (auth.getStatus() === "unauthenticated") {
    return <Navigate to="/login" />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <section className="w-full">
        <SidebarTrigger />
        <div className="p-2">
          <Outlet />
        </div>
      </section>
    </SidebarProvider>
  );
}
