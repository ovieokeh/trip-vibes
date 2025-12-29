import React from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { Screen } from "../components/ui";
import { Colors } from "../constants/Colors";

export default function PrivacyScreen() {
  const colors = Colors.light;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>Privacy Policy</Text>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>Last updated: December 2024</Text>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.foreground }]}>1. Introduction</Text>
          <Text style={[styles.text, { color: colors.foreground }]}>
            Welcome to TripVibes. We respect your privacy and are committed to protecting your personal data. This
            privacy policy will inform you as to how we look after your personal data when you visit our website or use
            our mobile application and tell you about your privacy rights.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.foreground }]}>2. Data We Collect</Text>
          <Text style={[styles.text, { color: colors.foreground }]}>
            We may collect, use, store and transfer different kinds of personal data about you which we have grouped
            together follows:
            {"\n\n"}• Identity Data: includes first name, last name, username or similar identifier.
            {"\n"}• Contact Data: includes email address.
            {"\n"}• Usage Data: includes information about how you use our website, products and services (e.g. liked
            vibes, itineraries created).
            {"\n"}• Technical Data: includes internet protocol (IP) address, your login data, browser type and version.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.foreground }]}>3. How We Use Your Data</Text>
          <Text style={[styles.text, { color: colors.foreground }]}>
            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data
            in the following circumstances:
            {"\n\n"}• Where we need to provide the service you requested (generating itineraries).
            {"\n"}• Where it is necessary for our legitimate interests (for example, to improve our app).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.foreground }]}>4. Data Security</Text>
          <Text style={[styles.text, { color: colors.foreground }]}>
            We have put in place appropriate security measures to prevent your personal data from being accidentally
            lost, used or accessed in an unauthorized way, altered or disclosed.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.text, { color: colors.mutedForeground, fontSize: 12 }]}>
            For any questions, please contact support@tripvibes.com
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
