import * as React from "react";
import { getTokens, removeTokens } from "@/lib/token.ts";
import { authStateChangeEvent } from "@/lib/events.ts";

type AuthContext = {
  logout: () => Promise<void>;
  getStatus: () => "authenticated" | "unauthenticated" | "loading";
};

const AuthContext = React.createContext<AuthContext | undefined>(undefined);

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

function getStatus() {
  if (!getTokens().accessToken && !getTokens().refreshToken) {
    return "unauthenticated";
  }

  return "authenticated";
}

type AuthProviderProps = React.PropsWithChildren;

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const logout = React.useCallback(async () => {
    removeTokens();
    window.dispatchEvent(authStateChangeEvent.dispatch("unauthenticated"));
  }, []);

  return (
    <AuthContext.Provider value={{ logout, getStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

type AuthStatus = ReturnType<typeof getStatus>;

export { AuthProvider, useAuth, AuthContext, type AuthStatus };
