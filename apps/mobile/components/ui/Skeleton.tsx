import React, { useEffect } from "react";
import { View, DimensionValue, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
} from "react-native-reanimated";

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  className?: string;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 20, borderRadius = 8, className = "", style }: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(withTiming(1, { duration: 1000 }), withTiming(0, { duration: 1000 })),
      -1 // infinite
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.4, 0.7]),
  }));

  return (
    <Animated.View
      className={`bg-muted ${className}`}
      style={[
        {
          width,
          height,
          borderRadius,
        } as ViewStyle,
        animatedStyle,
        style,
      ]}
    />
  );
}

// Preset skeleton variants
export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <View className={`gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === lines - 1 && lines > 1 ? "70%" : "100%"} />
      ))}
    </View>
  );
}

export function SkeletonAvatar({ size = 40, className = "" }: { size?: number; className?: string }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} className={className} />;
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <View className={`bg-card rounded-xl p-4 gap-3 ${className}`}>
      <View className="flex-row items-center gap-3">
        <SkeletonAvatar size={48} />
        <View className="flex-1 gap-2">
          <Skeleton height={16} width="60%" />
          <Skeleton height={12} width="40%" />
        </View>
      </View>
      <SkeletonText lines={3} />
    </View>
  );
}

// Skeleton for saved trips list
export function SkeletonTripCard({ className = "" }: { className?: string }) {
  return (
    <View className={`bg-card rounded-xl overflow-hidden ${className}`}>
      {/* Gradient accent bar placeholder */}
      <View className="h-1 bg-muted" />
      <View className="p-4 gap-3">
        {/* Date skeleton */}
        <Skeleton height={12} width={80} />
        {/* Title skeleton */}
        <Skeleton height={20} width="70%" />
        {/* Meta row */}
        <View className="flex-row items-center gap-4 mt-1">
          <View className="flex-row items-center gap-2">
            <Skeleton width={14} height={14} borderRadius={7} />
            <Skeleton height={12} width={60} />
          </View>
          <View className="flex-row items-center gap-2">
            <Skeleton width={14} height={14} borderRadius={7} />
            <Skeleton height={12} width={80} />
          </View>
        </View>
      </View>
    </View>
  );
}

// Skeleton for trips list view
export function SkeletonTripsList({ count = 3, className = "" }: { count?: number; className?: string }) {
  return (
    <View className={`gap-4 px-5 pt-5 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTripCard key={i} />
      ))}
    </View>
  );
}

// Skeleton for itinerary view
export function SkeletonItinerary({ className = "" }: { className?: string }) {
  return (
    <View className={`gap-4 ${className}`}>
      {[1, 2].map((day) => (
        <View key={day} className="mb-2">
          {/* Day Header */}
          <View className="flex-row items-center px-4 mb-6 gap-3">
            <Skeleton width={12} height={12} borderRadius={6} />
            <View className="gap-1.5 py-1">
              <Skeleton width={120} height={22} borderRadius={6} />
              <Skeleton width={80} height={13} borderRadius={4} />
            </View>
          </View>

          {/* Items */}
          <View className="pl-0">
            {[1, 2].map((item, idx) => (
              <View key={`${day}-${item}`} className="flex-row px-4 mb-2">
                {/* Timeline Column */}
                <View className="w-[45px] items-center mr-3">
                  <Skeleton width={35} height={12} borderRadius={4} className="mb-2" />
                  <View className="w-0.5 flex-1 bg-muted rounded-sm" />
                </View>

                {/* Card content */}
                <View
                  className={`flex-1 bg-card rounded-2xl overflow-hidden mb-6 border border-border ${
                    idx === 1 ? "opacity-60" : ""
                  }`}
                >
                  <Skeleton width="100%" height={150} borderRadius={0} />
                  <View className="p-4 gap-3">
                    <Skeleton width={80} height={10} borderRadius={4} />
                    <Skeleton width="70%" height={20} borderRadius={6} />
                    <View className="gap-1.5">
                      <Skeleton width="90%" height={14} borderRadius={4} />
                      <Skeleton width="60%" height={14} borderRadius={4} />
                    </View>
                    <View className="flex-row gap-2 mt-2">
                      <Skeleton width={60} height={24} borderRadius={12} />
                      <Skeleton width={60} height={24} borderRadius={12} />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// Skeleton for itinerary hero section
export function SkeletonItineraryHero({ className = "" }: { className?: string }) {
  return (
    <View className={`${className}`}>
      {/* Hero gradient placeholder */}
      <View className="bg-muted pb-20 px-6 pt-28 rounded-b-[32px] items-center">
        {/* Icon placeholder */}
        <Skeleton width={24} height={24} borderRadius={12} className="mb-4" />
        {/* Title */}
        <Skeleton width={200} height={32} className="mb-3" />
        {/* Meta row */}
        <View className="flex-row items-center gap-4 mb-5">
          <Skeleton width={100} height={16} />
          <Skeleton width={80} height={16} />
        </View>
        {/* Badges */}
        <View className="flex-row gap-2">
          <Skeleton width={120} height={28} borderRadius={14} />
          <Skeleton width={90} height={28} borderRadius={14} />
        </View>
      </View>

      {/* Stats card placeholder */}
      <View className="absolute -bottom-10 left-6 right-6 h-20 rounded-[20px] flex-row items-center px-3 border border-border bg-card">
        <View className="flex-1 items-center">
          <Skeleton width={32} height={24} className="mb-1" />
          <Skeleton width={40} height={10} />
        </View>
        <View className="w-[1px] h-[30px] bg-border opacity-50" />
        <View className="flex-1 items-center">
          <Skeleton width={32} height={24} className="mb-1" />
          <Skeleton width={40} height={10} />
        </View>
        <View className="w-[1px] h-[30px] bg-border opacity-50" />
        <View className="flex-1 items-center">
          <Skeleton width={60} height={24} className="mb-1" />
          <Skeleton width={40} height={10} />
        </View>
      </View>
    </View>
  );
}

// Full itinerary page skeleton
export function SkeletonItineraryPage() {
  return (
    <View className="flex-1 bg-background">
      <SkeletonItineraryHero className="mb-[60px]" />
      <View className="px-4 mt-5">
        <SkeletonItinerary />
      </View>
    </View>
  );
}
