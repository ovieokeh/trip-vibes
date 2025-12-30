import React from "react";
import { Text, View } from "react-native";
import { Screen } from "../components/ui";
import { useTheme } from "../components/ThemeProvider";

export default function PrivacyScreen() {
  const { colors } = useTheme();

  return (
    <Screen scrollable safeArea={false} padded contentContainerClassName="py-6 pb-10">
      <Text className="text-[32px] font-bold mb-2 text-foreground">Privacy Policy</Text>
      <Text className="text-[14px] mb-8 text-muted-foreground">Last updated: December 2024</Text>

      <View className="mb-6">
        <Text className="text-[20px] font-semibold mb-3 text-foreground">1. Introduction</Text>
        <Text className="text-[16px] leading-6 text-foreground">
          Welcome to TripVibes. We respect your privacy and are committed to protecting your personal data. This privacy
          policy will inform you as to how we look after your personal data when you visit our website or use our mobile
          application and tell you about your privacy rights.
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-[20px] font-semibold mb-3 text-foreground">2. Data We Collect</Text>
        <Text className="text-[16px] leading-6 text-foreground">
          We may collect, use, store and transfer different kinds of personal data about you which we have grouped
          together follows:
          {"\n\n"}• Identity Data: includes first name, last name, username or similar identifier.
          {"\n"}• Contact Data: includes email address.
          {"\n"}• Usage Data: includes information about how you use our website, products and services (e.g. liked
          vibes, itineraries created).
          {"\n"}• Technical Data: includes internet protocol (IP) address, your login data, browser type and version.
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-[20px] font-semibold mb-3 text-foreground">3. How We Use Your Data</Text>
        <Text className="text-[16px] leading-6 text-foreground">
          We will only use your personal data when the law allows us to. Most commonly, we will use your personal data
          in the following circumstances:
          {"\n\n"}• Where we need to provide the service you requested (generating itineraries).
          {"\n"}• Where it is necessary for our legitimate interests (for example, to improve our app).
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-[20px] font-semibold mb-3 text-foreground">4. Data Security</Text>
        <Text className="text-[16px] leading-6 text-foreground">
          We have put in place appropriate security measures to prevent your personal data from being accidentally lost,
          used or accessed in an unauthorized way, altered or disclosed.
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-[12px] text-muted-foreground">
          For any questions, please contact support@tripvibes.com
        </Text>
      </View>
    </Screen>
  );
}
