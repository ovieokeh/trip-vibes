import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle, TouchableOpacityProps } from "react-native";
import { useTheme } from "../ThemeProvider";

type IconButtonVariant = "default" | "primary" | "ghost" | "outline";
type IconButtonSize = "sm" | "md" | "lg";

interface IconButtonProps extends TouchableOpacityProps {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  rounded?: boolean;
}

export function IconButton({
  icon,
  variant = "default",
  size = "md",
  rounded = true,
  disabled,
  style,
  ...props
}: IconButtonProps) {
  const { colors, theme } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: colors.primary,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return {
          backgroundColor: colors.muted,
        };
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case "sm":
        return { width: 32, height: 32 };
      case "lg":
        return { width: 48, height: 48 };
      default:
        return { width: 40, height: 40 };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyles(),
        getSizeStyles(),
        { borderRadius: rounded ? theme.radius.full : theme.radius.md },
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
});
