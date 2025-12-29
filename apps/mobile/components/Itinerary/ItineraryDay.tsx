import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ItineraryDay as ItineraryDayType } from "@trip-vibes/shared";
import { ItineraryItem } from "./ItineraryItem";
import { Colors } from "../../constants/Colors";

interface ItineraryDayProps {
  day: ItineraryDayType;
}

export function ItineraryDay({ day }: ItineraryDayProps) {
  const colors = Colors.light;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.dayTitle, { color: colors.foreground }]}>Day {day.dayNumber}</Text>
        <Text style={[styles.neighborhood, { color: colors.mutedForeground }]}>{day.neighborhood}</Text>
      </View>

      <View style={styles.items}>
        {day.activities.map((item) => (
          <ItineraryItem key={item.id} item={item} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  neighborhood: {
    fontSize: 16,
  },
  items: {
    paddingLeft: 0,
  },
});
