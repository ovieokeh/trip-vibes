import React, { useState } from "react";
import { View, Text, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Input, Button } from "../../components/ui";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../components/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import { KeyRound } from "lucide-react-native";

export default function ForgotPassword() {
  const router = useRouter();
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "trip-vibes://account/reset-password",
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
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-background">
      <Screen centered padded>
        <View className="w-full max-w-[400px] items-center">
          <View className="mb-8 items-center">
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-16 h-16 rounded-full items-center justify-center mb-5"
            >
              <KeyRound size={28} color="#fff" />
            </LinearGradient>
            <Text className="text-[28px] font-bold mb-2 text-foreground">Reset Password</Text>
            <Text className="text-[15px] text-center leading-[22px] text-muted-foreground">
              Enter your email to receive reset instructions
            </Text>
          </View>

          <View className="w-full gap-4">
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="hello@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <Button
              title="Send Instructions"
              onPress={handleResetPassword}
              loading={loading}
              fullWidth
              size="lg"
              className="mt-2"
            />

            <Button title="Back to Login" onPress={() => router.back()} variant="ghost" className="mt-2" />
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
