import * as React from "react";
import { type ThemeContextType } from "@/features/layout/theme/theme.scheme.ts";
import { ThemeContextNotProvidedError } from "@/features/layout/theme/theme.error.ts";

export const ThemeContext = React.createContext<ThemeContextType | undefined>({
  resolvedTheme: "light",
  theme: "system",
  setTheme: () => {},
});

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw ThemeContextNotProvidedError;
  }

  return context;
};
