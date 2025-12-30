import React from "react";
import { View, ViewProps, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Edge } from "react-native-safe-area-context";

interface ScreenProps extends ViewProps {
  scrollable?: boolean;
  padded?: boolean;
  safeArea?: boolean;
  /** Which edges to apply safe area insets to. Defaults to all edges. */
  edges?: Edge[];
  centered?: boolean;
  refreshControl?: React.ReactElement;
  className?: string;
  contentContainerClassName?: string;
}

export function Screen({
  children,
  scrollable = false,
  padded = true,
  safeArea = true,
  edges,
  centered = false,
  className = "",
  contentContainerClassName = "",
  style,
  refreshControl,
  ...props
}: ScreenProps) {
  const baseClasses = "flex-1";
  const containerClasses = `${baseClasses} ${padded ? "px-5" : ""} ${
    centered ? "items-center justify-center" : ""
  } ${className}`;

  if (scrollable && safeArea) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={edges}>
        <ScrollView
          contentContainerClassName={`${containerClasses} ${contentContainerClassName}`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          style={style}
          {...props}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (scrollable) {
    return (
      <View className="flex-1 bg-background">
        <ScrollView
          contentContainerClassName={`${containerClasses} ${contentContainerClassName}`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={style}
          {...props}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  if (safeArea) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={edges} {...props}>
        <View className={containerClasses} style={style}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-background" {...props}>
      <View className={containerClasses} style={style}>
        {children}
      </View>
    </View>
  );
}
