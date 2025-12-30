import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, Stack } from "expo-router";
import { Vibe, DeckEngine, ArchetypeDefinition } from "@trip-vibes/shared";
import { VibeStack } from "../components/VibeStack";
import { Screen, Button, Badge } from "../components/ui";
import { useTheme } from "../components/ThemeProvider";
import { useCreationFlow } from "../store/creation-flow";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const REQUIRED_LIKES = 6;

export default function VibesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { city, likeVibe, dislikeVibe, likedVibes, dislikedVibes, vibeProfile } = useCreationFlow();

  const [currentVibe, setCurrentVibe] = useState<Vibe | null>(null);
  const [nextVibe, setNextVibe] = useState<Vibe | null>(null);
  const [complete, setComplete] = useState(false);

  // Initialize Engine
  const engine = useMemo(() => {
    const usedIds = [...likedVibes, ...dislikedVibes];
    return new DeckEngine(usedIds);
  }, [likedVibes, dislikedVibes]);

  const archetypeToVibe = (arch: ArchetypeDefinition, cid: string): Vibe => ({
    id: arch.id,
    title: arch.title,
    description: arch.description,
    imageUrl: arch.imageUrl,
    category: arch.category.toLowerCase(),
    cityId: cid,
    tags: arch.tags,
    neighborhood: arch.category,
  });

  // Effect to load cards
  useEffect(() => {
    if (!city) {
      console.warn("No cityId found, cannot load vibes.");
      router.replace("/");
      return;
    }

    if (likedVibes.length >= REQUIRED_LIKES) {
      setComplete(true);
      return;
    }

    if (!currentVibe) {
      const card = engine.getNextCard(vibeProfile);
      if (card) {
        setCurrentVibe(archetypeToVibe(card, city.id));
      } else {
        setComplete(true);
      }
    }

    if (currentVibe && !nextVibe) {
      const nextCard = engine.getNextCard(vibeProfile, [currentVibe.id]);
      if (nextCard) {
        setNextVibe(archetypeToVibe(nextCard, city.id));
      }
    }
  }, [engine, vibeProfile, city, likedVibes, currentVibe, nextVibe, router]);

  const handleSwipeRight = (vibe: Vibe) => {
    likeVibe(vibe.id);
    setCurrentVibe(nextVibe);
    setNextVibe(null);
  };

  const handleSwipeLeft = (vibe: Vibe) => {
    dislikeVibe(vibe.id);
    setCurrentVibe(nextVibe);
    setNextVibe(null);
  };

  const handleGenerate = () => {
    router.push("/generating");
  };

  // Dynamic header with progress
  const progressText = `${likedVibes.length}/${REQUIRED_LIKES}`;

  if (complete) {
    return (
      <Screen centered padded>
        <LinearGradient
          colors={[colors.primary + "20", colors.accent + "20"]}
          className="w-full items-center py-12 px-6 rounded-3xl mb-8"
        >
          <Sparkles size={64} color={colors.primary} className="mb-6" />
          <Text className="text-[32px] font-bold mb-2 text-foreground text-center">All Set! 🎉</Text>
          <Text className="text-[18px] mb-2 text-muted-foreground text-center">
            You liked {likedVibes.length} vibes
          </Text>
          <Text className="text-[15px] text-center text-muted-foreground">
            Ready to create your personalized itinerary?
          </Text>
        </LinearGradient>

        <View className="w-full px-5">
          <Button
            title="Generate Itinerary"
            onPress={handleGenerate}
            fullWidth
            size="lg"
            leftIcon={<Sparkles size={20} color={colors.primaryForeground} />}
          />
          <Button
            title="Start Over"
            variant="ghost"
            onPress={() => router.replace("/")}
            leftIcon={<RotateCcw size={18} color={colors.primary} />}
            className="mt-3"
          />
        </View>
      </Screen>
    );
  }

  if (!currentVibe) {
    return (
      <Screen centered>
        <Text className="text-muted-foreground">Loading Vibes...</Text>
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Badge label={progressText} variant={likedVibes.length >= REQUIRED_LIKES ? "success" : "muted"} size="md" />
          ),
        }}
      />

      <GestureHandlerRootView className="flex-1">
        <View className="flex-1 bg-background">
          {/* Progress Bar */}
          <View className="px-5 pt-2 pb-4">
            <View className="h-1.5 rounded-full overflow-hidden bg-muted">
              <View
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${(likedVibes.length / REQUIRED_LIKES) * 100}%`,
                }}
              />
            </View>
            <Text className="text-[12px] mt-2 text-center text-muted-foreground">
              {likedVibes.length < REQUIRED_LIKES
                ? `${REQUIRED_LIKES - likedVibes.length} more to go`
                : "Ready to generate!"}
            </Text>
          </View>

          {/* Card Stack */}
          <View className="flex-1 px-4">
            <VibeStack
              currentVibe={currentVibe}
              nextVibe={nextVibe}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
            />
          </View>

          {/* Action Hints */}
          <View className="flex-row justify-around px-10 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
            <View className="items-center gap-2">
              <View className="w-12 h-12 rounded-full items-center justify-center bg-error/20">
                <ThumbsDown size={20} color={colors.error} />
              </View>
              <Text className="text-[12px] font-medium text-muted-foreground">Swipe Left</Text>
            </View>

            <View className="items-center gap-2">
              <View className="w-12 h-12 rounded-full items-center justify-center bg-success/20">
                <ThumbsUp size={20} color={colors.success} />
              </View>
              <Text className="text-[12px] font-medium text-muted-foreground">Swipe Right</Text>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </>
  );
}
