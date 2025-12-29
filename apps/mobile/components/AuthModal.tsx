import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "./ui";
import { Colors } from "../constants/Colors";
import { X } from "lucide-react-native";

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  message?: string;
}

export function AuthModal({ visible, onClose, message = "Sign in to continue" }: AuthModalProps) {
  const router = useRouter();
  const colors = Colors.light;

  const navigateTo = (route: "/(auth)/login" | "/(auth)/signup") => {
    onClose();
    router.push(route);
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={colors.foreground} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Trip Vibes</Text>
            <Text style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
          </View>

          <View style={styles.actions}>
            <Button title="Log In" onPress={() => navigateTo("/(auth)/login")} style={styles.button} />
            <Button
              title="Create Account"
              onPress={() => navigateTo("/(auth)/signup")}
              variant="outline"
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 16,
    zIndex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
  },
  actions: {
    gap: 12,
  },
  button: {
    width: "100%",
  },
});
