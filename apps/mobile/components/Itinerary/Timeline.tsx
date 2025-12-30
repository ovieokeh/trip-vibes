import React from "react";
import { View, Text } from "react-native";
import { Itinerary } from "@trip-vibes/shared";
import { ActivityCard } from "./ActivityCard";

interface TimelineProps {
  itinerary: Itinerary;
}

export function Timeline({ itinerary }: TimelineProps) {
  return (
    <View className="py-5">
      {itinerary.days.map((day) => (
        <View key={day.id} className="mb-[30px]">
          <View className="px-5 mb-5">
            <Text className="text-2xl font-bold text-foreground">Day {day.dayNumber}</Text>
            <Text className="text-base mt-1 text-muted-foreground">{day.neighborhood}</Text>
          </View>

          {day.activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </View>
      ))}
    </View>
  );
}
