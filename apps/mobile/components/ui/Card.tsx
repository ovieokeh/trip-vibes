import React from "react";
import { View, Pressable, PressableProps, ViewStyle } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { springs, scales } from "../../constants/motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardProps extends PressableProps {
  children: React.ReactNode;
  variant?: "elevated" | "outlined" | "filled";
  padding?: "none" | "sm" | "md" | "lg";
  pressable?: boolean;
  animated?: boolean;
}

export function Card({
  children,
  variant = "elevated",
  padding = "md",
  pressable = false,
  animated = true,
  className = "",
  style,
  onPressIn,
  onPressOut,
  ...props
}: CardProps & { className?: string }) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? scales.pressed : 1, springs.gentle) }],
  }));

  const handlePressIn = (e: any) => {
    if (animated) pressed.value = 1;
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    pressed.value = 0;
    onPressOut?.(e);
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "outlined":
        return "bg-card border border-card-border";
      case "filled":
        return "bg-muted";
      default: // elevated
        return "bg-card shadow-lg shadow-indigo-500/10";
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

  const baseClasses = `overflow-hidden rounded-3xl ${getVariantClasses()} ${getPaddingClasses()} ${className}`;

  if (pressable) {
    return (
      <AnimatedPressable
        className={baseClasses}
        style={[animated ? animatedStyle : undefined, style]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View className={baseClasses} style={style as ViewStyle}>
      {children}
    </View>
  );
}

// Sub-components for structured cards
interface CardSubProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export function CardHeader({ children, className = "", style }: CardSubProps) {
  return (
    <View className={`mb-3 ${className}`} style={style}>
      {children}
    </View>
  );
}

export function CardContent({ children, className = "", style }: CardSubProps) {
  return (
    <View className={className} style={style}>
      {children}
    </View>
  );
}

export function CardFooter({ children, className = "", style }: CardSubProps) {
  return (
    <View className={`mt-3 ${className}`} style={style}>
      {children}
    </View>
  );
}
