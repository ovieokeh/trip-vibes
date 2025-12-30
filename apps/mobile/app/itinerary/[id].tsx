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
  Dimensions,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Itinerary } from "@trip-vibes/shared";
import { getItinerary } from "../../lib/vibe-api";
import { Screen, Button, Badge, Card } from "../../components/ui";
import { ItineraryDay } from "../../components/Itinerary/ItineraryDay";
import { useTheme } from "../../components/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin, Calendar, Sparkles, Share2, Bookmark, Home, AlertCircle, TrendingUp } from "lucide-react-native";
import { format } from "date-fns";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerTintColor: "#fff",
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} style={styles.headerIconButton}>
              <Share2 size={20} color="#fff" />
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
        <View style={styles.heroWrapper}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <SafeAreaSpacer />
            <View style={styles.heroContent}>
              <View style={styles.sparkleContainer}>
                <Sparkles size={24} color="rgba(255,255,255,0.6)" />
              </View>
              <Text style={styles.heroTitle}>{headerTitle}</Text>

              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatItem}>
                  <MapPin size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.heroStatText}>{itinerary.name}</Text>
                </View>
                <View style={styles.bullet} />
                <View style={styles.heroStatItem}>
                  <Calendar size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.heroStatText}>{itinerary.days.length} Days</Text>
                </View>
              </View>

              <View style={styles.chipRow}>
                {itinerary.startDate && (
                  <View style={styles.dateChip}>
                    <Text style={styles.dateChipText}>
                      {format(new Date(itinerary.startDate), "MMM d")} -{" "}
                      {itinerary.endDate ? format(new Date(itinerary.endDate), "MMM d, yyyy") : ""}
                    </Text>
                  </View>
                )}
                <View style={[styles.dateChip, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                  <TrendingUp size={12} color="#fff" />
                  <Text style={styles.dateChipText}>Optimized</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Quick Stats Overlap Card */}
          <View style={[styles.statsOverlap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{itinerary.days.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>DAYS</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{totalActivities}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>STOPS</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{itinerary.name}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>DEST</Text>
            </View>
          </View>
        </View>

        {/* Days List */}
        <View style={styles.daysSection}>
          {itinerary.days.map((day) => (
            <ItineraryDay key={day.id} day={day} />
          ))}
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <Button
            title="Explore Saved Trips"
            onPress={() => router.push("/saved-trips")}
            variant="outline"
            leftIcon={<Bookmark size={18} color={colors.primary} />}
            fullWidth
            style={styles.footerButton}
          />
          <Button
            title="Back Home"
            onPress={() => router.push("/")}
            variant="ghost"
            leftIcon={<Home size={18} color={colors.primary} />}
            fullWidth
          />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </>
  );
}

function SafeAreaSpacer() {
  return <View style={{ height: Platform.OS === "ios" ? 60 : 40 }} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  heroWrapper: {
    marginBottom: 60,
  },
  heroGradient: {
    paddingBottom: 80,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroContent: {
    alignItems: "center",
  },
  sparkleContainer: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  heroStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroStatText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "600",
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  dateChip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateChipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  statsOverlap: {
    position: "absolute",
    bottom: -40,
    left: 24,
    right: 24,
    height: 80,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    opacity: 0.5,
  },
  daysSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 20,
    paddingHorizontal: 16,
    letterSpacing: -0.5,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: "center",
  },
  footerButton: {
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
  },
});
