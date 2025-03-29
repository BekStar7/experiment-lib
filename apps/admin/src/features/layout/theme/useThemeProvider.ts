import * as React from "react";
import {
  getResolvedTheme,
  getTheme,
} from "@/features/layout/theme/theme.utils.ts";
import {
  resolvedThemeScheme,
  type ThemeType,
} from "@/features/layout/theme/theme.scheme.ts";
import { THEME_KEY } from "@/features/layout/theme/theme.const.ts";

export const useThemeProvider = () => {
  const { resolved, stored } = getTheme();
  const [currentTheme, setCurrentTheme] = React.useState(stored);
  const [resolvedTheme, setResolvedTheme] = React.useState(resolved);
  const setTheme = (theme: ThemeType) => {
    setCurrentTheme(theme);
    setResolvedTheme(resolvedThemeScheme.parse(getResolvedTheme(theme)));
    localStorage.setItem(THEME_KEY, theme);
  };

  React.useEffect(() => {
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)",
    );

    const changeTheme = (e: MediaQueryListEvent) => {
      if (stored !== "system") return;
      const theme = e.matches ? "dark" : "light";
      setCurrentTheme(theme);
      setResolvedTheme(resolvedThemeScheme.parse(getResolvedTheme(theme)));
    };

    darkModeMediaQuery.addEventListener("change", changeTheme);

    return () => {
      darkModeMediaQuery.removeEventListener("change", changeTheme);
    };
  }, []);

  React.useEffect(() => {
    if (resolvedTheme === "dark") {
      document.body.classList.remove("light");
      document.body.classList.add(resolvedTheme);
    } else {
      document.body.classList.remove("dark");
    }
  }, [resolvedTheme]);

  return { theme: currentTheme, resolvedTheme, setTheme };
};
