import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TouchableOpacity } from "react-native";
import { AuthProvider } from "../components/AuthProvider";
import { ThemeProvider, useTheme } from "../components/ThemeProvider";
import { ChevronLeft, X, Share2 } from "lucide-react-native";
import "../global.css";

function RootLayoutNav() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const BackButton = () => (
    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: -8, padding: 8 }}>
      <ChevronLeft size={28} color={colors.foreground} />
    </TouchableOpacity>
  );

  const CloseButton = () => (
    <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
      <X size={24} color={colors.foreground} />
    </TouchableOpacity>
  );

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            fontWeight: "600",
            fontSize: 17,
            color: colors.foreground,
          },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          headerBackVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {/* Tab Navigator */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Auth Modal Group */}
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />

        {/* Vibes Screen */}
        <Stack.Screen
          name="vibes"
          options={{
            title: "Find Your Vibe",
            headerShown: true,
            headerLeft: () => <BackButton />,
          }}
        />

        {/* Generating Screen */}
        <Stack.Screen
          name="generating"
          options={{
            title: "Creating Trip",
            headerShown: true,
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />

        {/* Itinerary Screen */}
        <Stack.Screen
          name="itinerary/[id]"
          options={{
            title: "Your Trip",
            headerShown: true,
            headerLeft: () => <BackButton />,
            headerRight: () => (
              <TouchableOpacity style={{ padding: 8 }}>
                <Share2 size={22} color={colors.foreground} />
              </TouchableOpacity>
            ),
          }}
        />

        {/* Legal Pages */}
        <Stack.Screen
          name="privacy"
          options={{
            title: "Privacy Policy",
            headerShown: true,
            headerLeft: () => <BackButton />,
          }}
        />
        <Stack.Screen
          name="terms"
          options={{
            title: "Terms of Service",
            headerShown: true,
            headerLeft: () => <BackButton />,
          }}
        />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
