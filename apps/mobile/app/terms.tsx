import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Screen } from "../components/ui";
import { useTheme } from "../components/ThemeProvider";

export default function TermsScreen() {
  const { colors } = useTheme();

  return (
    <Screen>
      <ScrollView contentContainerClassName="p-6 pb-10">
        <Text className="text-[32px] font-bold mb-2 text-foreground">Terms of Service</Text>
        <Text className="text-[14px] mb-8 text-muted-foreground">Last updated: December 2024</Text>

        <View className="mb-6">
          <Text className="text-[20px] font-semibold mb-3 text-foreground">1. Agreement to Terms</Text>
          <Text className="text-[16px] leading-6 text-foreground">
            By accessing our mobile application, you agree to be bound by these Terms of Service and all applicable laws
            and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing
            this site.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-[20px] font-semibold mb-3 text-foreground">2. Use License</Text>
          <Text className="text-[16px] leading-6 text-foreground">
            Permission is granted to temporarily download one copy of the materials (information or software) on
            TripVibes' website for personal, non-commercial transitory viewing only.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-[20px] font-semibold mb-3 text-foreground">3. Disclaimer</Text>
          <Text className="text-[16px] leading-6 text-foreground">
            The materials on TripVibes' website are provided on an 'as is' basis. TripVibes makes no warranties,
            expressed or implied, and hereby disclaims and negates all other warranties including, without limitation,
            implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement
            of intellectual property or other violation of rights.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-[20px] font-semibold mb-3 text-foreground">4. Limitations</Text>
          <Text className="text-[16px] leading-6 text-foreground">
            In no event shall TripVibes or its suppliers be liable for any damages (including, without limitation,
            damages for loss of data or profit, or due to business interruption) arising out of the use or inability to
            use the materials on TripVibes' website.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
