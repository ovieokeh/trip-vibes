import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Animated } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Button } from "../components/ui";
import { useTheme } from "../components/ThemeProvider";
import { useCreationFlow } from "../store/creation-flow";
import { generateItineraryStream, StreamProgress } from "../lib/vibe-api";
import { Itinerary } from "@trip-vibes/shared";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, AlertCircle, RefreshCw } from "lucide-react-native";

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
  const { colors, theme } = useTheme();
  const { city, likedVibes, startDate, endDate, resetFlow } = useCreationFlow();

  const [currentStep, setCurrentStep] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);

  // Animation for pulsing
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Keep track if we've already started
  const startedRef = useRef(false);

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (startedRef.current) return;
    if (!city) {
      console.warn("No city found, cannot generate itinerary.");
      router.replace("/");
      return;
    }
    startedRef.current = true;

    const start = startDate ? startDate.toISOString() : new Date().toISOString();
    const end = endDate ? endDate.toISOString() : new Date(Date.now() + 86400000).toISOString();

    const cancel = generateItineraryStream(
      {
        cityId: city.id,
        vibes: likedVibes,
        startDate: start,
        endDate: end,
        budget: "medium",
      },
      {
        onProgress: (progress: StreamProgress) => {
          const text = STEP_MAPPING[progress.key] || STEP_MAPPING[progress.step || ""] || "Working on it...";
          setCurrentStep(text);
        },
        onResult: (itinerary: Itinerary) => {
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

  const handleRetry = () => {
    setError(null);
    startedRef.current = false;
    router.replace("/vibes");
  };

  const handleGoHome = () => {
    resetFlow();
    router.replace("/");
  };

  if (error) {
    return (
      <Screen centered padded>
        <View style={styles.errorContainer}>
          <View style={[styles.errorIconBg, { backgroundColor: colors.error + "15" }]}>
            <AlertCircle size={48} color={colors.error} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>Oops! Something went wrong</Text>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{error}</Text>
          <View style={styles.errorActions}>
            <Button
              title="Try Again"
              onPress={handleRetry}
              leftIcon={<RefreshCw size={18} color={colors.primaryForeground} />}
              fullWidth
            />
            <Button title="Go Home" variant="ghost" onPress={handleGoHome} style={{ marginTop: 12 }} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen centered padded>
      <View style={styles.container}>
        {/* Animated Icon */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Sparkles size={40} color="#fff" />
          </LinearGradient>
        </Animated.View>

        {/* Loading Indicator */}
        <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />

        {/* Current Step */}
        <Text style={[styles.step, { color: colors.foreground }]}>{currentStep}</Text>

        {/* Subtitle */}
        <Text style={[styles.subtext, { color: colors.mutedForeground }]}>Building your perfect trip...</Text>

        {/* City Info */}
        <View style={[styles.cityBadge, { backgroundColor: colors.muted }]}>
          <Text style={[styles.cityText, { color: colors.mutedForeground }]}>
            {city?.name ? city.name : "Your destination"}
          </Text>
        </View>
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
  iconContainer: {
    marginBottom: 32,
  },
  iconGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    marginBottom: 24,
  },
  step: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtext: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
  cityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cityText: {
    fontSize: 13,
    fontWeight: "500",
  },
  errorContainer: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  errorIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  errorActions: {
    width: "100%",
  },
});
