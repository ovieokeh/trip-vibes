import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";
import { Button } from "./Button";
import { MapPinOff } from "lucide-react-native"; // Assuming lucide or similar

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "No results found",
  description = "We couldn't find what you were looking for.",
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  const colors = Colors.light;

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.border }]}>
        {icon || <MapPinOff size={32} color={colors.mutedForeground} />}
      </View>

      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>

      {actionLabel && onAction && <Button title={actionLabel} onPress={onAction} style={{ marginTop: 24 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
