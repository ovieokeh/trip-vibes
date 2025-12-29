import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../components/AuthProvider";
import { Screen, Button } from "../components/ui";
import { Colors } from "../constants/Colors";

export default function Home() {
  const router = useRouter();
  const { user, isAnonymous, loading, signOut } = useAuth();
  const colors = Colors.light;

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={{ color: colors.mutedForeground }}>Loading...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Trip Vibes</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Plan your perfect trip</Text>
        </View>

        <View style={styles.content}>
          {user && !isAnonymous ? (
            <View style={styles.userSection}>
              <Text style={[styles.userEmail, { color: colors.foreground }]}>Logged in as: {user.email}</Text>
              <Button title="Sign Out" variant="outline" onPress={signOut} fullWidth style={styles.button} />
            </View>
          ) : (
            <View style={styles.authSection}>
              <Text style={[styles.authText, { color: colors.mutedForeground }]}>
                Sign in to save your trips and access more features
              </Text>
              <Button title="Sign In" onPress={() => router.push("/login")} fullWidth style={styles.button} />
              <Button
                title="Create Account"
                variant="outline"
                onPress={() => router.push("/signup")}
                fullWidth
                style={styles.button}
              />
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  userSection: {
    alignItems: "center",
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 24,
  },
  authSection: {
    alignItems: "center",
  },
  authText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    marginBottom: 12,
  },
});
