import React, { useState } from "react";
import {
  View,
  TextInput as RNTextInput,
  Text,
  TextInputProps as RNTextInputProps,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../ThemeProvider";

interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  isPassword = false,
  style,
  className = "",
  ...props
}: InputProps & { className?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const { colors } = useTheme();

  return (
    <View className="w-full mb-4">
      {label && <Text className="text-sm font-medium text-foreground mb-1.5">{label}</Text>}
      <View className="relative justify-center">
        <RNTextInput
          className={`w-full border rounded-xl py-3.5 px-4 text-base bg-muted text-foreground ${
            error ? "border-error" : "border-border"
          } ${className}`}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          style={style}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity className="absolute right-4 py-1" onPress={() => setShowPassword(!showPassword)}>
            <Text className="text-muted-foreground">{showPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text className="text-xs text-error mt-1">{error}</Text>}
    </View>
  );
}
