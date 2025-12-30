import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Match the tab bar height from (tabs)/_layout.tsx
export const TAB_BAR_HEIGHT = 85;

interface TabBarSpacerProps {
  /** Additional padding beyond the tab bar height */
  extraPadding?: number;
}

/**
 * A spacer component that adds proper bottom padding for screens with tab bars.
 * Uses safe area insets to account for home indicators on newer iPhones.
 *
 * Use this instead of hardcoded `<View className="h-[100px]" />` spacers.
 */
export function TabBarSpacer({ extraPadding = 0 }: TabBarSpacerProps) {
  const insets = useSafeAreaInsets();

  // The tab bar is 85px tall, but on devices with home indicators,
  // we need less extra padding since the tab bar already accounts for some of it
  const height = TAB_BAR_HEIGHT + extraPadding;

  return <View style={{ height }} />;
}
