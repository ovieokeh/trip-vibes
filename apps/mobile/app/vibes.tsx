import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter, Stack } from "expo-router";
import { Vibe, DeckEngine, ArchetypeDefinition } from "@trip-vibes/shared";
import { VibeStack } from "../components/VibeStack";
import { Screen, Button, Badge } from "../components/ui";
import { useTheme } from "../components/ThemeProvider";
import { useCreationFlow } from "../store/creation-flow";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react-native";

const REQUIRED_LIKES = 6;

export default function VibesScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { cityId, likeVibe, dislikeVibe, likedVibes, dislikedVibes, vibeProfile } = useCreationFlow();

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
    if (!cityId) {
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
        setCurrentVibe(archetypeToVibe(card, cityId));
      } else {
        setComplete(true);
      }
    }

    if (currentVibe && !nextVibe) {
      const nextCard = engine.getNextCard(vibeProfile, [currentVibe.id]);
      if (nextCard) {
        setNextVibe(archetypeToVibe(nextCard, cityId));
      }
    }
  }, [engine, vibeProfile, cityId, likedVibes, currentVibe, nextVibe, router]);

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
        <LinearGradient colors={[colors.primary + "20", colors.accent + "20"]} style={styles.completeBg}>
          <Sparkles size={64} color={colors.primary} style={{ marginBottom: 24 }} />
          <Text style={[styles.completeTitle, { color: colors.foreground }]}>All Set! 🎉</Text>
          <Text style={[styles.completeSubtitle, { color: colors.mutedForeground }]}>
            You liked {likedVibes.length} vibes
          </Text>
          <Text style={[styles.completeText, { color: colors.mutedForeground }]}>
            Ready to create your personalized itinerary?
          </Text>
        </LinearGradient>

        <View style={styles.completeActions}>
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
            style={{ marginTop: 12 }}
          />
        </View>
      </Screen>
    );
  }

  if (!currentVibe) {
    return (
      <Screen centered>
        <Text style={{ color: colors.mutedForeground }}>Loading Vibes...</Text>
      </Screen>
    );
  }

  return (
    <>
      {/* Dynamic header right showing progress */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <Badge label={progressText} variant={likedVibes.length >= REQUIRED_LIKES ? "success" : "muted"} size="md" />
          ),
        }}
      />

      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${(likedVibes.length / REQUIRED_LIKES) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
              {likedVibes.length < REQUIRED_LIKES
                ? `${REQUIRED_LIKES - likedVibes.length} more to go`
                : "Ready to generate!"}
            </Text>
          </View>

          {/* Card Stack */}
          <View style={styles.cardContainer}>
            <VibeStack
              currentVibe={currentVibe}
              nextVibe={nextVibe}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
            />
          </View>

          {/* Action Hints */}
          <View style={styles.actionHints}>
            <View style={styles.hintItem}>
              <View style={[styles.hintCircle, { backgroundColor: colors.error + "20" }]}>
                <ThumbsDown size={20} color={colors.error} />
              </View>
              <Text style={[styles.hintText, { color: colors.mutedForeground }]}>Swipe Left</Text>
            </View>

            <View style={styles.hintItem}>
              <View style={[styles.hintCircle, { backgroundColor: colors.success + "20" }]}>
                <ThumbsUp size={20} color={colors.success} />
              </View>
              <Text style={[styles.hintText, { color: colors.mutedForeground }]}>Swipe Right</Text>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  actionHints: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40,
    paddingBottom: 40,
    paddingTop: 16,
  },
  hintItem: {
    alignItems: "center",
    gap: 8,
  },
  hintCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  hintText: {
    fontSize: 12,
    fontWeight: "500",
  },
  completeBg: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginBottom: 32,
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  completeText: {
    fontSize: 15,
    textAlign: "center",
  },
  completeActions: {
    width: "100%",
    paddingHorizontal: 20,
  },
});
