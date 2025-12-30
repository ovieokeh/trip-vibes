import React, { useMemo } from "react";
import { View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { Itinerary } from "@trip-vibes/shared";
import { useTheme } from "./ThemeProvider";

interface ResultMapProps {
  itinerary: Itinerary;
  selectedDay?: number;
}

export function ResultMap({ itinerary, selectedDay = 1 }: ResultMapProps) {
  const { colors } = useTheme();

  // Filter activities for the selected day
  const dayActivities = useMemo(() => {
    const day = itinerary.days.find((d) => d.dayNumber === selectedDay);
    if (!day) return [];
    // Only activities with coordinates
    return day.activities.filter((a) => a.vibe.lat && a.vibe.lng);
  }, [itinerary, selectedDay]);

  const initialRegion = useMemo(() => {
    if (dayActivities.length === 0) return undefined;

    // Calculate bounding box
    let minLat = 90,
      maxLat = -90,
      minLng = 180,
      maxLng = -180;

    dayActivities.forEach((a) => {
      const lat = a.vibe.lat!;
      const lng = a.vibe.lng!;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });

    const latDelta = (maxLat - minLat) * 1.5 || 0.05;
    const lngDelta = (maxLng - minLng) * 1.5 || 0.05;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.01, latDelta), // Minimal zoom
      longitudeDelta: Math.max(0.01, lngDelta),
    };
  }, [dayActivities]);

  if (dayActivities.length === 0 || !initialRegion) {
    return null;
  }

  return (
    <View className="h-[250px] w-full rounded-2xl overflow-hidden my-2.5">
      <MapView
        provider={PROVIDER_DEFAULT}
        className="w-full h-full"
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsCompass={true}
      >
        {dayActivities.map((activity) => (
          <Marker
            key={activity.id}
            coordinate={{
              latitude: activity.vibe.lat!,
              longitude: activity.vibe.lng!,
            }}
            title={activity.vibe.title}
            description={activity.note}
            pinColor={colors.primary}
          />
        ))}

        {/* Draw line between sequential points */}
        <Polyline
          coordinates={dayActivities.map((a) => ({
            latitude: a.vibe.lat!,
            longitude: a.vibe.lng!,
          }))}
          strokeColor={colors.primary}
          strokeWidth={3}
        />
      </MapView>
    </View>
  );
}
