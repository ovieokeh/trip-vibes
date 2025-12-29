import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Button } from "../components/ui";
import { useAuth } from "../components/AuthProvider";
import { Colors } from "../constants/Colors";

export default function AccountScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const colors = Colors.light;

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <Screen padded>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Account</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Email</Text>
        <Text style={[styles.value, { color: colors.foreground }]}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Member Since</Text>
        <Text style={[styles.value, { color: colors.foreground }]}>
          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Saved Trips"
          variant="secondary"
          onPress={() => router.push("/saved-trips")}
          fullWidth
          style={styles.button}
        />
        <Button title="Sign Out" variant="outline" onPress={handleSignOut} fullWidth style={styles.button} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: "#888",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 18,
    fontWeight: "500",
  },
  actions: {
    marginTop: 40,
  },
  button: {
    marginBottom: 16,
  },
});
