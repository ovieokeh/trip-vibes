import React from "react";
import { View, Text } from "react-native";
import { Button } from "./Button";
import { MapPinOff } from "lucide-react-native";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "No results found",
  description = "We couldn't find what you were looking for.",
  actionLabel,
  onAction,
  icon,
  className = "",
}: EmptyStateProps) {
  return (
    <View className={`flex-1 items-center justify-center p-8 ${className}`}>
      <View className="w-16 h-16 rounded-full bg-border items-center justify-center mb-5">
        {icon || <MapPinOff size={32} className="text-muted-foreground" />}
      </View>

      <Text className="text-xl font-bold text-foreground text-center mb-2">{title}</Text>
      <Text className="text-base text-muted-foreground text-center leading-6">{description}</Text>

      {actionLabel && onAction && <Button title={actionLabel} onPress={onAction} className="mt-6" />}
    </View>
  );
}
