import type { AuthStatus } from "@/features/layout/auth/auth-context.tsx";

export type AuthStateChangeEvent = {
  status: AuthStatus;
};

export const authStateChangeEvent = {
  event: "authStateChange",
  dispatch: (status: AuthStatus) =>
    new CustomEvent<AuthStateChangeEvent>("authStateChange", {
      detail: { status },
    }),
};
