/**
 * Motion design constants for consistent animations throughout the app
 * Uses react-native-reanimated spring and timing configurations
 */

import { Easing } from "react-native-reanimated";

// Spring presets for different interaction types
export const springs = {
  /** Gentle spring for subtle feedback (e.g., button press) */
  gentle: { damping: 20, stiffness: 120, mass: 1 },
  /** Snappy spring for quick interactions (e.g., toggles, chips) */
  snappy: { damping: 15, stiffness: 200, mass: 0.8 },
  /** Bouncy spring for playful elements (e.g., notifications, badges) */
  bouncy: { damping: 10, stiffness: 150, mass: 1 },
  /** Stiff spring for precise movements (e.g., modals, sheets) */
  stiff: { damping: 25, stiffness: 300, mass: 1 },
} as const;

// Duration scale in milliseconds
export const durations = {
  instant: 100,
  fast: 150,
  normal: 250,
  slow: 400,
  emphasize: 600,
} as const;

// Easing curves for timing-based animations
export const easings = {
  /** Standard easing for most transitions */
  standard: Easing.bezier(0.4, 0, 0.2, 1),
  /** Ease out for elements entering the screen */
  enter: Easing.bezier(0, 0, 0.2, 1),
  /** Ease in for elements exiting the screen */
  exit: Easing.bezier(0.4, 0, 1, 1),
  /** Emphasized curve for important moments */
  emphasized: Easing.bezier(0.2, 0, 0, 1),
} as const;

// Interaction scale values
export const scales = {
  /** Pressed state scale for buttons */
  pressed: 0.96,
  /** Focused/hover state scale */
  focused: 1.02,
  /** Active selection scale */
  active: 1.05,
} as const;

// Icon sizes for consistency
export const iconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  "2xl": 32,
} as const;

// Complete motion object
export const motion = {
  springs,
  durations,
  easings,
  scales,
  iconSizes,
} as const;

export type Motion = typeof motion;
