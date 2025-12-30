import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { getUserItineraries } from "../../lib/vibe-api";
import { Itinerary } from "@trip-vibes/shared";
import { useTheme } from "../../components/ThemeProvider";
import { Card, Badge, EmptyState } from "../../components/ui";
import { format } from "date-fns";
import { MapPin, Calendar, ChevronRight, Compass } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function SavedTripsScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [trips, setTrips] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrips = useCallback(async () => {
    try {
      const data = await getUserItineraries();
      setTrips(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTrips();
  }, [loadTrips]);

  const renderItem = ({ item, index }: { item: Itinerary; index: number }) => {
    const gradientColors = [
      [colors.primary, colors.accent],
      [colors.secondary, colors.primary],
      [colors.accent, colors.success],
    ][index % 3] as [string, string];

    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={() => router.push(`/itinerary/${item.id}`)}
        activeOpacity={0.7}
      >
        <Card variant="elevated" padding="none" style={styles.tripCard}>
          {/* Gradient Accent Bar */}
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBar}
          />

          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Badge label={item.cityId.toUpperCase()} variant="muted" size="sm" />
              <Text style={[styles.date, { color: colors.mutedForeground }]}>
                {item.startDate ? format(new Date(item.startDate), "MMM d, yyyy") : "Draft"}
              </Text>
            </View>

            <Text style={[styles.tripName, { color: colors.foreground }]}>
              {item.name || `Trip to ${formatCity(item.cityId)}`}
            </Text>

            <View style={styles.cardFooter}>
              <View style={styles.stat}>
                <Calendar size={14} color={colors.mutedForeground} />
                <Text style={[styles.statText, { color: colors.mutedForeground }]}>{item.days?.length || 0} Days</Text>
              </View>
              <View style={styles.stat}>
                <MapPin size={14} color={colors.mutedForeground} />
                <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                  {item.days?.reduce((acc, day) => acc + (day.activities?.length || 0), 0) || 0} Activities
                </Text>
              </View>
              <ChevronRight size={20} color={colors.mutedForeground} style={{ marginLeft: "auto" }} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={<Compass size={48} color={colors.mutedForeground} />}
            title="No trips yet"
            description="Start planning your first adventure! Swipe through vibes and create your perfect itinerary."
            actionLabel="Plan a Trip"
            onAction={() => router.push("/")}
          />
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        />
      )}
    </View>
  );
}

function formatCity(id: string) {
  if (!id) return "";
  return id.charAt(0).toUpperCase() + id.slice(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  tripCard: {
    overflow: "hidden",
  },
  gradientBar: {
    height: 4,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  date: {
    fontSize: 12,
  },
  tripName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
  },
});
