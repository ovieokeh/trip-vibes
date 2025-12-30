import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { useTheme } from "../../components/ThemeProvider";
import { X } from "lucide-react-native";

export default function AuthLayout() {
  const { colors } = useTheme();
  const router = useRouter();

  const CloseButton = () => (
    <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
      <X size={24} color={colors.foreground} />
    </TouchableOpacity>
  );

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 17,
          color: colors.foreground,
        },
        headerShadowVisible: false,
        headerLeft: () => <CloseButton />,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_bottom",
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: "Sign In",
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: "Create Account",
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: "Reset Password",
        }}
      />
    </Stack>
  );
}
