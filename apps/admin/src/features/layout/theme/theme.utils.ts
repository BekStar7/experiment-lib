import {
  resolvedThemeScheme,
  type ResolvedThemeType,
  themeScheme,
  type ThemeType,
} from "@/features/layout/theme/theme.scheme.ts";
import { THEME_KEY } from "@/features/layout/theme/theme.const.ts";

type getThemeType = () => {
  stored: ThemeType;
  resolved: ResolvedThemeType;
};

export const getResolvedTheme = (theme: ThemeType) => {
  if (!theme || theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  return theme;
};

export const getTheme: getThemeType = () => {
  const theme = getThemeFromLocalStorage();
  if (!theme || theme === "system") {
    return {
      stored: "system",
      resolved: getResolvedTheme("system"),
    };
  }

  return {
    stored: theme,
    resolved: resolvedThemeScheme.parse(theme),
  };
};

const getThemeFromLocalStorage = () => {
  const _theme = localStorage.getItem(THEME_KEY);
  try {
    return themeScheme.parse(_theme);
  } catch {
    return undefined;
  }
};
