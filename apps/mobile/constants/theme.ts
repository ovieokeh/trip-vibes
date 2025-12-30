/**
 * Comprehensive theme configuration for the mobile app
 * Provides typography, spacing, radius, shadows, and color tokens
 */

export const typography = {
  fontFamily: {
    regular: "System",
    medium: "System",
    semibold: "System",
    bold: "System",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 48,
  },
  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    extrabold: "800" as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
} as const;

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  full: 9999,
} as const;

export const shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Gradient presets for premium UI elements
export const gradients = {
  primary: ["#6366f1", "#8b5cf6"] as const, // Indigo to violet
  secondary: ["#f472b6", "#ec4899"] as const, // Pink shades
  accent: ["#22d3ee", "#06b6d4"] as const, // Cyan shades
  sunset: ["#f97316", "#ef4444"] as const, // Orange to red
  ocean: ["#0ea5e9", "#6366f1"] as const, // Sky to indigo
  forest: ["#22c55e", "#10b981"] as const, // Green shades
  dark: ["#1f2937", "#111827"] as const, // Dark gray shades
  card: ["rgba(255,255,255,0.9)", "rgba(255,255,255,0.7)"] as const,
  cardDark: ["rgba(38,38,38,0.9)", "rgba(38,38,38,0.7)"] as const,
} as const;

// Animation durations
export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: {
    damping: 15,
    stiffness: 150,
  },
} as const;

// Complete theme object
export const theme = {
  typography,
  spacing,
  radius,
  shadows,
  gradients,
  animation,
} as const;

export type Theme = typeof theme;
