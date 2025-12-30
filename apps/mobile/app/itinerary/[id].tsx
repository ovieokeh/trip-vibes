import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Share, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Itinerary } from "@trip-vibes/shared";
import { getItinerary } from "../../lib/vibe-api";
import { Screen, Button } from "../../components/ui";
import { ItineraryDay } from "../../components/Itinerary/ItineraryDay";
import { useTheme } from "../../components/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin, Calendar, Sparkles, Share2, Bookmark, Home, AlertCircle, TrendingUp } from "lucide-react-native";
import { format } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ItineraryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id || typeof id !== "string") return;

    try {
      const data = await getItinerary(id);
      setItinerary(data);
      setError(null);
    } catch (e) {
      setError("Failed to load itinerary");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const handleShare = async () => {
    if (!itinerary) return;
    try {
      await Share.share({
        message: `Check out my trip to ${itinerary.name}! 🌍✨`,
        title: itinerary.name || `Trip to ${itinerary.name}`,
      });
    } catch (e) {
      console.error("Share error:", e);
    }
  };

  // Dynamic header
  const headerTitle = itinerary ? itinerary.name : "Your Trip";

  if (loading) {
    return (
      <Screen centered>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-base font-semibold text-muted-foreground">Loading Itinerary...</Text>
      </Screen>
    );
  }

  if (error || !itinerary) {
    return (
      <Screen centered padded>
        <View className="w-24 h-24 rounded-full items-center justify-center mb-6 bg-error/15">
          <AlertCircle size={48} color={colors.error} />
        </View>
        <Text className="text-[22px] font-bold mb-2 text-foreground">Couldn't Load Trip</Text>
        <Text className="text-[15px] mb-6 text-center text-muted-foreground">{error || "Itinerary not found"}</Text>
        <Button title="Go Home" onPress={() => router.replace("/")} />
      </Screen>
    );
  }

  const totalActivities = itinerary.days.reduce((acc, day) => acc + day.activities.length, 0);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerTintColor: "#fff",
          headerRight: () => (
            <TouchableOpacity
              onPress={handleShare}
              className="w-9 h-9 rounded-full bg-black/20 items-center justify-center mr-4"
            >
              <Share2 size={20} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="pb-5"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Hero Section */}
        <View className="mb-[60px]">
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="pb-20 px-6 rounded-b-[32px]"
            style={{ paddingTop: insets.top + 20 }}
          >
            <View className="items-center">
              <View className="mb-4">
                <Sparkles size={24} color="rgba(255,255,255,0.6)" />
              </View>
              <Text className="text-[28px] font-black text-white text-center mb-3 tracking-tighter">{headerTitle}</Text>

              <View className="flex-row items-center gap-2 mb-5">
                <View className="flex-row items-center gap-1.5">
                  <MapPin size={14} color="rgba(255,255,255,0.8)" />
                  <Text className="text-white/90 text-sm font-semibold">{itinerary.name}</Text>
                </View>
                <View className="w-1 h-1 rounded-full bg-white/40" />
                <View className="flex-row items-center gap-1.5">
                  <Calendar size={14} color="rgba(255,255,255,0.8)" />
                  <Text className="text-white/90 text-sm font-semibold">{itinerary.days.length} Days</Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                {itinerary.startDate && (
                  <View className="bg-white/20 px-3 py-1.5 rounded-full flex-row items-center gap-1">
                    <Text className="text-white text-[12px] font-bold">
                      {format(new Date(itinerary.startDate), "MMM d")} -{" "}
                      {itinerary.endDate ? format(new Date(itinerary.endDate), "MMM d, yyyy") : ""}
                    </Text>
                  </View>
                )}
                <View className="bg-white/10 px-3 py-1.5 rounded-full flex-row items-center gap-1">
                  <TrendingUp size={12} color="#fff" />
                  <Text className="text-white text-[12px] font-bold">Optimized</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Quick Stats Overlap Card */}
          <View className="absolute -bottom-10 left-6 right-6 h-20 rounded-[20px] flex-row items-center px-3 border border-border shadow-lg bg-card shadow-black/10">
            <View className="flex-1 items-center">
              <Text className="text-[20px] font-black text-foreground">{itinerary.days.length}</Text>
              <Text className="text-[10px] font-bold tracking-widest mt-0.5 text-muted-foreground">DAYS</Text>
            </View>
            <View className="w-[1px] h-[30px] opacity-50 bg-border" />
            <View className="flex-1 items-center">
              <Text className="text-[20px] font-black text-foreground">{totalActivities}</Text>
              <Text className="text-[10px] font-bold tracking-widest mt-0.5 text-muted-foreground">STOPS</Text>
            </View>
            <View className="w-[1px] h-[30px] opacity-50 bg-border" />
            <View className="flex-1 items-center">
              <Text className="text-[20px] font-black text-foreground" numberOfLines={1}>
                {itinerary.name}
              </Text>
              <Text className="text-[10px] font-bold tracking-widest mt-0.5 text-muted-foreground">DEST</Text>
            </View>
          </View>
        </View>

        {/* Days List */}
        <View className="px-4 mt-5">
          {itinerary.days.map((day) => (
            <ItineraryDay key={day.id} day={day} />
          ))}
        </View>

        {/* Footer Actions */}
        <View className="px-6 pt-8 items-center">
          <Button
            title="Explore Saved Trips"
            onPress={() => router.push("/saved-trips")}
            variant="outline"
            leftIcon={<Bookmark size={18} color={colors.primary} />}
            fullWidth
            className="mb-4"
          />
          <Button
            title="Back Home"
            onPress={() => router.push("/")}
            variant="ghost"
            leftIcon={<Home size={18} color={colors.primary} />}
            fullWidth
          />
        </View>

        <View className="h-[60px]" />
      </ScrollView>
    </>
  );
}
