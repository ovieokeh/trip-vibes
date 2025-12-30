import React, { useCallback } from "react";
import { View, Dimensions, Text } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Vibe } from "@trip-vibes/shared";
import { VibeCard } from "./VibeCard";

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = width * 0.3;

interface VibeStackProps {
  currentVibe: Vibe | null;
  nextVibe: Vibe | null;
  onSwipeRight: (vibe: Vibe) => void;
  onSwipeLeft: (vibe: Vibe) => void;
}

export function VibeStack({ currentVibe, nextVibe, onSwipeRight, onSwipeLeft }: VibeStackProps) {
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);

  const handleSwipeComplete = useCallback(
    (direction: "left" | "right") => {
      if (!currentVibe) return;

      if (direction === "right") {
        onSwipeRight(currentVibe);
      } else {
        onSwipeLeft(currentVibe);
      }

      // Reset immediately for next card (parent will swap vibes)
      translationX.value = 0;
      translationY.value = 0;
    },
    [currentVibe, onSwipeRight, onSwipeLeft, translationX, translationY]
  );

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translationX.value = event.translationX;
      translationY.value = event.translationY;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? "right" : "left";
        const targetX = direction === "right" ? width * 1.5 : -width * 1.5;

        translationX.value = withSpring(targetX, { velocity: event.velocityX });
        runOnJS(handleSwipeComplete)(direction);
      } else {
        translationX.value = withSpring(0);
        translationY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translationX.value, [-width / 2, 0, width / 2], [-15, 0, 15], Extrapolation.CLAMP);

    return {
      transform: [{ translateX: translationX.value }, { translateY: translationY.value }, { rotate: `${rotate}deg` }],
    };
  });

  const nextCardStyle = useAnimatedStyle(() => {
    const scale = interpolate(Math.abs(translationX.value), [0, width], [0.9, 1], Extrapolation.CLAMP);

    return {
      transform: [{ scale }],
      opacity: interpolate(Math.abs(translationX.value), [0, width], [0.6, 1], Extrapolation.CLAMP),
    };
  });

  if (!currentVibe) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-foreground">Loading more vibes...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center">
      {nextVibe && (
        <Animated.View className="absolute w-full items-center justify-center" style={nextCardStyle}>
          <VibeCard vibe={nextVibe} />
        </Animated.View>
      )}

      <GestureDetector gesture={gesture}>
        <Animated.View className="absolute w-full items-center justify-center" style={animatedStyle}>
          <VibeCard vibe={currentVibe} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
