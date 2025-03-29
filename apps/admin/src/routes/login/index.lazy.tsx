import { createLazyFileRoute } from "@tanstack/react-router";
import LoginForm from "@/features/login-form.tsx";

export const Route = createLazyFileRoute("/login/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-dvh flex items-center justify-center w-full">
      <LoginForm />
    </div>
  );
}
