import * as React from "react";
import { useThemeProvider } from "@/features/layout/theme/useThemeProvider.ts";
import { ThemeContext } from "@/features/layout/theme/theme.context.ts";

type ThemeProviderProps = React.PropsWithChildren;

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const providerValues = useThemeProvider();

  return (
    <ThemeContext.Provider value={providerValues}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
