import React from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { Screen } from "../components/ui";
import { Colors } from "../constants/Colors";

export default function TermsScreen() {
  const colors = Colors.light;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>Terms of Service</Text>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>Last updated: December 2024</Text>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.foreground }]}>1. Agreement to Terms</Text>
          <Text style={[styles.text, { color: colors.foreground }]}>
            By accessing our mobile application, you agree to be bound by these Terms of Service and all applicable laws
            and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing
            this site.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.foreground }]}>2. Use License</Text>
          <Text style={[styles.text, { color: colors.foreground }]}>
            Permission is granted to temporarily download one copy of the materials (information or software) on
            TripVibes' website for personal, non-commercial transitory viewing only.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.foreground }]}>3. Disclaimer</Text>
          <Text style={[styles.text, { color: colors.foreground }]}>
            The materials on TripVibes' website are provided on an 'as is' basis. TripVibes makes no warranties,
            expressed or implied, and hereby disclaims and negates all other warranties including, without limitation,
            implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement
            of intellectual property or other violation of rights.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.foreground }]}>4. Limitations</Text>
          <Text style={[styles.text, { color: colors.foreground }]}>
            In no event shall TripVibes or its suppliers be liable for any damages (including, without limitation,
            damages for loss of data or profit, or due to business interruption) arising out of the use or inability to
            use the materials on TripVibes' website.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
});
