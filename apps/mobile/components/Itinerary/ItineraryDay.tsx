import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ItineraryDay as ItineraryDayType } from "@trip-vibes/shared";
import { ItineraryItem } from "./ItineraryItem";
import { useTheme } from "../ThemeProvider";
import { Plus } from "lucide-react-native";

interface ItineraryDayProps {
  day: ItineraryDayType;
  onAddActivity?: (index?: number) => void;
}

export function ItineraryDay({ day, onAddActivity }: ItineraryDayProps) {
  const { colors } = useTheme();

  // Format date if available
  const dateObj = day.date ? new Date(day.date) : null;
  const displayDate = dateObj
    ? dateObj.toLocaleDateString(undefined, { month: "long", day: "numeric" })
    : `Day ${day.dayNumber}`;

  const displayDayName = dateObj ? dateObj.toLocaleDateString(undefined, { weekday: "long" }) : "";

  return (
    <View className="mb-2">
      <View className="flex-row items-center px-4 mb-6 gap-3">
        <View className="w-3 h-3 rounded-full -ml-[5px] shadow-lg bg-primary shadow-primary" />
        <View className="flex-1">
          <Text className="text-[22px] font-black tracking-tighter text-foreground">{displayDate}</Text>
          {displayDayName ? (
            <Text className="text-[13px] font-medium mt-0.5 text-muted-foreground">
              {displayDayName}, Day {day.dayNumber}
            </Text>
          ) : null}
        </View>
        {day.neighborhood && (
          <View className="px-2.5 py-1 rounded-lg bg-primary/10">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-primary">{day.neighborhood}</Text>
          </View>
        )}
      </View>

      <View className="pl-0">
        {day.activities.map((item, index) => (
          <React.Fragment key={item.id}>
            <ItineraryItem item={item} dayDate={day.date} isLastInDay={index === day.activities.length - 1} />

            {/* Add Activity Button after each item */}
            <TouchableOpacity
              className="px-4 h-10 justify-center mb-4"
              onPress={() => onAddActivity?.(index)}
              activeOpacity={0.6}
            >
              {/* <View className="absolute left-[38.5px] inset-y-0 w-[1px] bg-border" /> */}
              <View
                className="flex-row items-center justify-center gap-1.5 border border-dashed rounded-xl py-2 ml-[57px] bg-background"
                style={{ borderColor: colors.border + "60" }}
              >
                <Plus size={14} color={colors.mutedForeground} />
                <Text className="text-[12px] font-semibold text-muted-foreground">Add Activity</Text>
              </View>
            </TouchableOpacity>
          </React.Fragment>
        ))}

        {day.activities.length === 0 && (
          <TouchableOpacity
            className="mx-4 ml-[73px] p-6 border-2 border-dashed rounded-2xl items-center justify-center gap-2"
            style={{ borderColor: colors.border + "60" }}
            onPress={() => onAddActivity?.()}
            activeOpacity={0.6}
          >
            <Plus size={20} color={colors.primary} />
            <Text className="text-sm font-bold text-primary">Add your first activity</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
