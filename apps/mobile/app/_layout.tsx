import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TouchableOpacity, View, Text } from "react-native";
import { AuthProvider } from "../components/AuthProvider";
import { ThemeProvider, useTheme } from "../components/ThemeProvider";
import { ChevronLeft, X, Share2 } from "lucide-react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "../global.css";

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

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
    <View className={`flex-1 ${isDark ? "dark" : ""}`}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            fontFamily: "Inter_600SemiBold",
            fontSize: 17,
            color: colors.foreground,
          },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          headerBackVisible: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
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
            animation: "slide_from_bottom",
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
            animation: "fade",
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
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Show nothing while fonts are loading
  if (!fontsLoaded && !fontError) {
    return null;
  }

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
