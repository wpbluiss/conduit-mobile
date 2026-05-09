import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useColorScheme } from "react-native";
import {
  makeTheme,
  type ColorScheme,
  type PraxisTheme,
} from "../constants/praxis-tokens";
import { useThemeStore } from "../store/themeStore";

const PraxisThemeContext = createContext<PraxisTheme>(makeTheme("dark"));

export function PraxisThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const systemScheme = useColorScheme();
  const { preference, initialize } = useThemeStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const scheme: ColorScheme = useMemo(() => {
    if (preference === "system") {
      return systemScheme === "light" ? "light" : "dark";
    }
    return preference;
  }, [preference, systemScheme]);

  const theme = useMemo(() => makeTheme(scheme), [scheme]);

  return (
    <PraxisThemeContext.Provider value={theme}>
      {children}
    </PraxisThemeContext.Provider>
  );
}

export function usePraxisTheme(): PraxisTheme {
  return useContext(PraxisThemeContext);
}
