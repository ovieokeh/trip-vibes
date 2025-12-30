import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../components/AuthProvider";
import { useTheme } from "../../components/ThemeProvider";
import { Button, Card, Badge, Screen, TabBarSpacer } from "../../components/ui";
import { User, Mail, Calendar, ChevronRight, LogOut, FileText, Shield, Bookmark } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function AccountScreen() {
  const router = useRouter();
  const { user, isAnonymous, signOut } = useAuth();
  const { colors, colorScheme, setColorScheme } = useTheme();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/");
        },
      },
    ]);
  };

  // If not logged in, show sign-in prompt
  if (!user || isAnonymous) {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center px-10">
          <LinearGradient
            colors={[colors.primary + "20", colors.accent + "20"]}
            className="w-[100px] h-[100px] rounded-full items-center justify-center mb-6"
          >
            <User size={48} color={colors.primary} />
          </LinearGradient>
          <Text className="text-[24px] font-bold mb-3 text-center text-foreground">Welcome, Traveler!</Text>
          <Text className="text-[15px] text-center leading-[22px] text-muted-foreground">
            Sign in to save your trips, sync across devices, and access exclusive features.
          </Text>
          <Button title="Sign In" onPress={() => router.push("/login")} className="w-full mt-6" />
          <Button
            title="Create Account"
            variant="outline"
            onPress={() => router.push("/signup")}
            className="w-full mt-3"
          />
        </View>
      </View>
    );
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Unknown";

  return (
    <Screen scrollable safeArea={false} padded={false} contentContainerClassName="px-5 pt-5">
      {/* Profile Header */}
      <View className="items-center mb-6">
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
        >
          <Text className="text-[32px] font-bold text-white">{user.email?.charAt(0).toUpperCase() || "U"}</Text>
        </LinearGradient>
        <Text className="text-[18px] font-semibold mb-2 text-foreground">{user.email}</Text>
        <View className="w-full flex-row justify-center items-center">
          <Badge label={`Member since ${memberSince}`} variant="muted" size="sm" />
        </View>
      </View>

      {/* Stats Card */}
      <Card variant="outlined" padding="lg" className="mb-6">
        <View className="flex-row items-center">
          <View className="flex-1 items-center">
            <Text className="text-[24px] font-bold mb-1 text-primary">3</Text>
            <Text className="text-[13px] text-muted-foreground">Credits</Text>
          </View>
          <View className="w-[1px] h-10 bg-border" />
          <TouchableOpacity className="flex-1 items-center" onPress={() => router.push("/saved-trips")}>
            <Text className="text-[24px] font-bold mb-1 text-foreground">—</Text>
            <Text className="text-[13px] text-muted-foreground">Trips</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Menu Items */}
      <View className="mb-6">
        <Text className="text-[12px] font-semibold tracking-[0.5px] mb-3 mt-6 text-muted-foreground uppercase">
          APPEARANCE
        </Text>

        <View className="flex-row rounded-xl overflow-hidden border border-border mb-2 bg-card">
          <ThemeOption
            label="Light"
            active={colorScheme === "light"}
            onPress={() => setColorScheme("light")}
            colors={colors}
          />
          <View className="w-[1px] h-full bg-border" />
          <ThemeOption
            label="Dark"
            active={colorScheme === "dark"}
            onPress={() => setColorScheme("dark")}
            colors={colors}
          />
          <View className="w-[1px] h-full bg-border" />
          <ThemeOption
            label="System"
            active={colorScheme === "system"}
            onPress={() => setColorScheme("system")}
            colors={colors}
          />
        </View>

        <View className="h-[1px] mt-2 bg-divider" />

        <Text className="text-[12px] font-semibold tracking-[0.5px] mb-3 mt-6 text-muted-foreground uppercase">
          LEGAL
        </Text>

        <MenuItem
          icon={<FileText size={20} color={colors.foreground} />}
          label="Terms of Service"
          onPress={() => router.push("/terms")}
          colors={colors}
        />
        <MenuItem
          icon={<Shield size={20} color={colors.foreground} />}
          label="Privacy Policy"
          onPress={() => router.push("/privacy")}
          colors={colors}
        />
      </View>

      {/* Sign Out */}
      <View className="items-center mt-2">
        <Button
          title="Sign Out"
          variant="ghost"
          onPress={handleSignOut}
          leftIcon={<LogOut size={18} color={colors.error} />}
        />
      </View>

      {/* Bottom Padding */}
      <TabBarSpacer />
    </Screen>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  colors: any;
  badge?: string;
}

function MenuItem({ icon, label, onPress, colors, badge }: MenuItemProps) {
  return (
    <TouchableOpacity className="flex-row items-center justify-between py-3.5" onPress={onPress} activeOpacity={0.7}>
      <View className="flex-row items-center gap-3">
        {icon}
        <Text className="text-[16px] font-medium text-foreground">{label}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        {badge && <Badge label={badge} variant="primary" size="sm" />}
        <ChevronRight size={20} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

function ThemeOption({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 items-center justify-center py-3 ${active ? "bg-primary/10" : ""}`}
    >
      <Text className={`text-[14px] ${active ? "text-primary font-bold" : "text-muted-foreground font-medium"}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
