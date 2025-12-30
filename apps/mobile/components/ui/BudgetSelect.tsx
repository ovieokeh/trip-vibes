import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Coins, Wallet, Gem, Sparkles } from "lucide-react-native";
import { useTheme } from "../../components/ThemeProvider";

interface BudgetSelectProps {
  value: "low" | "medium" | "high" | null;
  onChange: (value: "low" | "medium" | "high") => void;
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
      {options.map((opt) => {
        const isSelected = value === opt.value;
        const Icon = opt.icon;

        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.7}
            className={`flex-1 flex-col items-center justify-center py-3 px-2 rounded-xl border-2 ${
              isSelected ? "bg-primary/10 border-primary" : "bg-card border-border"
            }`}
          >
            <View className="mb-1">
              <Icon size={20} color={isSelected ? colors.primary : colors.mutedForeground} />
            </View>
            <Text className={`text-lg font-bold mb-0.5 ${isSelected ? "text-primary" : "text-foreground"}`}>
              {opt.label}
            </Text>
            <Text
              className={`text-[10px] uppercase tracking-wider font-semibold ${
                isSelected ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {opt.desc}
            </Text>

            {isSelected && (
              <View className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full items-center justify-center">
                <Sparkles size={10} color={colors.background} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
