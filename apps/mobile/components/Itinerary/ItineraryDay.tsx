import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ItineraryDay as ItineraryDayType } from "@trip-vibes/shared";
import { ItineraryItem } from "./ItineraryItem";
import { useTheme } from "../ThemeProvider";
import { Plus } from "lucide-react-native";

interface ItineraryDayProps {
  day: ItineraryDayType;
  onAddActivity?: (index?: number) => void;
}

export function ItineraryDay({ day, onAddActivity }: ItineraryDayProps) {
  const { colors } = useTheme();

  // Format date if available
  const dateObj = day.date ? new Date(day.date) : null;
  const displayDate = dateObj
    ? dateObj.toLocaleDateString(undefined, { month: "long", day: "numeric" })
    : `Day ${day.dayNumber}`;

  const displayDayName = dateObj ? dateObj.toLocaleDateString(undefined, { weekday: "long" }) : "";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: colors.primary, shadowColor: colors.primary }]} />
        <View style={styles.headerTitleRow}>
          <Text style={[styles.dayTitle, { color: colors.foreground }]}>{displayDate}</Text>
          {displayDayName ? (
            <Text style={[styles.daySubtitle, { color: colors.mutedForeground }]}>
              {displayDayName}, Day {day.dayNumber}
            </Text>
          ) : null}
        </View>
        {day.neighborhood && (
          <View style={[styles.neighborhoodBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.neighborhoodText, { color: colors.mutedForeground }]}>{day.neighborhood}</Text>
          </View>
        )}
      </View>

      <View style={styles.items}>
        {day.activities.map((item, index) => (
          <React.Fragment key={item.id}>
            <ItineraryItem item={item} dayDate={day.date} />

            {/* Add Activity Button after each item */}
            <TouchableOpacity
              style={styles.addActivityContainer}
              onPress={() => onAddActivity?.(index)}
              activeOpacity={0.6}
            >
              <View style={[styles.addActivityLine, { backgroundColor: colors.border }]} />
              <View
                style={[styles.addActivityButton, { borderColor: colors.border, backgroundColor: colors.background }]}
              >
                <Plus size={14} color={colors.mutedForeground} />
                <Text style={[styles.addActivityText, { color: colors.mutedForeground }]}>Add Activity</Text>
              </View>
            </TouchableOpacity>
          </React.Fragment>
        ))}

        {day.activities.length === 0 && (
          <TouchableOpacity style={styles.emptyDayAdd} onPress={() => onAddActivity?.()} activeOpacity={0.6}>
            <Plus size={20} color={colors.primary} />
            <Text style={[styles.emptyDayText, { color: colors.primary }]}>Add your first activity</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: "transparent", // We'll use absolute positioned lines in Items if needed
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    marginLeft: -5, // Center on the timeline if we had a continuous one
  },
  headerTitleRow: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  daySubtitle: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  neighborhoodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  neighborhoodText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  items: {
    paddingLeft: 0,
  },
  addActivityContainer: {
    paddingHorizontal: 16,
    height: 40,
    justifyContent: "center",
    marginBottom: 16,
  },
  addActivityLine: {
    position: "absolute",
    left: 16 + 22.5, // Center of timeColumn (45/2)
    top: 0,
    bottom: 0,
    width: 1,
  },
  addActivityButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 8,
    marginLeft: 57, // Same offset as Card
  },
  addActivityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyDayAdd: {
    marginHorizontal: 16,
    marginLeft: 16 + 57,
    padding: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#ccc",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyDayText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
