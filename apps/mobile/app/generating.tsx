import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Button } from "../components/ui";
import { useTheme } from "../components/ThemeProvider";
import { useCreationFlow } from "../store/creation-flow";
import { generateItineraryStream, StreamProgress } from "../lib/vibe-api";
import { Itinerary } from "@trip-vibes/shared";
import { Loader2, MapPin, Search, Clock, Sparkles, AlertCircle, RefreshCw } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

const STEP_MAPPING: Record<string, { text: string; stepId: string }> = {
  checking_credits: { text: "Checking availability...", stepId: "init" },
  checking_cache: { text: "Looking for similar trips...", stepId: "init" },
  found_cached: { text: "Found a match!", stepId: "init" },
  engine: { text: "Finding the best spots...", stepId: "engine" },
  crafting_descriptions: { text: "Adding personal touches...", stepId: "enrich" },
  personalizing_activity: { text: "Polishing your itinerary...", stepId: "enrich" },
  finalizing: { text: "Wrapping up...", stepId: "finalize" },
  error: { text: "Something went wrong.", stepId: "done" },
};

const STEPS_ORDER = ["init", "engine", "enrich", "finalize", "done"];

export default function GeneratingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { city, likedVibes, startDate, endDate, budget, resetFlow } = useCreationFlow();

  const [currentText, setCurrentText] = useState("Initializing...");
  const [currentStepId, setCurrentStepId] = useState("init");
  const [error, setError] = useState<string | null>(null);

  // Use reanimated shared values for animations - these persist across re-renders
  const pulseScale = useSharedValue(1);
  const floatY = useSharedValue(0);

  // Keep track if we've already started
  const startedRef = useRef(false);

  // Start animations once on mount
  useEffect(() => {
    // Pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Float animation
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  // Create animated styles
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

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
          const mapping = STEP_MAPPING[progress.key];
          if (mapping) {
            setCurrentText(mapping.text);
            setCurrentStepId(mapping.stepId);
          } else if (progress.step) {
            // Fallback if we get direct step names
            setCurrentStepId(progress.step);
            const fallbackText = Object.values(STEP_MAPPING).find((m) => m.stepId === progress.step)?.text;
            if (fallbackText) setCurrentText(fallbackText);
          }
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

  const handleRetry = useCallback(() => {
    setError(null);
    startedRef.current = false;
    router.replace("/vibes");
  }, [router]);

  const handleGoHome = useCallback(() => {
    resetFlow();
    router.replace("/");
  }, [resetFlow, router]);

  // Determine Icon based on current step
  const Icon = (() => {
    switch (currentStepId) {
      case "init":
        return MapPin;
      case "engine":
        return Search;
      case "enrich":
        return Sparkles;
      case "finalize":
        return Clock;
      default:
        return Loader2;
    }
  })();

  const currentStepIdx = STEPS_ORDER.indexOf(currentStepId);

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
      <View className="items-center justify-center w-full max-w-sm">
        {/* Icon Container with Glow */}
        <View className="relative mb-10 items-center justify-center">
          {/* Pulsing Glow Background */}
          <Animated.View className="absolute w-32 h-32 rounded-full bg-primary/30" style={pulseStyle} />

          {/* Floated Icon Card */}
          <Animated.View className="bg-card p-6 rounded-full shadow-lg border border-border" style={floatStyle}>
            <Icon size={48} color={colors.primary} />
          </Animated.View>
        </View>

        {/* Text Update */}
        <View className="mb-8 items-center gap-2">
          <Text className="text-[22px] font-bold text-center text-foreground">Building your trip</Text>
          <Text className="text-[16px] font-medium text-center text-muted-foreground min-h-[24px]">{currentText}</Text>
        </View>

        {/* Progress Bars */}
        <View className="flex-row gap-2 justify-center mb-2">
          {[0, 1, 2, 3].map((idx) => {
            const isActive = idx <= currentStepIdx;
            return <View key={idx} className={`h-2 rounded-full ${isActive ? "w-10 bg-primary" : "w-2 bg-muted"}`} />;
          })}
        </View>

        <Text className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/80 mt-2">
          Step {Math.max(1, Math.min(4, currentStepIdx + 1))} of 4
        </Text>
      </View>
    </Screen>
  );
}
