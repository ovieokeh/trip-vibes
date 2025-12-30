import React from "react";
import { Text, ActivityIndicator, View, Pressable, PressableProps } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "../ThemeProvider";
import { springs, scales } from "../../constants/motion";
import { gradients } from "../../constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GradientButtonProps extends PressableProps {
  title: string;
  gradient?: keyof typeof gradients | [string, string];
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  textClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  haptic?: boolean;
}

export function GradientButton({
  title,
  gradient = "primary",
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
  onPressIn,
  onPressOut,
  ...props
}: GradientButtonProps) {
  const { colors } = useTheme();
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? scales.pressed : 1, springs.snappy) }],
  }));

  const handlePressIn = (e: any) => {
    pressed.value = 1;
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    pressed.value = 0;
    onPressOut?.(e);
  };

  const handlePress = (e: any) => {
    if (haptic && !disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress?.(e);
  };

  // Get gradient colors
  const gradientColors = Array.isArray(gradient) ? gradient : (gradients[gradient] as readonly [string, string]);

  // Size styles - using padding only, height controlled by inline style
  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "px-5";
      case "lg":
        return "px-10";
      default:
        return "px-8";
    }
  };

  const getHeight = () => {
    switch (size) {
      case "sm":
        return 40;
      case "lg":
        return 64;
      default:
        return 48;
    }
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case "sm":
        return "text-sm";
      case "lg":
        return "text-xl font-bold";
      default:
        return "text-base font-bold";
    }
  };

  const iconGap = size === "sm" ? 6 : size === "lg" ? 10 : 8;
  const widthStyles = fullWidth ? "w-full" : "self-start";
  const disabledStyles = disabled || loading ? "opacity-50" : "";

  return (
    <AnimatedPressable
      disabled={disabled || loading}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={animatedStyle}
      className={`overflow-hidden rounded-2xl ${widthStyles} ${disabledStyles} ${className}`}
      {...props}
    >
      <LinearGradient
        colors={gradientColors as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className={`flex-row ${getSizeStyles()}`}
        style={{
          height: getHeight(),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View className="flex-row items-center justify-center">
            {leftIcon && <View style={{ marginRight: iconGap }}>{leftIcon}</View>}
            <Text
              className={`font-bold text-white ${getTextSizeStyles()} ${textClassName}`}
              style={{
                textShadowColor: "rgba(0,0,0,0.2)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            >
              {title}
            </Text>
            {rightIcon && <View style={{ marginLeft: iconGap }}>{rightIcon}</View>}
          </View>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}
