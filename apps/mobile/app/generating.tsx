import React, { useEffect, useState, useRef } from "react";
import { View, Text, ActivityIndicator, Animated } from "react-native";
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
  const { colors } = useTheme();
  const { city, likedVibes, startDate, endDate, budget, resetFlow } = useCreationFlow();

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
        budget: budget || "medium",
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
        <View className="items-center w-full px-5">
          <View className="w-24 h-24 rounded-full items-center justify-center mb-6 bg-error/15">
            <AlertCircle size={48} color={colors.error} />
          </View>
          <Text className="text-[22px] font-bold mb-3 text-center text-foreground">Oops! Something went wrong</Text>
          <Text className="text-[15px] text-center leading-[22px] mb-8 text-muted-foreground">{error}</Text>
          <View className="w-full">
            <Button
              title="Try Again"
              onPress={handleRetry}
              leftIcon={<RefreshCw size={18} color={colors.primaryForeground} />}
              fullWidth
            />
            <Button title="Go Home" variant="ghost" onPress={handleGoHome} className="mt-3" />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen centered padded>
      <View className="items-center justify-center w-full">
        {/* Animated Icon */}
        <Animated.View className="mb-8" style={{ transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-[88px] h-[88px] rounded-full items-center justify-center"
          >
            <Sparkles size={40} color="#fff" />
          </LinearGradient>
        </Animated.View>

        {/* Loading Indicator */}
        <ActivityIndicator size="small" color={colors.primary} className="mb-6" />

        {/* Current Step */}
        <Text className="text-[22px] font-bold mb-2 text-center text-foreground">{currentStep}</Text>

        {/* Subtitle */}
        <Text className="text-[15px] text-center mb-6 text-muted-foreground">Building your perfect trip...</Text>

        {/* City Info */}
        <View className="px-4 py-2 rounded-full bg-muted">
          <Text className="text-sm font-medium text-muted-foreground">
            {city?.name ? city.name : "Your destination"}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
