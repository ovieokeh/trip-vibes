import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "../ThemeProvider";

type BadgeVariant = "primary" | "secondary" | "success" | "warning" | "error" | "muted";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  children?: React.ReactNode;
  label?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  children,
  label,
  variant = "primary",
  size = "md",
  dot = false,
  pulse = false,
  style,
  textStyle,
}: BadgeProps) {
  const { colors, theme } = useTheme();

  const getVariantStyles = (): { bg: string; text: string } => {
    switch (variant) {
      case "secondary":
        return { bg: colors.secondary, text: colors.secondaryForeground };
      case "success":
        return { bg: colors.success, text: colors.successForeground };
      case "warning":
        return { bg: colors.warning, text: colors.warningForeground };
      case "error":
        return { bg: colors.error, text: colors.errorForeground };
      case "muted":
        return { bg: colors.muted, text: colors.mutedForeground };
      default:
        return { bg: colors.primary, text: colors.primaryForeground };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle; dot: number } => {
    switch (size) {
      case "sm":
        return {
          container: { paddingHorizontal: 6, paddingVertical: 2 },
          text: { fontSize: 10 },
          dot: 6,
        };
      case "lg":
        return {
          container: { paddingHorizontal: 12, paddingVertical: 6 },
          text: { fontSize: 14 },
          dot: 10,
        };
      default:
        return {
          container: { paddingHorizontal: 8, paddingVertical: 4 },
          text: { fontSize: 12 },
          dot: 8,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  // Dot-only badge
  if (dot) {
    return (
      <View
        style={[
          styles.dot,
          {
            backgroundColor: variantStyles.bg,
            width: sizeStyles.dot,
            height: sizeStyles.dot,
            borderRadius: sizeStyles.dot / 2,
          },
          pulse && styles.pulse,
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyles.bg,
          borderRadius: theme.radius.full,
        },
        sizeStyles.container,
        style,
      ]}
    >
      {children || (
        <Text style={[styles.text, { color: variantStyles.text }, sizeStyles.text, textStyle]}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "600",
  },
  dot: {
    alignSelf: "flex-start",
  },
  pulse: {
    // Note: Actual pulse animation would need Animated API
    opacity: 0.9,
  },
});
