import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "./ui";
import { useTheme } from "./ThemeProvider";
import { X } from "lucide-react-native";

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  message?: string;
}

export function AuthModal({ visible, onClose, message = "Sign in to continue" }: AuthModalProps) {
  const router = useRouter();
  const { colors } = useTheme();

  const navigateTo = (route: "/(auth)/login" | "/(auth)/signup") => {
    onClose();
    router.push(route);
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-center items-center p-5">
        <View className="w-full max-w-[340px] rounded-2xl p-6 shadow-lg bg-background">
          <TouchableOpacity
            className="absolute right-4 top-4 z-10"
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={colors.foreground} />
          </TouchableOpacity>

          <View className="items-center mb-6 mt-2">
            <Text className="text-2xl font-bold mb-2 text-foreground">Trip Vibes</Text>
            <Text className="text-base text-center text-muted-foreground">{message}</Text>
          </View>

          <View className="gap-3">
            <Button title="Log In" onPress={() => navigateTo("/(auth)/login")} className="w-full" />
            <Button
              title="Create Account"
              onPress={() => navigateTo("/(auth)/signup")}
              variant="outline"
              className="w-full"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
