import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { Itinerary } from "@trip-vibes/shared";
import { ActivityCard } from "./ActivityCard";
import { Colors } from "../../constants/Colors";

interface TimelineProps {
  itinerary: Itinerary;
}

export function Timeline({ itinerary }: TimelineProps) {
  const colors = Colors.light;

  return (
    <View style={styles.container}>
      {itinerary.days.map((day) => (
        <View key={day.id} style={styles.dayContainer}>
          <View style={styles.dayHeader}>
            <Text style={[styles.dayTitle, { color: colors.foreground }]}>Day {day.dayNumber}</Text>
            <Text style={[styles.dayNeighborhood, { color: colors.mutedForeground }]}>{day.neighborhood}</Text>
          </View>

          {day.activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  dayContainer: {
    marginBottom: 30,
  },
  dayHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dayTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  dayNeighborhood: {
    fontSize: 16,
    marginTop: 4,
  },
});
