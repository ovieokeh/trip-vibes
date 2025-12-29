import React from "react";
import { View, Text, Image, StyleSheet, Dimensions, Platform } from "react-native";
import { Vibe } from "@trip-vibes/shared";
import { Colors } from "../constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { Info } from "lucide-react-native";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = height * 0.6;

interface VibeCardProps {
  vibe: Vibe;
  onInfoPress?: () => void;
}

export function VibeCard({ vibe, onInfoPress }: VibeCardProps) {
  const colors = Colors.light;

  return (
    <View style={[styles.card, { backgroundColor: colors.background }]}>
      <Image source={{ uri: vibe.imageUrl }} style={styles.image} resizeMode="cover" />

      <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.gradient} />

      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {vibe.title}
          </Text>
          <Text style={styles.category}>{vibe.category}</Text>
        </View>

        {/* <TouchableOpacity onPress={onInfoPress} style={styles.infoButton}>
          <Info color="#fff" size={24} />
        </TouchableOpacity> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  category: {
    color: "#ddd", // slightly dimmed white
    fontSize: 16,
    textTransform: "capitalize",
    fontWeight: "600",
  },
  infoButton: {
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 50,
    marginLeft: 10,
  },
});
