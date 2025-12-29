import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../components/ui";
import { getUserItineraries } from "../lib/vibe-api";
import { Itinerary } from "@trip-vibes/shared";
import { Colors } from "../constants/Colors";
import { format } from "date-fns";

export default function SavedTripsScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const [trips, setTrips] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrips = async () => {
      try {
        const data = await getUserItineraries();
        setTrips(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadTrips();
  }, []);

  const renderItem = ({ item }: { item: Itinerary }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: "#fff" }]}
      onPress={() => router.push(`/itinerary/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.city}>{item.cityId.toUpperCase()}</Text>
        <Text style={styles.date}>{item.startDate ? format(new Date(item.startDate), "MMM d") : "Draft"}</Text>
      </View>
      <Text style={styles.tripName}>{item.name || `Trip to ${item.cityId}`}</Text>
      <Text style={[styles.details, { color: colors.mutedForeground }]}>
        {item.days.length} Days • {item.days.reduce((acc, day) => acc + day.activities.length, 0)} Activities
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <Screen centered>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen padded>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Your Trips</Text>
      </View>

      {trips.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: colors.mutedForeground }}>No saved trips yet.</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  list: {
    paddingBottom: 40,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  city: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#888",
    letterSpacing: 1,
  },
  date: {
    fontSize: 12,
    color: "#888",
  },
  tripName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
});
