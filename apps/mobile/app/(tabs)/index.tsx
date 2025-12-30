import { View, Text, TouchableOpacity, ScrollView } from "react-native";
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
  const { colors } = useTheme();

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
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-5" showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="mx-5 mt-2 mb-6 rounded-3xl overflow-hidden"
      >
        <View className="p-6 flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-[28px] font-bold text-white mb-2 leading-[34px]">Plan Your{"\n"}Perfect Trip</Text>
            <Text className="text-sm text-white/80 leading-[20px]">
              Swipe through vibes, get a personalized itinerary
            </Text>
          </View>
          <Sparkles size={48} color="rgba(255,255,255,0.3)" className="ml-4" />
        </View>
      </LinearGradient>

      {/* Setup Section */}
      <View className="px-5 mb-6">
        <Text className="text-xl font-bold mb-4 text-foreground">Start Planning</Text>

        {/* Destination Card */}
        <Card variant="outlined" padding="lg" pressable onPress={() => setCityModalVisible(true)} className="mb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-11 h-11 rounded-full items-center justify-center mr-3.5 bg-primary/15">
                <MapPin size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-[12px] font-semibold uppercase tracking-wider mb-1 text-muted-foreground">
                  Destination
                </Text>
                <Text className="text-base font-medium text-foreground">{city?.name || "Where to?"}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.mutedForeground} />
          </View>
        </Card>

        {/* Dates Card */}
        <Card variant="outlined" padding="lg" pressable onPress={() => setDateModalVisible(true)} className="mb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-11 h-11 rounded-full items-center justify-center mr-3.5 bg-secondary/15">
                <Calendar size={20} color={colors.secondary} />
              </View>
              <View className="flex-1">
                <Text className="text-[12px] font-semibold uppercase tracking-wider mb-1 text-muted-foreground">
                  Travel Dates
                </Text>
                <Text className="text-base font-medium text-foreground">{dateRangeText || "When?"}</Text>
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
          className={`mt-2 ${isSetupComplete ? "" : "opacity-50"}`}
        />
      </View>

      {/* User Section */}
      {!user || isAnonymous ? (
        <View className="px-5 mb-6">
          <Card variant="filled" padding="lg">
            <Text className="text-[18px] font-bold mb-2 text-foreground">Save Your Trips</Text>
            <Text className="text-sm leading-5 text-muted-foreground">
              Sign in to save your itineraries and access them anywhere
            </Text>
            <Button title="Sign In" variant="outline" onPress={() => router.push("/login")} className="mt-4" />
          </Card>
        </View>
      ) : (
        <View className="px-5">
          <Text className="text-xl font-bold mb-4 text-foreground">Quick Actions</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between py-4 border-b border-border"
            onPress={() => router.push("/saved-trips")}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-medium text-foreground">View Saved Trips</Text>
              <Badge label="New" variant="primary" size="sm" />
            </View>
            <ChevronRight size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Padding for Tab Bar */}
      <View className="h-[100px]" />

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
