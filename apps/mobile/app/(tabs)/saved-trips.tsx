import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { getUserItineraries } from "../../lib/vibe-api";
import { Itinerary } from "@trip-vibes/shared";
import { useTheme } from "../../components/ThemeProvider";
import { Card, Badge, EmptyState, TAB_BAR_HEIGHT, SkeletonTripsList } from "../../components/ui";
import { format } from "date-fns";
import { MapPin, Calendar, ChevronRight, Compass } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SavedTripsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [trips, setTrips] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrips = useCallback(async () => {
    try {
      const data = await getUserItineraries();
      setTrips(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTrips();
  }, [loadTrips]);

  const renderItem = ({ item, index }: { item: Itinerary; index: number }) => {
    const gradientColors = [
      [colors.primary, colors.accent],
      [colors.secondary, colors.primary],
      [colors.accent, colors.success],
    ][index % 3] as [string, string];

    return (
      <TouchableOpacity className="mb-5" onPress={() => router.push(`/itinerary/${item.id}`)} activeOpacity={0.9}>
        <Card
          variant="elevated"
          padding="none"
          className="overflow-hidden shadow-sm bg-card"
          style={{ borderWidth: 1, borderColor: colors.cardBorder }}
        >
          {/* Gradient Accent Bar */}
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 8, width: "100%" }}
          />

          <View className="p-5">
            <View className="flex-row justify-between items-start mb-3">
              <View>
                <Text className="text-[20px] font-black text-foreground max-w-[240px] leading-tight" numberOfLines={1}>
                  {item.name || `Trip to ${formatCity(item.cityId)}`}
                </Text>
                <Text className="text-sm font-medium text-muted-foreground mt-1">
                  {item.startDate ? format(new Date(item.startDate), "MMMM d, yyyy") : "Date TBD"}
                </Text>
              </View>
              {
                /* Status Badge - simplified */
                !item.startDate && (
                  <View className="bg-muted px-2 py-1 rounded-md">
                    <Text className="text-[10px] font-bold text-muted-foreground uppercase">Draft</Text>
                  </View>
                )
              }
            </View>

            <View className="h-[1px] my-3" style={{ backgroundColor: colors.border + "40" }} />

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-4">
                <View
                  className="flex-row items-center gap-1.5 bg-muted/30 px-2.5 py-1.5 rounded-lg"
                  style={{ borderWidth: 1, borderColor: colors.border + "20" }}
                >
                  <Calendar size={14} color={colors.primary} />
                  <Text className="text-[13px] font-semibold text-foreground">{item.days?.length || 0} Days</Text>
                </View>
                <View
                  className="flex-row items-center gap-1.5 bg-muted/30 px-2.5 py-1.5 rounded-lg"
                  style={{ borderWidth: 1, borderColor: colors.border + "20" }}
                >
                  <MapPin size={14} color={colors.secondary} />
                  <Text className="text-[13px] font-semibold text-foreground">
                    {item.days?.reduce((acc, day) => acc + (day.activities?.length || 0), 0) || 0} Stops
                  </Text>
                </View>
              </View>

              <View className="w-8 h-8 rounded-full bg-muted/50 items-center justify-center">
                <ChevronRight size={18} color={colors.mutedForeground} />
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-muted/20">
        <SkeletonTripsList count={4} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-muted/20">
      {trips.length === 0 ? (
        <View className="flex-1 justify-center px-10">
          <EmptyState
            icon={<Compass size={48} color={colors.mutedForeground} />}
            title="No trips yet"
            description="Start planning your first adventure! Swipe through vibes and create your perfect itinerary."
            actionLabel="Plan a Trip"
            onAction={() => router.push("/")}
          />
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: TAB_BAR_HEIGHT + 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        />
      )}
    </View>
  );
}

function formatCity(id: string) {
  if (!id) return "";
  return id.charAt(0).toUpperCase() + id.slice(1);
}
