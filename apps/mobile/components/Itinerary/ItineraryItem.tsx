import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Platform } from "react-native";
import { ItineraryItem as ItineraryItemType, TripActivity } from "@trip-vibes/shared";
import { useTheme } from "../ThemeProvider";
import {
  Trash,
  Move,
  MoreHorizontal,
  Clock,
  MapPin,
  Star,
  Globe,
  Phone,
  ExternalLink,
  ChevronRight,
} from "lucide-react-native";
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
    <View style={styles.container}>
      <PhotoGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        photos={item.vibe.photos || []}
        initialIndex={initialImageIndex}
        title={item.vibe.title}
      />

      {/* Transit Indicator */}
      {(item.transitNote || transit) && (
        <View style={styles.transitWrapper}>
          <View style={[styles.timeColumn, { opacity: 0 }]}>
            <View style={[styles.line, { backgroundColor: colors.border, borderStyle: "dashed", borderWidth: 1 }]} />
          </View>
          <View style={styles.transitContent}>
            <View style={[styles.transitLine, { borderColor: colors.border }]} />
            <View style={[styles.transitBadge, { backgroundColor: colors.accent + "20" }]}>
              <Text style={[styles.transitText, { color: colors.primary }]}>
                {item.transitNote || (transit ? `${transit.durationMinutes} min ${transit.mode}` : "Getting there")}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.itemRow}>
        <View style={styles.timeColumn}>
          <Text style={[styles.timeText, { color: colors.foreground }]}>{item.startTime}</Text>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Image Grid */}
          {hasPhotos ? (
            <View style={styles.imageGrid}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => openGallery(0)} style={styles.mainImageContainer}>
                <Image source={{ uri: getImageUri(item.vibe.photos![0].url) }} style={styles.mainImage} />
              </TouchableOpacity>

              <View style={styles.sideImages}>
                {item.vibe.photos!.slice(1, 3).map((photo, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.9}
                    onPress={() => openGallery(idx + 1)}
                    style={styles.sideImageContainer}
                  >
                    <Image source={{ uri: getImageUri(photo.url) }} style={styles.sideImage} />
                  </TouchableOpacity>
                ))}
                {item.vibe.photos!.length > 3 && (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => openGallery(3)}
                    style={styles.sideImageContainer}
                  >
                    <Image source={{ uri: getImageUri(item.vibe.photos![3].url) }} style={styles.sideImage} />
                    <View style={styles.imageOverlay}>
                      <Text style={styles.remainingText}>+{item.vibe.photos!.length - 3}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            item.vibe.imageUrl && (
              <Image source={{ uri: getImageUri(item.vibe.imageUrl) }} style={styles.fallbackImage} />
            )
          )}

          <View style={styles.content}>
            <View style={styles.headerRow}>
              <View style={styles.categoryBadge}>
                <Text style={[styles.categoryText, { color: colors.mutedForeground }]}>
                  {item.vibe.category.toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity>
                <MoreHorizontal size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.title, { color: colors.foreground }]}>{item.vibe.title}</Text>

            <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={3}>
              {item.note || item.vibe.description}
            </Text>

            {item.vibe.address && (
              <View style={styles.addressRow}>
                <MapPin size={12} color={colors.mutedForeground} />
                <Text style={[styles.addressText, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {item.vibe.address}
                </Text>
              </View>
            )}

            <View style={styles.metaRow}>
              {item.vibe.rating && (
                <View style={[styles.ratingBadge, { backgroundColor: "#FFB800" + "15" }]}>
                  <Star size={12} color="#FFB800" fill="#FFB800" />
                  <Text style={styles.ratingText}>{item.vibe.rating.toFixed(1)}</Text>
                </View>
              )}
              {hoursToday && (
                <View
                  style={[
                    styles.hoursBadge,
                    { backgroundColor: hoursToday === "Closed" ? colors.error + "10" : colors.success + "10" },
                  ]}
                >
                  <Text style={[styles.hoursText, { color: hoursToday === "Closed" ? colors.error : colors.success }]}>
                    {hoursToday === "Closed" ? "Closed" : hoursToday}
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={[styles.actions, { borderTopColor: colors.border }]}>
              {item.vibe.website && (
                <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenURL(item.vibe.website!)}>
                  <Globe size={16} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>Website</Text>
                </TouchableOpacity>
              )}
              {item.vibe.phone && (
                <TouchableOpacity style={styles.actionButton} onPress={() => handleCall(item.vibe.phone!)}>
                  <Phone size={16} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>Call</Text>
                </TouchableOpacity>
              )}
              {item.vibe.lat && (
                <TouchableOpacity style={styles.actionButton} onPress={handleGetDirections}>
                  <MapPin size={16} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>Directions</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
  },
  timeColumn: {
    width: 45,
    alignItems: "center",
    marginRight: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
  },
  line: {
    width: 2,
    flex: 1,
    borderRadius: 1,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageGrid: {
    flexDirection: "row",
    height: 180,
    gap: 2,
  },
  mainImageContainer: {
    flex: 3,
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  sideImages: {
    flex: 1,
    gap: 2,
  },
  sideImageContainer: {
    flex: 1,
    position: "relative",
  },
  sideImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  remainingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  fallbackImage: {
    width: "100%",
    height: 150,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryBadge: {
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 12,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFB800",
  },
  hoursBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hoursText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  transitWrapper: {
    flexDirection: "row",
    marginBottom: 8,
  },
  transitContent: {
    flex: 1,
    paddingVertical: 12,
    position: "relative",
    justifyContent: "center",
  },
  transitLine: {
    position: "absolute",
    left: -12, // Align with parent line? need fine tuning
    top: 0,
    bottom: 0,
    // width: 1,
    // borderLeftWidth: 1,
    // borderStyle: 'dotted'
  },
  transitBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  transitText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
