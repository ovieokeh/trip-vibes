import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { TripActivity } from "@trip-vibes/shared";
import { Colors } from "../../constants/Colors";
import { Clock, MapPin } from "lucide-react-native";

interface ActivityCardProps {
  activity: TripActivity;
  onPress?: () => void;
}

export function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const colors = Colors.light;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.timeContainer}>
        <Text style={[styles.time, { color: colors.primary }]}>{activity.startTime}</Text>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>

      <View style={[styles.card, { backgroundColor: "#fff", shadowColor: "#000" }]}>
        {activity.vibe.imageUrl && <Image source={{ uri: activity.vibe.imageUrl }} style={styles.image} />}

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {activity.vibe.title}
          </Text>
          <Text style={styles.category}>{activity.vibe.category}</Text>
          <Text style={styles.note} numberOfLines={2}>
            {activity.note}
          </Text>

          <View style={styles.footer}>
            <View style={styles.meta}>
              <Clock size={14} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {activity.startTime} - {activity.endTime}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  timeContainer: {
    width: 60,
    alignItems: "center",
    marginRight: 10,
  },
  time: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 8,
  },
  line: {
    width: 2,
    flex: 1,
    borderRadius: 1,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    fontWeight: "bold",
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  note: {
    fontSize: 14,
    color: "#444",
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
});
