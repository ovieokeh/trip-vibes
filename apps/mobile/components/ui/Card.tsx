import React from "react";
import { View, TouchableOpacity, TouchableOpacityProps } from "react-native";
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
  className = "",
  style,
  ...props
}: CardProps & { className?: string }) {
  const getVariantClasses = () => {
    switch (variant) {
      case "outlined":
        return "bg-card border border-card-border";
      case "filled":
        return "bg-muted";
      default: // elevated
        return "bg-card shadow-md";
    }
  };

  const getPaddingClasses = () => {
    switch (padding) {
      case "none":
        return "p-0";
      case "sm":
        return "p-2"; // 8px
      case "lg":
        return "p-5"; // 20px
      default: // md
        return "p-4"; // 16px
    }
  };

  const baseClasses = `overflow-hidden rounded-xl ${getVariantClasses()} ${getPaddingClasses()} ${className}`;

  if (pressable) {
    return (
      <TouchableOpacity className={baseClasses} style={style} activeOpacity={0.7} {...props}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={baseClasses} style={style}>
      {children}
    </View>
  );
}

// Sub-components for structured cards
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

export function CardHeader({ children, className = "", style }: CardHeaderProps) {
  return (
    <View className={`mb-3 ${className}`} style={style}>
      {children}
    </View>
  );
}

export function CardContent({ children, className = "", style }: CardHeaderProps) {
  return (
    <View className={className} style={style}>
      {children}
    </View>
  );
}

export function CardFooter({ children, className = "", style }: CardHeaderProps) {
  return (
    <View className={`mt-3 ${className}`} style={style}>
      {children}
    </View>
  );
}
