import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Vibe } from "@trip-vibes/shared";
import { VibeStack } from "../components/VibeStack";
import { Screen, Button } from "../components/ui";
import { Colors } from "../constants/Colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCreationFlow } from "../store/creation-flow";

// Mock Data
const MOCK_VIBES: Vibe[] = [
  {
    id: "1",
    title: "Hidden Canals",
    description: "Discover the secret waterways away from the crowds.",
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
    category: "hidden-gem",
    cityId: "amsterdam",
    tags: ["quiet", "water", "scenic"],
    neighborhood: "Jordaan",
  },
  {
    id: "2",
    title: "Urban Industrial Art",
    description: "Gritty, colorful street art in repurposed warehouses.",
    imageUrl: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&q=80",
    category: "culture",
    cityId: "amsterdam",
    tags: ["art", "edgy", "photo"],
    neighborhood: "NDSM",
  },
  {
    id: "3",
    title: "Cozy Brown Cafe",
    description: "Traditional Dutch pubs with a warm, candlelit atmosphere.",
    imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80",
    category: "nightlife",
    cityId: "amsterdam",
    tags: ["drinks", "cozy", "local"],
    neighborhood: "De Pijp",
  },
];

export default function VibesScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const { likeVibe, dislikeVibe, likedVibes } = useCreationFlow();

  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    // Simulate fetch
    setTimeout(() => {
      setVibes(MOCK_VIBES);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSwipeRight = (vibe: Vibe) => {
    console.log("Liked:", vibe.title);
    likeVibe(vibe.id);
  };

  const handleSwipeLeft = (vibe: Vibe) => {
    console.log("Disliked:", vibe.title);
    dislikeVibe(vibe.id);
  };

  const handleFinished = () => {
    setComplete(true);
  };

  const handleGenerate = () => {
    // TODO: Verify we have enough data (dates, city, etc)
    // For now, assume mock details and navigate to generating
    router.push("/generating");
  };

  if (loading) {
    return (
      <Screen centered>
        <Text>Loading Vibes...</Text>
      </Screen>
    );
  }

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Swipe Your Vibe</Text>
        </View>
        <VibeStack
          vibes={vibes}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
          onFinished={handleFinished}
        />
      </SafeAreaView>
    </View>
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
