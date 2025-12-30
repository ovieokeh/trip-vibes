import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View, TouchableOpacityProps } from "react-native";
import * as Haptics from "expo-haptics";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  textClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  haptic?: boolean;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className = "",
  textClassName = "",
  disabled,
  leftIcon,
  rightIcon,
  haptic = true,
  onPress,
  ...props
}: ButtonProps) {
  const handlePress = (e: any) => {
    if (haptic && !disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(e);
  };

  // Base styles
  const baseStyles = "flex-row items-center justify-center rounded-2xl";
  const disabledStyles = disabled || loading ? "opacity-50" : "";
  const widthStyles = fullWidth ? "w-full" : "self-start";

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return "bg-secondary";
      case "outline":
        return "bg-transparent border-[1.5px] border-primary";
      case "ghost":
        return "bg-transparent";
      case "destructive":
        return "bg-destructive";
      default:
        return "bg-primary";
    }
  };

  // Text color styles
  const getTextStyles = () => {
    switch (variant) {
      case "secondary":
        return "text-secondary-foreground";
      case "outline":
      case "ghost":
        return "text-primary";
      case "destructive":
        return "text-destructive-foreground";
      default:
        return "text-primary-foreground";
    }
  };

  // Size styles
  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "py-2 px-4";
      case "lg":
        return "py-4 px-8";
      default:
        return "py-3 px-6";
    }
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case "sm":
        return "text-sm";
      case "lg":
        return "text-lg";
      default:
        return "text-base";
    }
  };

  // Icon spacing
  const iconGap = size === "sm" ? 6 : size === "lg" ? 10 : 8;

  return (
    <TouchableOpacity
      className={`${baseStyles} ${getVariantStyles()} ${getSizeStyles()} ${widthStyles} ${disabledStyles} ${className}`}
      disabled={disabled || loading}
      activeOpacity={0.8}
      onPress={handlePress}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "ghost"
              ? "#6366f1" // primary color hardcoded or could use theme
              : variant === "secondary"
                ? "#000"
                : "#FFF"
          }
          size="small"
        />
      ) : (
        <View className="flex-row items-center justify-center">
          {leftIcon && <View style={{ marginRight: iconGap }}>{leftIcon}</View>}
          <Text className={`font-semibold ${getTextStyles()} ${getTextSizeStyles()} ${textClassName}`}>{title}</Text>
          {rightIcon && <View style={{ marginLeft: iconGap }}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}
