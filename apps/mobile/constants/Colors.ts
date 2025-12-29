/**
 * Color constants for the mobile app
 * Matched to web globals.css theming
 */
export const Colors = {
  light: {
    background: "#ffffff",
    foreground: "#171717",
    primary: "#6366f1", // Indigo-500 (DaisyUI pastel theme base)
    primaryForeground: "#ffffff",
    secondary: "#f472b6", // Pink-400
    secondaryForeground: "#171717",
    accent: "#22d3ee", // Cyan-400
    accentForeground: "#171717",
    muted: "#f5f5f5",
    mutedForeground: "#737373",
    border: "#e5e5e5",
    error: "#ef4444", // Red-500
    success: "#22c55e", // Green-500
    warning: "#f59e0b", // Amber-500
  },
  dark: {
    background: "#0a0a0a",
    foreground: "#ededed",
    primary: "#818cf8", // Indigo-400
    primaryForeground: "#0a0a0a",
    secondary: "#f472b6",
    secondaryForeground: "#0a0a0a",
    accent: "#22d3ee",
    accentForeground: "#0a0a0a",
    muted: "#262626",
    mutedForeground: "#a3a3a3",
    border: "#404040",
    error: "#f87171",
    success: "#4ade80",
    warning: "#fbbf24",
  },
};

export type ColorScheme = keyof typeof Colors;
