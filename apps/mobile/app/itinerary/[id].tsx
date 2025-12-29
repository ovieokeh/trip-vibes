import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "../../components/ui";
import { Timeline } from "../../components/Itinerary/Timeline";
import { getItinerary } from "../../lib/vibe-api";
import { Itinerary } from "@trip-vibes/shared";
import { Colors } from "../../constants/Colors";

export default function ItineraryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colors = Colors.light;

  useEffect(() => {
    if (!id) return;

    const fetchItinerary = async () => {
      try {
        const data = await getItinerary(id);
        setItinerary(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load itinerary");
      } finally {
        setLoading(false);
      }
    };

    fetchItinerary();
  }, [id]);

  if (loading) {
    return (
      <Screen centered>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (error || !itinerary) {
    return (
      <Screen centered padded>
        <Text style={{ color: colors.error }}>{error || "Itinerary not found"}</Text>
      </Screen>
    );
  }

  return (
    <Screen scrollable safeArea={false} style={{ paddingTop: 60 }}>
      <View style={styles.header}>
        <Text style={styles.title}>{itinerary.name || `Trip to ${itinerary.cityId}`}</Text>
      </View>
      <Timeline itinerary={itinerary} />
    </Screen>
  );
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
});
