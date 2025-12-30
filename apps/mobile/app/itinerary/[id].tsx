import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Share,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Itinerary } from "@trip-vibes/shared";
import { getItinerary } from "../../lib/vibe-api";
import { Screen, Button, Badge, Card } from "../../components/ui";
import { ItineraryDay } from "../../components/Itinerary/ItineraryDay";
import { useTheme } from "../../components/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin, Calendar, Sparkles, Share2, Bookmark, Home, AlertCircle } from "lucide-react-native";
import { format } from "date-fns";

export default function ItineraryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, theme } = useTheme();

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
        message: `Check out my trip to ${formatCity(itinerary.cityId)}! 🌍✨`,
        title: itinerary.name || `Trip to ${formatCity(itinerary.cityId)}`,
      });
    } catch (e) {
      console.error("Share error:", e);
    }
  };

  // Dynamic header
  const headerTitle = itinerary ? itinerary.name || `Trip to ${formatCity(itinerary.cityId)}` : "Your Trip";

  if (loading) {
    return (
      <Screen centered>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading Itinerary...</Text>
      </Screen>
    );
  }

  if (error || !itinerary) {
    return (
      <Screen centered padded>
        <View style={[styles.errorIconBg, { backgroundColor: colors.error + "15" }]}>
          <AlertCircle size={48} color={colors.error} />
        </View>
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>Couldn't Load Trip</Text>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{error || "Itinerary not found"}</Text>
        <Button title="Go Home" onPress={() => router.replace("/")} />
      </Screen>
    );
  }

  const totalActivities = itinerary.days.reduce((acc, day) => acc + day.activities.length, 0);

  return (
    <>
      {/* Dynamic header with share button */}
      <Stack.Screen
        options={{
          title: headerTitle,
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} style={{ padding: 8 }}>
              <Share2 size={22} color={colors.foreground} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <Sparkles size={32} color="rgba(255,255,255,0.3)" style={styles.heroIcon} />
          <Text style={styles.heroTitle}>{itinerary.name || `Trip to ${formatCity(itinerary.cityId)}`}</Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <MapPin size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroStatText}>{formatCity(itinerary.cityId)}</Text>
            </View>
            <View style={styles.heroStat}>
              <Calendar size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroStatText}>{itinerary.days.length} Days</Text>
            </View>
          </View>
          {itinerary.startDate && (
            <Badge
              label={format(new Date(itinerary.startDate), "MMM d, yyyy")}
              variant="muted"
              size="sm"
              style={{ marginTop: 12, backgroundColor: "rgba(255,255,255,0.2)" }}
              textStyle={{ color: "#fff" }}
            />
          )}
        </LinearGradient>

        {/* Quick Stats Card */}
        <Card variant="outlined" padding="md" style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{itinerary.days.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Days</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.secondary }]}>{totalActivities}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Activities</Text>
            </View>
          </View>
        </Card>

        {/* Days List */}
        <View style={styles.daysSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Itinerary</Text>
          {itinerary.days.map((day) => (
            <ItineraryDay key={day.id} day={day} />
          ))}
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <Button
            title="View Saved Trips"
            onPress={() => router.push("/saved-trips")}
            variant="outline"
            leftIcon={<Bookmark size={18} color={colors.primary} />}
            fullWidth
            style={{ marginBottom: 12 }}
          />
          <Button
            title="Back Home"
            onPress={() => router.push("/")}
            variant="ghost"
            leftIcon={<Home size={18} color={colors.primary} />}
          />
        </View>

        {/* Bottom spacing for safe area */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

function formatCity(id: string) {
  if (!id) return "";
  return id.charAt(0).toUpperCase() + id.slice(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
  errorIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    marginBottom: 24,
    textAlign: "center",
  },
  heroGradient: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  heroIcon: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  heroStats: {
    flexDirection: "row",
    gap: 24,
  },
  heroStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroStatText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "500",
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  daysSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: "center",
  },
});
