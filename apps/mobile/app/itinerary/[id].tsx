import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Itinerary } from "@trip-vibes/shared";
import { getItinerary } from "../../lib/vibe-api";
import { Screen, Button } from "../../components/ui";
import { ItineraryDay } from "../../components/Itinerary/ItineraryDay";
import { Colors } from "../../constants/Colors";

export default function ItineraryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colors = Colors.light;

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!id || typeof id !== "string") return;

    try {
      const data = await getItinerary(id);
      setItinerary(data);
    } catch (e) {
      setError("Failed to load itinerary");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    load();
  }, [id]);

  if (loading) {
    return (
      <Screen centered>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10 }}>Loading Itinerary...</Text>
      </Screen>
    );
  }

  if (error || !itinerary) {
    return (
      <Screen centered padded>
        <Text style={{ color: colors.error, marginBottom: 20 }}>{error || "Itinerary not found"}</Text>
        <Button title="Go Home" onPress={() => router.replace("/")} />
      </Screen>
    );
  }

  return (
    <Screen safeArea={false} style={{ paddingTop: 60 }}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{itinerary.name || `Trip to ${formatCity(itinerary.cityId)}`}</Text>
        </View>

        {itinerary.days.map((day) => (
          <ItineraryDay key={day.id} day={day} />
        ))}

        <View style={styles.footer}>
          <Button
            title="Save Trip"
            onPress={() => router.push("/saved-trips")}
            variant="outline"
            style={{ marginBottom: 10 }}
          />
          <Button title="Back Home" onPress={() => router.push("/")} variant="ghost" />
        </View>
      </ScrollView>
    </Screen>
  );
}

function formatCity(id: string) {
  if (!id) return "";
  return id.charAt(0).toUpperCase() + id.slice(1);
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  mapContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
});
