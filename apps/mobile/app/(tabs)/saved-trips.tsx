import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { getUserItineraries } from "../../lib/vibe-api";
import { Itinerary } from "@trip-vibes/shared";
import { useTheme } from "../../components/ThemeProvider";
import { Card, Badge, EmptyState, TAB_BAR_HEIGHT } from "../../components/ui";
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

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

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
      <TouchableOpacity className="mb-4" onPress={() => router.push(`/itinerary/${item.id}`)} activeOpacity={0.7}>
        <Card variant="elevated" padding="none" className="overflow-hidden">
          {/* Gradient Accent Bar */}
          <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="h-1" />

          <View className="p-4 gap-2">
            <Text className="text-[12px] text-muted-foreground">
              {item.startDate ? format(new Date(item.startDate), "MMM d, yyyy") : "Draft"}
            </Text>

            <Text className="text-[18px] font-bold mb-3 text-foreground">
              {item.name || `Trip to ${formatCity(item.cityId)}`}
            </Text>

            <View className="flex-row items-center gap-4">
              <View className="flex-row items-center gap-1">
                <Calendar size={14} color={colors.mutedForeground} />
                <Text className="text-[13px] text-muted-foreground">{item.days?.length || 0} Days</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <MapPin size={14} color={colors.mutedForeground} />
                <Text className="text-[13px] text-muted-foreground">
                  {item.days?.reduce((acc, day) => acc + (day.activities?.length || 0), 0) || 0} Activities
                </Text>
              </View>
              <ChevronRight size={20} color={colors.mutedForeground} className="ml-auto" />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
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
