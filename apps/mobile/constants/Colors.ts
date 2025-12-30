/**
 * Color constants for the mobile app
 * Matched to web globals.css theming
 */
export const Colors = {
  light: {
    // Core
    background: "#ffffff",
    foreground: "#171717",

    // Brand
    primary: "#6366f1", // Indigo-500
    primaryForeground: "#ffffff",
    secondary: "#f472b6", // Pink-400
    secondaryForeground: "#171717",
    accent: "#22d3ee", // Cyan-400
    accentForeground: "#171717",

    // Card
    card: "#ffffff",
    cardForeground: "#171717",
    cardBorder: "#f0f0f0",

    // Muted
    muted: "#f5f5f5",
    mutedForeground: "#737373",

    // Borders & Dividers
    border: "#e5e5e5",
    divider: "#f0f0f0",

    // Status
    error: "#ef4444",
    errorForeground: "#ffffff",
    success: "#22c55e",
    successForeground: "#ffffff",
    warning: "#f59e0b",
    warningForeground: "#171717",

    // Destructive
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",

    // Tab Bar
    tabBar: "rgba(255,255,255,0.95)",
    tabBarBorder: "rgba(0,0,0,0.05)",
    tabBarActive: "#6366f1",
    tabBarInactive: "#9ca3af",

    // Overlay
    overlay: "rgba(0,0,0,0.5)",

    // Input
    input: "#f9fafb",
    inputBorder: "#e5e7eb",
    inputFocus: "#6366f1",
  },
  dark: {
    // Core
    background: "#0a0a0a",
    foreground: "#ededed",

    // Brand
    primary: "#818cf8", // Indigo-400
    primaryForeground: "#0a0a0a",
    secondary: "#f472b6",
    secondaryForeground: "#0a0a0a",
    accent: "#22d3ee",
    accentForeground: "#0a0a0a",

    // Card
    card: "#1a1a1a",
    cardForeground: "#ededed",
    cardBorder: "#2a2a2a",

    // Muted
    muted: "#262626",
    mutedForeground: "#a3a3a3",

    // Borders & Dividers
    border: "#404040",
    divider: "#2a2a2a",

    // Status
    error: "#f87171",
    errorForeground: "#0a0a0a",
    success: "#4ade80",
    successForeground: "#0a0a0a",
    warning: "#fbbf24",
    warningForeground: "#0a0a0a",

    // Destructive
    destructive: "#f87171",
    destructiveForeground: "#0a0a0a",

    // Tab Bar
    tabBar: "rgba(10,10,10,0.95)",
    tabBarBorder: "rgba(255,255,255,0.1)",
    tabBarActive: "#818cf8",
    tabBarInactive: "#6b7280",

    // Overlay
    overlay: "rgba(0,0,0,0.7)",

    // Input
    input: "#1f1f1f",
    inputBorder: "#404040",
    inputFocus: "#818cf8",
  },
};

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light;
