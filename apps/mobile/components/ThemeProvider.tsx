import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { Colors, ColorScheme, ThemeColors } from "../constants/Colors";
import { theme, Theme } from "../constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

type NativeWindColorScheme = "light" | "dark" | "system";

interface ThemeContextValue {
  colors: ThemeColors;
  colorScheme: NativeWindColorScheme;
  setColorScheme: (scheme: NativeWindColorScheme) => void;
  isDark: boolean;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { colorScheme, setColorScheme: setNativeWindScheme } = useNativeWindColorScheme();
  const systemColorScheme = useSystemColorScheme();
  const [themePreference, setThemePreference] = React.useState<NativeWindColorScheme>("system");

  // Load saved theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme-preference");
        if (savedTheme && (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system")) {
          setThemePreference(savedTheme as NativeWindColorScheme);
          setNativeWindScheme(savedTheme as any);
        }
      } catch (e) {
        console.error("Failed to load theme preference", e);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference when it changes
  const setColorScheme = (scheme: NativeWindColorScheme) => {
    setThemePreference(scheme);
    setNativeWindScheme(scheme as any);
    AsyncStorage.setItem("theme-preference", scheme).catch((e) => console.error("Failed to save theme preference", e));
  };

  // Resolved effective scheme for colors
  // If preference is system, fall back effectively to system.
  // NativeWind handles this logic mostly, but we want to be explicit for our boolean flags.
  const effectiveScheme =
    themePreference === "system" ? (systemColorScheme === "dark" ? "dark" : "light") : themePreference;

  const activeColors = effectiveScheme === "dark" ? Colors.dark : Colors.light;
  const isDark = effectiveScheme === "dark";

  const value: ThemeContextValue = {
    colors: activeColors,
    colorScheme: themePreference,
    setColorScheme,
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
