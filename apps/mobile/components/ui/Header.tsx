import React from "react";
import { View, Text } from "react-native";
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
  className?: string;
}

export function Header({
  title,
  subtitle,
  leftAction,
  rightAction,
  large = false,
  transparent = false,
  blur = false,
  className = "",
}: HeaderProps) {
  const { isDark } = useTheme();

  const content = (
    <View className={`flex-row items-center justify-between px-4 py-3 min-h-[56px] ${className}`}>
      <View className="flex-1 flex-row items-center justify-start">{leftAction}</View>

      <View className="flex-[2] items-center justify-center">
        {title && (
          <Text
            className={`${large ? "text-[28px] font-bold" : "text-[17px] font-semibold"} text-foreground text-center`}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
        {subtitle && (
          <Text className="text-[13px] text-muted-foreground text-center mt-0.5" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View className="flex-1 flex-row items-center justify-end">{rightAction}</View>
    </View>
  );

  if (blur) {
    return (
      <BlurView intensity={80} tint={isDark ? "dark" : "light"} className="border-b-[0.5px] border-border">
        {content}
      </BlurView>
    );
  }

  return (
    <View
      className={`border-b-[0.5px] ${
        transparent ? "bg-transparent border-transparent" : "bg-background border-border"
      }`}
    >
      {content}
    </View>
  );
}
