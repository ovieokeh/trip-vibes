import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "../ThemeProvider";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  large?: boolean;
  transparent?: boolean;
  blur?: boolean;
  style?: ViewStyle;
}

export function Header({
  title,
  subtitle,
  leftAction,
  rightAction,
  large = false,
  transparent = false,
  blur = false,
  style,
}: HeaderProps) {
  const { colors, theme, isDark } = useTheme();

  const content = (
    <View style={[styles.container, style]}>
      <View style={styles.leftSection}>{leftAction}</View>

      <View style={styles.centerSection}>
        {title && (
          <Text style={[large ? styles.largeTitle : styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightSection}>{rightAction}</View>
    </View>
  );

  if (blur) {
    return (
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={[styles.blurContainer, { borderBottomColor: colors.border }]}
      >
        {content}
      </BlurView>
    );
  }

  return (
    <View
      style={[
        styles.solidContainer,
        {
          backgroundColor: transparent ? "transparent" : colors.background,
          borderBottomColor: transparent ? "transparent" : colors.border,
        },
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  solidContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  centerSection: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rightSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  largeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    textAlign: "center",
  },
});
