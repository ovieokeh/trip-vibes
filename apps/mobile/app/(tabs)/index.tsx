import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../components/AuthProvider";
import { useTheme } from "../../components/ThemeProvider";
import { Button, Card, Badge } from "../../components/ui";
import { CitySelect } from "../../components/ui/CitySelect";
import { DateRangePicker } from "../../components/ui/DateRangePicker";
import { useCreationFlow } from "../../store/creation-flow";
import { useState } from "react";
import { MapPin, Calendar, Sparkles, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function Home() {
  const router = useRouter();
  const { user, isAnonymous, loading } = useAuth();
  const { colors, theme } = useTheme();

  // Store
  const { city, startDate, endDate, setCity, setDates } = useCreationFlow();

  // Local UI state
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);

  const dateRangeText =
    startDate && endDate
      ? `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : null;

  const isSetupComplete = !!city && !!startDate && !!endDate;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Plan Your{"\n"}Perfect Trip</Text>
            <Text style={styles.heroSubtitle}>Swipe through vibes, get a personalized itinerary</Text>
          </View>
          <Sparkles size={48} color="rgba(255,255,255,0.3)" style={styles.heroIcon} />
        </View>
      </LinearGradient>

      {/* Setup Section */}
      <View style={styles.setupSection}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Start Planning</Text>

        {/* Destination Card */}
        <Card
          variant="outlined"
          padding="lg"
          pressable
          onPress={() => setCityModalVisible(true)}
          style={styles.setupCard}
        >
          <View style={styles.setupCardContent}>
            <View style={styles.setupCardLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
                <MapPin size={20} color={colors.primary} />
              </View>
              <View style={styles.setupCardText}>
                <Text style={[styles.setupLabel, { color: colors.mutedForeground }]}>Destination</Text>
                <Text style={[styles.setupValue, { color: colors.foreground }]}>{city?.name || "Where to?"}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.mutedForeground} />
          </View>
        </Card>

        {/* Dates Card */}
        <Card
          variant="outlined"
          padding="lg"
          pressable
          onPress={() => setDateModalVisible(true)}
          style={styles.setupCard}
        >
          <View style={styles.setupCardContent}>
            <View style={styles.setupCardLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.secondary + "15" }]}>
                <Calendar size={20} color={colors.secondary} />
              </View>
              <View style={styles.setupCardText}>
                <Text style={[styles.setupLabel, { color: colors.mutedForeground }]}>Travel Dates</Text>
                <Text style={[styles.setupValue, { color: colors.foreground }]}>{dateRangeText || "When?"}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.mutedForeground} />
          </View>
        </Card>

        {/* CTA Button */}
        <Button
          title={isSetupComplete ? "Find Your Vibe" : "Select Destination & Dates"}
          onPress={() => router.push("/vibes")}
          fullWidth
          disabled={!isSetupComplete}
          size="lg"
          leftIcon={isSetupComplete ? <Sparkles size={20} color={colors.primaryForeground} /> : undefined}
          style={[styles.ctaButton, { opacity: isSetupComplete ? 1 : 0.5 }]}
        />
      </View>

      {/* User Section */}
      {!user || isAnonymous ? (
        <View style={styles.authSection}>
          <Card variant="filled" padding="lg">
            <Text style={[styles.authTitle, { color: colors.foreground }]}>Save Your Trips</Text>
            <Text style={[styles.authText, { color: colors.mutedForeground }]}>
              Sign in to save your itineraries and access them anywhere
            </Text>
            <Button title="Sign In" variant="outline" onPress={() => router.push("/login")} style={{ marginTop: 16 }} />
          </Card>
        </View>
      ) : (
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          <TouchableOpacity
            style={[styles.quickActionItem, { borderColor: colors.border }]}
            onPress={() => router.push("/saved-trips")}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionContent}>
              <Text style={[styles.quickActionLabel, { color: colors.foreground }]}>View Saved Trips</Text>
              <Badge label="New" variant="primary" size="sm" />
            </View>
            <ChevronRight size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Padding for Tab Bar */}
      <View style={{ height: 100 }} />

      {/* Modals */}
      <CitySelect
        visible={cityModalVisible}
        onClose={() => setCityModalVisible(false)}
        onSelect={(city) => setCity(city)}
        selectedCityId={city?.id}
      />

      <DateRangePicker
        visible={dateModalVisible}
        onClose={() => setDateModalVisible(false)}
        onSelect={(start, end) => setDates(start, end)}
        initialStartDate={startDate}
        initialEndDate={endDate}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  heroGradient: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 24,
    overflow: "hidden",
  },
  heroContent: {
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
  },
  heroIcon: {
    marginLeft: 16,
  },
  setupSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  setupCard: {
    marginBottom: 12,
  },
  setupCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  setupCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  setupCardText: {
    flex: 1,
  },
  setupLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  setupValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  ctaButton: {
    marginTop: 8,
  },
  authSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  authTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  authText: {
    fontSize: 14,
    lineHeight: 20,
  },
  quickActions: {
    paddingHorizontal: 20,
  },
  quickActionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  quickActionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quickActionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
});
