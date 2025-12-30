import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { Coins, Wallet, Gem, Sparkles } from "lucide-react-native";
import { useTheme } from "../../components/ThemeProvider";
import { springs, scales } from "../../constants/motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface BudgetSelectProps {
  value: "low" | "medium" | "high" | null;
  onChange: (value: "low" | "medium" | "high") => void;
}

interface BudgetOptionProps {
  value: "low" | "medium" | "high";
  label: string;
  icon: any;
  desc: string;
  isSelected: boolean;
  onPress: () => void;
  colors: any;
}

function BudgetOption({ value, label, icon: Icon, desc, isSelected, onPress, colors }: BudgetOptionProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? scales.pressed : 1, springs.snappy) }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        pressed.value = 1;
      }}
      onPressOut={() => {
        pressed.value = 0;
      }}
      style={animatedStyle}
      className={`flex-1 flex-col items-center justify-center py-3 px-2 rounded-xl border-2 ${
        isSelected ? "bg-primary/10 border-primary" : "bg-card border-border"
      }`}
    >
      <View className="mb-1">
        <Icon size={20} color={isSelected ? colors.primary : colors.mutedForeground} />
      </View>
      <Text className={`text-lg font-bold mb-0.5 ${isSelected ? "text-primary" : "text-foreground"}`}>{label}</Text>
      <Text
        className={`text-[10px] uppercase tracking-wider font-semibold ${
          isSelected ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {desc}
      </Text>

      {isSelected && (
        <View className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full items-center justify-center">
          <Sparkles size={10} color={colors.background} />
        </View>
      )}
    </AnimatedPressable>
  );
}

export function BudgetSelect({ value, onChange }: BudgetSelectProps) {
  const { colors } = useTheme();

  const options = [
    { value: "low" as const, label: "$", icon: Coins, desc: "Budget" },
    { value: "medium" as const, label: "$$", icon: Wallet, desc: "Balanced" },
    { value: "high" as const, label: "$$$", icon: Gem, desc: "Premium" },
  ];

  return (
    <View className="flex-row gap-2">
      {options.map((opt) => (
        <BudgetOption
          key={opt.value}
          value={opt.value}
          label={opt.label}
          icon={opt.icon}
          desc={opt.desc}
          isSelected={value === opt.value}
          onPress={() => onChange(opt.value)}
          colors={colors}
        />
      ))}
    </View>
  );
}
