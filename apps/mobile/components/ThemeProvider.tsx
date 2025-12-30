import React, { createContext, useContext, ReactNode } from "react";
import { useColorScheme } from "react-native";
import { Colors, ColorScheme, ThemeColors } from "../constants/Colors";
import { theme, Theme } from "../constants/theme";

interface ThemeContextValue {
  colors: ThemeColors;
  colorScheme: ColorScheme;
  isDark: boolean;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  forcedColorScheme?: ColorScheme;
}

export function ThemeProvider({ children, forcedColorScheme }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();

  // Use forced scheme if provided, otherwise use system, defaulting to light
  const colorScheme: ColorScheme = forcedColorScheme || (systemColorScheme === "dark" ? "dark" : "light");
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const value: ThemeContextValue = {
    colors,
    colorScheme,
    isDark,
    theme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Convenience hooks
export function useColors(): ThemeColors {
  return useTheme().colors;
}

export function useIsDark(): boolean {
  return useTheme().isDark;
}
