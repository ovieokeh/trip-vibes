import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useAuth } from "../../components/AuthProvider";
import { useTheme } from "../../components/ThemeProvider";
import { Card, Screen, TabBarSpacer, GradientButton } from "../../components/ui";
import { CitySelect } from "../../components/ui/CitySelect";
import { DateRangePicker } from "../../components/ui/DateRangePicker";
import { BudgetSelect } from "../../components/ui/BudgetSelect";
import { useCreationFlow } from "../../store/creation-flow";
import { useState } from "react";
import { MapPin, Calendar, Sparkles, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function Home() {
  const router = useRouter();
  const { user, isAnonymous, loading } = useAuth();
  const { colors } = useTheme();

  // Store
  const { city, startDate, endDate, budget, setCity, setDates, setBudget } = useCreationFlow();

  // Local UI state
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);

  // Import extra icons for decoration
  // Note: We need to ensure these are imported at the top
  // I will assume I can't easily change the imports here without a separate call or a very large replacement.
  // Actually, I can just use the existing imports and add new ones if I replace the whole file content or a large chunk.
  // Let's stick to the plan. I'll replace the return statement and state hooks.

  const dateRangeText =
    startDate && endDate
      ? `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : null;

  const isSetupComplete = !!city && !!startDate && !!endDate && !!budget;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Loading...</Text>
      </View>
    );
  }

  return (
    <Screen scrollable safeArea={false} padded={false} contentContainerClassName="py-12">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="px-6 pt-16 pb-8 z-10">
        {/* Hero Section */}
        <View className="items-center mb-10">
          <Text className="text-4xl md:text-5xl font-black text-center text-foreground leading-[1.1] mb-2">
            Don't Plan.
          </Text>
          <Text className="text-4xl md:text-5xl font-black text-center text-primary leading-[1.1]">Just Vibe.</Text>
          <Text className="text-base text-center text-muted-foreground mt-4 max-w-[280px] leading-6">
            Swipe through curated cards. We'll build a smart, location-aware itinerary based on your taste.
          </Text>
        </View>

        {/* Setup Form */}
        <View className="gap-6">
          {/* Destination */}
          <View>
            <Text className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-1 opacity-80">
              Destination
            </Text>
            <Card variant="outlined" padding="md" pressable onPress={() => setCityModalVisible(true)}>
              <View className="flex-row items-center justify-between py-1">
                <View className="flex-row items-center flex-1">
                  {city ? (
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-primary/15">
                      <MapPin size={18} color={colors.primary} />
                    </View>
                  ) : (
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-muted">
                      <MapPin size={18} color={colors.mutedForeground} />
                    </View>
                  )}

                  <View className="flex-1">
                    <Text className={`text-lg font-medium ${city ? "text-foreground" : "text-muted-foreground"}`}>
                      {city?.name || "Select a city..."}
                    </Text>
                    {city && <Text className="text-xs text-muted-foreground">{city.country}</Text>}
                  </View>
                </View>
                <ChevronRight size={20} color={colors.mutedForeground} />
              </View>
            </Card>
          </View>

          {/* Dates */}
          <View>
            <Text className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-1 opacity-80">
              Dates
            </Text>
            <Card variant="outlined" padding="md" pressable onPress={() => setDateModalVisible(true)}>
              <View className="flex-row items-center justify-between py-1">
                <View className="flex-row items-center flex-1">
                  {startDate && endDate ? (
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-secondary/15">
                      <Calendar size={18} color={colors.secondary} />
                    </View>
                  ) : (
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-muted">
                      <Calendar size={18} color={colors.mutedForeground} />
                    </View>
                  )}

                  <View className="flex-1">
                    <Text
                      className={`text-lg font-medium ${dateRangeText ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {dateRangeText || "When are you going?"}
                    </Text>
                    {dateRangeText && <Text className="text-xs text-muted-foreground">Select dates</Text>}
                  </View>
                </View>
                <ChevronRight size={20} color={colors.mutedForeground} />
              </View>
            </Card>
          </View>

          {/* Budget */}
          <View>
            <Text className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-1 opacity-80">
              Budget
            </Text>
            <BudgetSelect value={budget} onChange={setBudget} />
          </View>

          {/* CTA Button */}
          <GradientButton
            title={isSetupComplete ? "Find Your Vibe" : "Complete setup above"}
            gradient="primary"
            onPress={() => router.push("/vibes")}
            fullWidth
            disabled={!isSetupComplete}
            size="lg"
            leftIcon={isSetupComplete ? <Sparkles size={20} color="#fff" /> : undefined}
            className={`mt-4 shadow-lg ${isSetupComplete ? "shadow-primary/30" : "opacity-50"}`}
          />
        </View>
      </View>

      {/* Bottom Padding for Tab Bar */}
      <TabBarSpacer />

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
    </Screen>
  );
}
