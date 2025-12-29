import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Vibe, DeckEngine, ArchetypeDefinition } from "@trip-vibes/shared";
import { VibeStack } from "../components/VibeStack";
import { Screen, Button } from "../components/ui";
import { Colors } from "../constants/Colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCreationFlow } from "../store/creation-flow";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function VibesScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const { cityId, likeVibe, dislikeVibe, likedVibes, dislikedVibes, vibeProfile } = useCreationFlow();

  const [currentVibe, setCurrentVibe] = useState<Vibe | null>(null);
  const [nextVibe, setNextVibe] = useState<Vibe | null>(null);
  const [complete, setComplete] = useState(false);

  // Initialize Engine
  const engine = useMemo(() => {
    const usedIds = [...likedVibes, ...dislikedVibes];
    return new DeckEngine(usedIds);
  }, [likedVibes, dislikedVibes]); // Re-init on swipe basically

  const archetypeToVibe = (arch: ArchetypeDefinition, cid: string): Vibe => ({
    id: arch.id,
    title: arch.title,
    description: arch.description,
    imageUrl: arch.imageUrl,
    category: arch.category.toLowerCase(),
    cityId: cid,
    tags: arch.tags,
    neighborhood: arch.category, // Fallback
  });

  // Effect to load cards
  useEffect(() => {
    if (!cityId) {
      // This case should ideally be guarded by navigation logic
      console.warn("No cityId found, cannot load vibes.");
      router.replace("/"); // Redirect to home or city selection
      return;
    }

    // Check completion
    if (likedVibes.length >= 6) {
      setComplete(true);
      return;
    }

    // If we have no current card, load one
    if (!currentVibe) {
      const card = engine.getNextCard(vibeProfile);
      if (card) {
        setCurrentVibe(archetypeToVibe(card, cityId));
      } else {
        // No more cards available from the engine
        setComplete(true);
      }
    }

    // Preload next if missing and current exists
    if (currentVibe && !nextVibe) {
      // To get the *next* card, we need to tell the engine to ignore the current one too.
      const nextCard = engine.getNextCard(vibeProfile, [currentVibe.id]);
      if (nextCard) {
        setNextVibe(archetypeToVibe(nextCard, cityId));
      } else {
        // No more cards after the current one
        // This means the currentVibe is the last one, so we don't set nextVibe
      }
    }
  }, [engine, vibeProfile, cityId, likedVibes, currentVibe, nextVibe, router]);

  const handleSwipeRight = (vibe: Vibe) => {
    console.log("Liked:", vibe.title);
    likeVibe(vibe.id);
    setCurrentVibe(nextVibe); // Move next to current
    setNextVibe(null); // Clear next to trigger reload in useEffect
  };

  const handleSwipeLeft = (vibe: Vibe) => {
    console.log("Disliked:", vibe.title);
    dislikeVibe(vibe.id);
    setCurrentVibe(nextVibe); // Move next to current
    setNextVibe(null); // Clear next to trigger reload in useEffect
  };

  const handleGenerate = () => {
    router.push("/generating");
  };

  if (complete) {
    return (
      <Screen centered padded>
        <Text style={styles.title}>All Done!</Text>
        <Text style={styles.subtitle}>You liked {likedVibes.length} vibes.</Text>
        <Text style={[styles.subtitle, { marginTop: 8 }]}>Ready to create your itinerary?</Text>

        <Button title="Generate Itinerary" onPress={handleGenerate} style={{ marginTop: 20 }} fullWidth />
        <Button title="Start Over" variant="ghost" onPress={() => router.replace("/")} style={{ marginTop: 10 }} />
      </Screen>
    );
  }

  // If currentVibe is null and not complete, it means we are still loading or ran out of cards unexpectedly.
  // The useEffect handles setting `complete` if no cards are found.
  // So, if we reach here and currentVibe is null, it implies a brief loading state before `complete` is set.
  if (!currentVibe) {
    return (
      <Screen centered>
        <Text>Loading Vibes...</Text>
      </Screen>
    );
  }

  return (
    <GestureHandlerRootView>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Swipe Your Vibe</Text>
          </View>
          <VibeStack
            currentVibe={currentVibe}
            nextVibe={nextVibe}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
          />
        </SafeAreaView>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
  },
});
