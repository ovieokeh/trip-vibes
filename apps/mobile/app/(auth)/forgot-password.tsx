import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Input, Button } from "../../components/ui";
import { supabase } from "../../lib/supabase";
import { Colors } from "../../constants/Colors";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const colors = Colors.light;

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "trip-vibes://account/reset-password", // Deep link to app
    });
    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Check your email", "We've sent you a password reset link.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  };

  return (
    <Screen centered padded>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Reset Password</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Enter your email to receive reset instructions
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="hello@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Button title="Send Instructions" onPress={handleResetPassword} loading={loading} style={styles.button} />

        <Button title="Back to Login" onPress={() => router.back()} variant="ghost" style={styles.backButton} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  form: {
    width: "100%",
    maxWidth: 400,
    gap: 16,
  },
  button: {
    marginTop: 8,
  },
  backButton: {
    marginTop: 8,
  },
});
