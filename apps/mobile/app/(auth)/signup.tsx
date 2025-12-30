import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Input, Button } from "../../components/ui";
import { useAuth } from "../../components/AuthProvider";
import { useTheme } from "../../components/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import { UserPlus } from "lucide-react-native";

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, updateUser, isAnonymous, user } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    let signUpError;

    if (user && isAnonymous) {
      // Upgrade anonymous user
      const { error } = await updateUser({ email, password });
      signUpError = error;
    } else {
      // Create new user
      const { error } = await signUp(email, password);
      signUpError = error;
    }

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Show success message and navigate to login
    Alert.alert(
      "Check Your Email",
      "We've sent you a verification link. Please check your email to confirm your account.",
      [
        {
          text: "OK",
          onPress: () => router.replace("/login"),
        },
      ]
    );
    setLoading(false);
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
              <UserPlus size={28} color="#fff" />
            </LinearGradient>
            <Text className="text-[28px] font-bold mb-2 text-foreground">Create Account</Text>
            <Text className="text-[15px] text-center leading-[22px] text-muted-foreground">
              Start planning your perfect trips
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
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              isPassword
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              autoComplete="new-password"
            />

            {error && (
              <View className="p-3 rounded-lg mb-4 bg-error/10">
                <Text className="text-sm text-center text-error">{error}</Text>
              </View>
            )}

            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
              fullWidth
              size="lg"
              className="mt-2"
            />
          </View>

          {/* Footer */}
          <View className="flex-row justify-center items-center">
            <Text className="text-muted-foreground">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text className="text-primary font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
