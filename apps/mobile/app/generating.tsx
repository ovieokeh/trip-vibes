import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../components/ui";
import { Colors } from "../constants/Colors";
import { useCreationFlow } from "../store/creation-flow";
import { generateItineraryStream, StreamProgress } from "../lib/vibe-api";
import { Itinerary } from "@trip-vibes/shared";

const STEP_MAPPING: Record<string, string> = {
  checking_credits: "Checking availability...",
  checking_cache: "Looking for similar trips...",
  found_cached: "Found a match!",
  engine: "Finding the best spots...",
  crafting_descriptions: "Adding personal touches...",
  personalizing_activity: "Polishing your itinerary...",
  finalizing: "Wrapping up...",
  error: "Something went wrong.",
};

export default function GeneratingScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const { cityId, likedVibes, startDate, endDate } = useCreationFlow();

  const [currentStep, setCurrentStep] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);

  // Keep track if we've already started to prevent double-firing effects
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const start = startDate ? startDate.toISOString() : new Date().toISOString();
    const end = endDate ? endDate.toISOString() : new Date(Date.now() + 86400000).toISOString();

    console.log("Starting stream...");

    const cancel = generateItineraryStream(
      {
        cityId: cityId || "amsterdam",
        vibes: likedVibes,
        startDate: start,
        endDate: end,
        budget: "medium", // TODO: Add to store
      },
      {
        onProgress: (progress: StreamProgress) => {
          console.log("Progress:", progress.key);
          const text = STEP_MAPPING[progress.key] || STEP_MAPPING[progress.step || ""] || "Working on it...";
          setCurrentStep(text);
        },
        onResult: (itinerary: Itinerary) => {
          console.log("Done! Itinerary ID:", itinerary.id);
          router.replace(`/itinerary/${itinerary.id}`);
        },
        onError: (err: Error) => {
          console.error("Stream Error:", err);
          setError(err.message || "Something went wrong. Please try again.");
        },
      }
    );

    return () => {
      cancel();
    };
  }, []);

  if (error) {
    return (
      <Screen centered padded>
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      </Screen>
    );
  }

  return (
    <Screen centered padded>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
        <Text style={[styles.step, { color: colors.foreground }]}>{currentStep}</Text>
        <Text style={[styles.subtext, { color: colors.mutedForeground }]}>Buildling your perfect trip...</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  spinner: {
    marginBottom: 40,
    transform: [{ scale: 1.5 }],
  },
  step: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  subtext: {
    fontSize: 14,
    textAlign: "center",
  },
  error: {
    fontSize: 16,
    textAlign: "center",
  },
});
