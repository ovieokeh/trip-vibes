import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { TripActivity } from "@trip-vibes/shared";
import { useTheme } from "../ThemeProvider";
import { Clock } from "lucide-react-native";

interface ActivityCardProps {
  activity: TripActivity;
  onPress?: () => void;
}

export function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="flex-row mb-5 px-5 bg-background">
      <View className="w-[60px] items-center mr-2.5">
        <Text className="font-bold text-sm mb-2 text-primary">{activity.startTime}</Text>
        <View className="w-0.5 flex-1 rounded-sm bg-border" />
      </View>

      <View className="flex-1 rounded-2xl overflow-hidden shadow-md bg-card border border-border">
        {activity.vibe.imageUrl && (
          <Image source={{ uri: activity.vibe.imageUrl }} className="w-full h-[120px] bg-muted" />
        )}

        <View className="p-3">
          <Text className="text-base font-bold mb-1 text-foreground" numberOfLines={1}>
            {activity.vibe.title}
          </Text>
          <Text className="text-[12px] text-muted-foreground mb-2 capitalize">{activity.vibe.category}</Text>
          <Text className="text-sm text-foreground mb-3" numberOfLines={2}>
            {activity.note}
          </Text>

          <View className="flex-row items-center">
            <View className="flex-row items-center mr-3">
              <Clock size={14} color={colors.mutedForeground} />
              <Text className="text-[12px] text-muted-foreground ml-1">
                {activity.startTime} - {activity.endTime}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
