import React from "react";
import { View, Text, ViewStyle, TextStyle } from "react-native";
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
  className?: string;
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
  className = "",
  style,
  textStyle,
}: BadgeProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "secondary":
        return { container: "bg-secondary", text: "text-secondary-foreground" };
      case "success":
        return { container: "bg-success", text: "text-success-foreground" };
      case "warning":
        return { container: "bg-warning", text: "text-warning-foreground" };
      case "error":
        return { container: "bg-error", text: "text-error-foreground" };
      case "muted":
        return { container: "bg-muted", text: "text-muted-foreground" };
      default:
        return { container: "bg-primary", text: "text-primary-foreground" };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return { container: "px-1.5 py-0.5", text: "text-[10px]", dot: "w-1.5 h-1.5" };
      case "lg":
        return { container: "px-3 py-1.5", text: "text-sm", dot: "w-2.5 h-2.5" };
      default: // md
        return { container: "px-2 py-1", text: "text-[12px]", dot: "w-2 h-2" };
    }
  };

  const variants = getVariantClasses();
  const sizes = getSizeClasses();

  if (dot) {
    return (
      <View
        className={`rounded-full ${variants.container} ${sizes.dot} ${pulse ? "opacity-90" : ""} ${className}`}
        style={style}
      />
    );
  }

  return (
    <View
      className={`self-start flex-row items-center justify-center rounded-full ${variants.container} ${sizes.container} ${className}`}
      style={style}
    >
      {children || (
        <Text className={`font-semibold ${variants.text} ${sizes.text}`} style={textStyle}>
          {label}
        </Text>
      )}
    </View>
  );
}
