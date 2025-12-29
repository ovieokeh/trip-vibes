import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../components/AuthProvider";
import { Screen, Button } from "../components/ui";
import { Colors } from "../constants/Colors";
import { CitySelect } from "../components/ui/CitySelect";
import { DateRangePicker } from "../components/ui/DateRangePicker";
import { useCreationFlow } from "../store/creation-flow";
import { useState } from "react";
import { MapPin, Calendar } from "lucide-react-native";

export default function Home() {
  const router = useRouter();
  const { user, isAnonymous, loading } = useAuth();
  const colors = Colors.light;

  // Store
  const { cityId, startDate, endDate, setCityId, setDates } = useCreationFlow();

  // Local UI state
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);

  const cityName = cityId ? cityId.charAt(0).toUpperCase() + cityId.slice(1) : "Select Destination"; // Simple capping for now
  const dateRangeText =
    startDate && endDate ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}` : "Select Dates";

  const isSetupComplete = !!cityId && !!startDate && !!endDate;

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={{ color: colors.mutedForeground }}>Loading...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Trip Vibes</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Plan your perfect trip</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.setupSection}>
            <TouchableOpacity style={styles.setupButton} onPress={() => setCityModalVisible(true)}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <MapPin size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.setupLabel, { color: colors.mutedForeground }]}>Destination</Text>
              </View>
              <Text style={[styles.setupValue, { color: colors.foreground }]}>{cityName}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.setupButton} onPress={() => setDateModalVisible(true)}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <Calendar size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.setupLabel, { color: colors.mutedForeground }]}>Dates</Text>
              </View>
              <Text style={[styles.setupValue, { color: colors.foreground }]}>{dateRangeText}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mainAction}>
            <Button
              title={isSetupComplete ? "Find Your Vibe" : "Select City & Dates"}
              onPress={() => router.push("/vibes")}
              fullWidth
              disabled={!isSetupComplete}
              style={[styles.largeButton, !isSetupComplete && { opacity: 0.5 }]}
              textStyle={styles.largeButtonText}
            />
          </View>

          {user && !isAnonymous ? (
            <View style={styles.userSection}>
              <Text style={[styles.welcome, { color: colors.foreground }]}>Welcome back!</Text>
              <Button
                title="Your Saved Trips"
                variant="secondary"
                onPress={() => router.push("/saved-trips")}
                fullWidth
                style={styles.button}
              />
              <Button
                title="Account"
                variant="outline"
                onPress={() => router.push("/account")}
                fullWidth
                style={styles.button}
              />
            </View>
          ) : (
            <View style={styles.authSection}>
              <Text style={[styles.authText, { color: colors.mutedForeground }]}>
                Sign in to save your trips and access more features
              </Text>
              <Button title="Sign In" onPress={() => router.push("/login")} fullWidth style={styles.button} />
            </View>
          )}
        </View>
      </View>

      <CitySelect
        visible={cityModalVisible}
        onClose={() => setCityModalVisible(false)}
        onSelect={(city) => setCityId(city.id)}
        selectedCityId={cityId}
      />

      <DateRangePicker
        visible={dateModalVisible}
        onClose={() => setDateModalVisible(false)}
        onSelect={(start, end) => setDates(start, end)}
        initialStartDate={startDate}
        initialEndDate={endDate}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  setupSection: {
    flex: 1,
    justifyContent: "center", // Center content vertically
    gap: 16,
    marginBottom: 20,
  },
  setupButton: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#f9f9f9",
  },
  setupLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  setupValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  mainAction: {
    marginBottom: 40,
  },
  largeButton: {
    paddingVertical: 16,
    borderRadius: 16,
  },
  largeButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
  userSection: {
    alignItems: "center",
  },
  welcome: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 24,
  },
  authSection: {
    alignItems: "center",
  },
  authText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    marginBottom: 12,
  },
});
