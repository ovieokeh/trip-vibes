import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../components/AuthProvider";
import { Screen, Button } from "../components/ui";
import { Colors } from "../constants/Colors";

export default function Home() {
  const router = useRouter();
  const { user, isAnonymous, loading } = useAuth();
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
          <View style={styles.mainAction}>
            <Button
              title="Create New Trip"
              onPress={() => router.push("/vibes")}
              fullWidth
              style={styles.largeButton}
              textStyle={styles.largeButtonText}
            />
          </View>

          {user && !isAnonymous ? (
            <View style={styles.userSection}>
              <Text style={[styles.welcome, { color: colors.foreground }]}>Welcome back!</Text>
              <Button
                title="Your Saved Trips"
                variant="secondary"
                onPress={() => router.push("/saved-trips")}
                fullWidth
                style={styles.button}
              />
              <Button
                title="Account"
                variant="outline"
                onPress={() => router.push("/account")}
                fullWidth
                style={styles.button}
              />
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
    marginBottom: 40,
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
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  mainAction: {
    flex: 1,
    justifyContent: "center",
    marginBottom: 40,
  },
  largeButton: {
    paddingVertical: 16,
    borderRadius: 16,
  },
  largeButtonText: {
    fontSize: 18,
    fontWeight: "700",
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
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  welcome: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 24,
  },
  button: {
    marginBottom: 12,
  },
});
