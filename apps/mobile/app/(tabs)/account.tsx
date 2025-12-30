import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../components/AuthProvider";
import { useTheme } from "../../components/ThemeProvider";
import { Button, Card, Badge } from "../../components/ui";
import { User, Mail, Calendar, ChevronRight, LogOut, FileText, Shield, Bookmark } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function AccountScreen() {
  const router = useRouter();
  const { user, isAnonymous, signOut } = useAuth();
  const { colors, theme, colorScheme, setColorScheme } = useTheme();

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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.guestContainer}>
          <LinearGradient colors={[colors.primary + "20", colors.accent + "20"]} style={styles.guestIconBg}>
            <User size={48} color={colors.primary} />
          </LinearGradient>
          <Text style={[styles.guestTitle, { color: colors.foreground }]}>Welcome, Traveler!</Text>
          <Text style={[styles.guestText, { color: colors.mutedForeground }]}>
            Sign in to save your trips, sync across devices, and access exclusive features.
          </Text>
          <Button title="Sign In" onPress={() => router.push("/login")} fullWidth style={{ marginTop: 24 }} />
          <Button
            title="Create Account"
            variant="outline"
            onPress={() => router.push("/signup")}
            fullWidth
            style={{ marginTop: 12 }}
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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.profileSection}>
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarGradient}
        >
          <Text style={styles.avatarText}>{user.email?.charAt(0).toUpperCase() || "U"}</Text>
        </LinearGradient>
        <Text style={[styles.email, { color: colors.foreground }]}>{user.email}</Text>
        <Badge label={`Member since ${memberSince}`} variant="muted" size="sm" />
      </View>

      {/* Stats Card */}
      <Card variant="outlined" padding="lg" style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>3</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Credits</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.stat} onPress={() => router.push("/saved-trips")}>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>—</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Trips</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>MENU</Text>

        <MenuItem
          icon={<Bookmark size={20} color={colors.foreground} />}
          label="Saved Trips"
          onPress={() => router.push("/saved-trips")}
          colors={colors}
        />

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>APPEARANCE</Text>

        <View style={[styles.themeSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemeOption
            label="Light"
            active={colorScheme === "light"}
            onPress={() => setColorScheme("light")}
            colors={colors}
          />
          <View style={[styles.themeDivider, { backgroundColor: colors.border }]} />
          <ThemeOption
            label="Dark"
            active={colorScheme === "dark"}
            onPress={() => setColorScheme("dark")}
            colors={colors}
          />
          <View style={[styles.themeDivider, { backgroundColor: colors.border }]} />
          <ThemeOption
            label="System"
            active={colorScheme === "system"}
            onPress={() => setColorScheme("system")}
            colors={colors}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>LEGAL</Text>

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
      <View style={styles.signOutSection}>
        <Button
          title="Sign Out"
          variant="ghost"
          onPress={handleSignOut}
          leftIcon={<LogOut size={18} color={colors.error} />}
        />
      </View>

      {/* Bottom Padding */}
      <View style={{ height: 100 }} />
    </ScrollView>
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
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItemLeft}>
        {icon}
        <Text style={[styles.menuItemLabel, { color: colors.foreground }]}>{label}</Text>
      </View>
      <View style={styles.menuItemRight}>
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
      style={[styles.themeOption, active && { backgroundColor: colors.primary + "15" }]}
    >
      <Text
        style={[
          styles.themeOptionLabel,
          { color: active ? colors.primary : colors.mutedForeground },
          active && { fontWeight: "700" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  guestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  guestIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  guestText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  email: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  statsCard: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  divider: {
    height: 1,
    marginTop: 8,
  },
  signOutSection: {
    alignItems: "center",
    marginTop: 8,
  },
  themeSelector: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 8,
  },
  themeOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  themeOptionLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  themeDivider: {
    width: 1,
    height: "100%",
  },
});
