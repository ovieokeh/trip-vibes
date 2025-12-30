import React from "react";
import { View, StyleSheet, ViewStyle, TouchableOpacity, TouchableOpacityProps } from "react-native";
import { useTheme } from "../ThemeProvider";

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: "elevated" | "outlined" | "filled";
  padding?: "none" | "sm" | "md" | "lg";
  pressable?: boolean;
}

export function Card({
  children,
  variant = "elevated",
  padding = "md",
  pressable = false,
  style,
  ...props
}: CardProps) {
  const { colors, theme } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case "outlined":
        return {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.cardBorder,
        };
      case "filled":
        return {
          backgroundColor: colors.muted,
        };
      default: // elevated
        return {
          backgroundColor: colors.card,
          ...theme.shadows.md,
        };
    }
  };

  const getPaddingStyles = (): ViewStyle => {
    switch (padding) {
      case "none":
        return { padding: 0 };
      case "sm":
        return { padding: theme.spacing.sm };
      case "lg":
        return { padding: theme.spacing.xl };
      default:
        return { padding: theme.spacing.lg };
    }
  };

  const cardStyles = [styles.card, { borderRadius: theme.radius.xl }, getVariantStyles(), getPaddingStyles(), style];

  if (pressable) {
    return (
      <TouchableOpacity style={cardStyles} activeOpacity={0.7} {...props}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
}

// Sub-components for structured cards
interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardHeader({ children, style }: CardHeaderProps) {
  const { theme } = useTheme();
  return <View style={[{ marginBottom: theme.spacing.md }, style]}>{children}</View>;
}

export function CardContent({ children, style }: CardHeaderProps) {
  return <View style={style}>{children}</View>;
}

export function CardFooter({ children, style }: CardHeaderProps) {
  const { theme } = useTheme();
  return <View style={[{ marginTop: theme.spacing.md }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
});
