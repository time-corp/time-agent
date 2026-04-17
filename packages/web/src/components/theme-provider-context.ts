import * as React from "react";

export type Theme = "dark" | "light" | "system";

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = React.createContext<ThemeProviderState>({
  theme: "system",
  setTheme: () => undefined,
});

export function useTheme() {
  return React.useContext(ThemeProviderContext);
}

export { ThemeProviderContext };
