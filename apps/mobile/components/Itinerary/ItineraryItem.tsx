import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { ItineraryItem as ItineraryItemType } from "@trip-vibes/shared";
import { Colors } from "../../constants/Colors";
import { Clock, MapPin } from "lucide-react-native";

interface ItineraryItemProps {
  item: ItineraryItemType;
}

export function ItineraryItem({ item }: ItineraryItemProps) {
  const colors = Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.timeColumn}>
        <Text style={[styles.time, { color: colors.foreground }]}>{item.startTime}</Text>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>

      <View style={[styles.card, { borderColor: colors.border }]}>
        {item.vibe.imageUrl && <Image source={{ uri: item.vibe.imageUrl }} style={styles.image} />}
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.foreground }]}>{item.vibe.title}</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
            {item.note || item.vibe.description}
          </Text>

          <View style={styles.footer}>
            <View style={styles.tag}>
              <MapPin size={12} color={colors.primary} />
              <Text style={[styles.tagText, { color: colors.primary }]}>{item.vibe.neighborhood}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timeColumn: {
    width: 60,
    alignItems: "center",
    paddingTop: 4,
  },
  time: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 20,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 16,
  },
  image: {
    width: "100%",
    height: 120,
    backgroundColor: "#eee",
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
