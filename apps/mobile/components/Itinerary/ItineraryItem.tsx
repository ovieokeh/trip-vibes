import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, Linking, Platform } from "react-native";
import { ItineraryItem as ItineraryItemType } from "@trip-vibes/shared";
import { useTheme } from "../ThemeProvider";
import { MoreHorizontal, MapPin, Star, Globe, Phone } from "lucide-react-native";
import { PhotoGalleryModal } from "./PhotoGalleryModal";
import { API_URL } from "../../lib/api";

interface ItineraryItemProps {
  item: ItineraryItemType;
  dayDate?: string; // YYYY-MM-DD
}

const getImageUri = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("/")) {
    return `${API_URL}${url}`;
  }
  return url;
};

export function ItineraryItem({ item, dayDate }: ItineraryItemProps) {
  const { colors } = useTheme();
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);

  const openGallery = (index: number) => {
    setInitialImageIndex(index);
    setIsGalleryOpen(true);
  };

  const handleOpenURL = (url: string) => {
    Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch((err) => console.error("Couldn't make call", err));
  };

  const handleGetDirections = () => {
    const lat = item.vibe.lat;
    const lng = item.vibe.lng;
    if (!lat || !lng) return;

    const scheme = Platform.select({ ios: "maps:0,0?q=", android: "geo:0,0?q=" });
    const latLng = `${lat},${lng}`;
    const label = item.vibe.title;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) Linking.openURL(url);
  };

  // Opening hours logic
  let hoursToday = "";
  if (dayDate && item.vibe.openingHours?.weekday_text) {
    const [year, month, day] = dayDate.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
    const hoursText = item.vibe.openingHours.weekday_text.find((t) => t.startsWith(dayName));
    if (hoursText) {
      hoursToday = hoursText.split(": ")[1];
    }
  }

  const hasPhotos = item.vibe.photos && item.vibe.photos.length > 0;
  const transit = item.transitDetails;

  return (
    <View className="px-4 mb-2">
      <PhotoGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        photos={item.vibe.photos || []}
        initialIndex={initialImageIndex}
        title={item.vibe.title}
      />

      {/* Transit Indicator */}
      {(item.transitNote || transit) && (
        <View className="flex-row mb-2">
          <View className="w-[45px] items-center mr-3 opacity-0">
            <View className="w-0.5 flex-1 rounded-sm bg-border border-dashed border" />
          </View>
          <View className="flex-1 py-3 relative justify-center">
            <View
              className="absolute -left-3 inset-y-0 border-l border-dashed"
              style={{ borderColor: colors.border + "40" }}
            />
            <View className="self-start px-2 py-1 rounded-lg ml-3 bg-accent/10">
              <Text className="text-[10px] font-extrabold uppercase tracking-[0.5px] text-accent-foreground">
                {item.transitNote || (transit ? `${transit.durationMinutes} min ${transit.mode}` : "Getting there")}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View className="flex-row">
        <View className="w-[45px] items-center mr-3">
          <Text className="text-[12px] font-bold mb-2 text-foreground font-mono">{item.startTime}</Text>
          <View className="w-0.5 flex-1 rounded-sm" style={{ backgroundColor: colors.border + "50" }} />
        </View>

        <View
          className="flex-1 rounded-2xl overflow-hidden border mb-6 shadow-sm bg-card"
          style={{ borderColor: colors.border + "30" }}
        >
          {/* Image Grid */}
          {hasPhotos ? (
            <View className="flex-row h-[180px] gap-0.5">
              <TouchableOpacity activeOpacity={0.9} onPress={() => openGallery(0)} className="flex-[3]">
                <Image source={{ uri: getImageUri(item.vibe.photos![0].url) }} className="w-full h-full" />
              </TouchableOpacity>

              <View className="flex-1 gap-0.5">
                {item.vibe.photos!.slice(1, 3).map((photo, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.9}
                    onPress={() => openGallery(idx + 1)}
                    className="flex-1 relative"
                  >
                    <Image source={{ uri: getImageUri(photo.url) }} className="w-full h-full" />
                  </TouchableOpacity>
                ))}
                {item.vibe.photos!.length > 3 && (
                  <TouchableOpacity activeOpacity={0.9} onPress={() => openGallery(3)} className="flex-1 relative">
                    <Image source={{ uri: getImageUri(item.vibe.photos![3].url) }} className="w-full h-full" />
                    <View className="absolute inset-0 bg-black/50 justify-center items-center">
                      <Text className="text-white text-[12px] font-bold">+{item.vibe.photos!.length - 3}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            item.vibe.imageUrl && (
              <Image source={{ uri: getImageUri(item.vibe.imageUrl) }} className="w-full h-[150px]" />
            )
          )}

          <View className="p-4">
            <View className="flex-row justify-between items-center mb-2">
              <View className="py-0.5">
                <Text className="text-[10px] font-bold tracking-wider text-muted-foreground">
                  {item.vibe.category.toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity>
                <MoreHorizontal size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text className="text-lg font-extrabold mb-2 leading-[22px] text-foreground">{item.vibe.title}</Text>

            <Text className="text-sm leading-5 mb-3 text-muted-foreground" numberOfLines={3}>
              {item.note || item.vibe.description}
            </Text>

            {item.vibe.address && (
              <View className="flex-row items-center gap-1 mb-3">
                <MapPin size={12} color={colors.mutedForeground} />
                <Text className="text-[12px] flex-1 text-muted-foreground" numberOfLines={1}>
                  {item.vibe.address}
                </Text>
              </View>
            )}

            <View className="flex-row gap-2 mb-4">
              {item.vibe.rating && (
                <View className="flex-row items-center gap-1 px-2 py-1 rounded-xl bg-[#FFB800]/15">
                  <Star size={12} color="#FFB800" fill="#FFB800" />
                  <Text className="text-[12px] font-bold text-[#FFB800]">{item.vibe.rating.toFixed(1)}</Text>
                </View>
              )}
              {hoursToday && (
                <View className={`px-2 py-1 rounded-xl ${hoursToday === "Closed" ? "bg-error/10" : "bg-success/10"}`}>
                  <Text
                    className={`text-[11px] font-semibold ${hoursToday === "Closed" ? "text-error" : "text-success"}`}
                  >
                    {hoursToday === "Closed" ? "Closed" : hoursToday}
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View
              className="flex-row flex-wrap gap-3 pt-3"
              style={{ borderTopWidth: 1, borderTopColor: colors.border + "30" }}
            >
              {item.vibe.website && (
                <TouchableOpacity
                  className="flex-row items-center gap-1"
                  onPress={() => handleOpenURL(item.vibe.website!)}
                >
                  <Globe size={16} color={colors.primary} />
                  <Text className="text-[13px] font-semibold text-primary">Website</Text>
                </TouchableOpacity>
              )}
              {item.vibe.phone && (
                <TouchableOpacity className="flex-row items-center gap-1" onPress={() => handleCall(item.vibe.phone!)}>
                  <Phone size={16} color={colors.primary} />
                  <Text className="text-[13px] font-semibold text-primary">Call</Text>
                </TouchableOpacity>
              )}
              {item.vibe.lat && (
                <TouchableOpacity className="flex-row items-center gap-1" onPress={handleGetDirections}>
                  <MapPin size={16} color={colors.primary} />
                  <Text className="text-[13px] font-semibold text-primary">Directions</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
