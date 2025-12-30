import React from "react";
import { View, Text, Image, useWindowDimensions } from "react-native";
import { Vibe } from "@trip-vibes/shared";
import { LinearGradient } from "expo-linear-gradient";

interface VibeCardProps {
  vibe: Vibe;
  onInfoPress?: () => void;
}

export function VibeCard({ vibe, onInfoPress }: VibeCardProps) {
  const { width, height } = useWindowDimensions();
  const CARD_WIDTH = width * 0.9;
  const CARD_HEIGHT = height * 0.6;

  return (
    <View
      className="rounded-[20px] overflow-hidden shadow-lg bg-background"
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
    >
      <Image source={{ uri: vibe.imageUrl }} className="w-full h-full" resizeMode="cover" />

      <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} className="absolute inset-x-0 bottom-0 h-[200px]" />

      <View className="absolute bottom-0 inset-x-0 p-5 flex-row items-end justify-between">
        <View className="flex-1">
          <Text
            className="text-white text-[28px] font-bold mb-2"
            numberOfLines={2}
            style={{
              textShadowColor: "rgba(0, 0, 0, 0.75)",
              textShadowOffset: { width: -1, height: 1 },
              textShadowRadius: 10,
            }}
          >
            {vibe.title}
          </Text>
          <Text className="text-[#ddd] text-base capitalize font-semibold">{vibe.category}</Text>
        </View>

        {/* <TouchableOpacity onPress={onInfoPress} className="p-2.5 bg-white/20 rounded-full ml-2.5">
          <Info color="#fff" size={24} />
        </TouchableOpacity> */}
      </View>
    </View>
  );
}
