import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Share,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ActionSheetIOS,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Itinerary } from "@trip-vibes/shared";
import { getItinerary, saveItinerary, updateItinerary, deleteItinerary } from "../../lib/vibe-api";
import { API_URL, WEB_URL } from "../../lib/api";
import { Screen, Button, SkeletonItineraryPage } from "../../components/ui";
import { ItineraryDay } from "../../components/Itinerary/ItineraryDay";
import { useTheme } from "../../components/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import {
  MapPin,
  Calendar,
  Sparkles,
  Share2,
  Bookmark,
  Home,
  AlertCircle,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react-native";
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
  const [saving, setSaving] = useState(false);

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
      const shareUrl = `${WEB_URL}/saved/${itinerary.id}`;
      await Share.share({
        message: `Check out my trip to ${itinerary.name}! 🌍✨\n${shareUrl}`,
        url: shareUrl, // iOS uses this key to show a preview if possible
        title: itinerary.name || `Trip to ${itinerary.name}`,
      });
    } catch (e) {
      console.error("Share error:", e);
    }
  };

  const handleSave = async () => {
    if (!itinerary) return;
    setSaving(true);
    try {
      await saveItinerary(itinerary.id, itinerary.name);
      setItinerary({ ...itinerary, isSaved: true });
      // Redirect to saved trips page
      router.replace("/saved-trips");
    } catch (e) {
      Alert.alert("Error", "Failed to save trip. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRename = useCallback(() => {
    if (!itinerary) return;
    if (Platform.OS === "ios") {
      Alert.prompt(
        "Rename Trip",
        "Enter a new name for your trip",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Save",
            onPress: async (name) => {
              if (!name || !itinerary) return;
              try {
                await updateItinerary(itinerary.id, { name });
                setItinerary({ ...itinerary, name });
              } catch (e) {
                Alert.alert("Error", "Failed to rename trip");
              }
            },
          },
        ],
        "plain-text",
        itinerary.name
      );
    } else {
      Alert.alert("Not Supported", "Renaming is currently only supported on iOS.");
    }
  }, [itinerary]);

  const handleDelete = useCallback(() => {
    if (!itinerary) return;
    Alert.alert("Delete Trip", "Are you sure you want to delete this trip? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteItinerary(itinerary.id);
            router.replace("/saved-trips");
          } catch (e) {
            Alert.alert("Error", "Failed to delete trip");
          }
        },
      },
    ]);
  }, [itinerary, router]);

  const handleDownloadPDF = useCallback(() => {
    if (!itinerary) return;
    Linking.openURL(`${API_URL}/api/itinerary/${itinerary.id}/pdf`);
  }, [itinerary]);

  const handleSyncCalendar = useCallback(() => {
    if (!itinerary) return;
    Linking.openURL(`${API_URL}/api/itinerary/${itinerary.id}/calendar`);
  }, [itinerary]);

  const handleMenu = useCallback(() => {
    const options = ["Cancel", "Rename", "Download PDF", "Sync to Calendar", "Share", "Delete"];
    const destructiveButtonIndex = 5;
    const cancelButtonIndex = 0;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 1:
              handleRename();
              break;
            case 2:
              handleDownloadPDF();
              break;
            case 3:
              handleSyncCalendar();
              break;
            case 4:
              handleShare();
              break;
            case 5:
              handleDelete();
              break;
          }
        }
      );
    } else {
      // Fallback for Android - Shows basic Alert with options
      Alert.alert("Options", "Choose an action", [
        { text: "Rename", onPress: handleRename },
        { text: "Share", onPress: handleShare },
        { text: "Delete", onPress: handleDelete, style: "destructive" },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }, [handleRename, handleDownloadPDF, handleSyncCalendar, handleShare, handleDelete]);

  // Dynamic header
  const headerTitle = itinerary ? itinerary.name : "Your Trip";

  if (loading) {
    return <SkeletonItineraryPage />;
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
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      scrollable
      safeArea={false}
      padded={false}
    >
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerTintColor: "#fff",
          headerRight: () => (
            <View className="flex-row items-center gap-3 mr-4">
              {itinerary && !itinerary.isSaved && (
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  className="w-9 h-9 rounded-full bg-primary items-center justify-center shadow-sm"
                >
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Bookmark size={18} color="#fff" />}
                </TouchableOpacity>
              )}
              {itinerary && itinerary.isSaved && (
                <TouchableOpacity
                  onPress={handleMenu}
                  className="w-9 h-9 rounded-full bg-black/20 items-center justify-center"
                >
                  <MoreHorizontal size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />
      {/* Hero Section */}
      <View className="mb-[60px]">
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="pb-20 px-6 rounded-b-[32px]"
          style={{ paddingTop: insets.top + 60 }}
        >
          <View className="items-center">
            <View className="mb-4">
              <Sparkles size={24} color="rgba(255,255,255,0.6)" />
            </View>
            <Text className="text-[28px] font-black text-white text-center mb-8 tracking-tighter">Your itinerary</Text>

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
        <View
          className="absolute -bottom-10 left-6 right-6 h-20 rounded-[20px] flex-row items-center px-3 shadow-xl bg-card shadow-black/5"
          style={{ borderWidth: 1, borderColor: colors.cardBorder }}
        >
          <View className="flex-1 items-center">
            <Text className="text-[20px] font-black text-foreground" numberOfLines={1}>
              {itinerary.name}
            </Text>
            <Text className="text-[10px] font-bold tracking-widest mt-0.5 text-muted-foreground">DEST</Text>
          </View>
          <View className="w-[1px] h-[30px] opacity-50 bg-border" />
          <View className="flex-1 items-center">
            <Text className="text-[20px] font-black text-foreground">{itinerary.days.length}</Text>
            <Text className="text-[10px] font-bold tracking-widest mt-0.5 text-muted-foreground">DAYS</Text>
          </View>
          <View className="w-[1px] h-[30px] opacity-50 bg-border" />
          <View className="flex-1 items-center">
            <Text className="text-[20px] font-black text-foreground">{totalActivities}</Text>
            <Text className="text-[10px] font-bold tracking-widest mt-0.5 text-muted-foreground">STOPS</Text>
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
    </Screen>
  );
}
