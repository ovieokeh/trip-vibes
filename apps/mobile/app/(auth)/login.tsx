import React, { useState } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Input, Button } from "../../components/ui";
import { useAuth } from "../../components/AuthProvider";
import { useTheme } from "../../components/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.replace("/");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-background">
      <Screen scrollable padded>
        <View className="flex-1 justify-center py-10">
          {/* Header with Icon */}
          <View className="items-center mb-10">
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-16 h-16 rounded-full items-center justify-center mb-5"
            >
              <Sparkles size={28} color="#fff" />
            </LinearGradient>
            <Text className="text-[28px] font-bold mb-2 text-foreground">Welcome Back</Text>
            <Text className="text-[15px] text-center leading-[22px] text-muted-foreground">
              Sign in to continue your trip planning
            </Text>
          </View>

          {/* Form */}
          <View className="mb-6">
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              isPassword
              autoComplete="password"
            />

            {error && (
              <View className="p-3 rounded-lg mb-4 bg-error/10">
                <Text className="text-sm text-center text-error">{error}</Text>
              </View>
            )}

            <Button title="Sign In" onPress={handleLogin} loading={loading} fullWidth size="lg" className="mt-2" />

            <TouchableOpacity onPress={() => router.push("/forgot-password")} className="items-center mt-4">
              <Text className="text-sm font-medium text-primary">Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center items-center">
            <Text className="text-muted-foreground">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/signup")}>
              <Text className="text-primary font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
