import React, { useRef, useState, useEffect } from "react";
import { Modal, View, TouchableOpacity, Image, Dimensions, FlatList, Text, SafeAreaView } from "react-native";
import { X, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useTheme } from "../../components/ThemeProvider";
import { API_URL } from "../../lib/api";

import { BlurView } from "expo-blur";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const getImageUri = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("/")) {
    return `${API_URL}${url}`;
  }
  return url;
};

interface Photo {
  url?: string;
}

interface PhotoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Photo[];
  initialIndex?: number;
  title?: string;
}

export function PhotoGalleryModal({ isOpen, onClose, photos, initialIndex = 0, title }: PhotoGalleryModalProps) {
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      // Wait for next tick to ensure layout
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
        });
      }, 0);
    }
  }, [isOpen, initialIndex]);

  const onScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const renderItem = ({ item }: { item: Photo }) => (
    <View className="w-screen h-full justify-center items-center" style={{ width: SCREEN_WIDTH }}>
      {item.url ? (
        <Image source={{ uri: getImageUri(item.url) }} className="w-full h-full" resizeMode="contain" />
      ) : (
        <View className="w-full aspect-square" style={{ backgroundColor: colors.muted }} />
      )}
    </View>
  );

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/95">
        <BlurView intensity={20} tint="dark" className="absolute top-0 inset-x-0 z-10">
          <SafeAreaView>
            <View className="h-[60px] flex-row items-center justify-between px-5">
              <View className="flex-1">
                <Text className="text-white text-base font-bold" numberOfLines={1}>
                  {title || "Photos"}
                </Text>
                <Text className="text-white/60 text-[12px]">
                  {currentIndex + 1} of {photos.length}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} className="p-2">
                <X color="#fff" size={24} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </BlurView>

        <FlatList
          ref={flatListRef}
          data={photos}
          renderItem={renderItem}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />

        {photos.length > 1 && (
          <View className="absolute bottom-10 inset-x-0 flex-row justify-between px-10">
            <TouchableOpacity
              onPress={() => flatListRef.current?.scrollToIndex({ index: Math.max(0, currentIndex - 1) })}
              disabled={currentIndex === 0}
              className={`p-2.5 bg-white/10 rounded-full ${currentIndex === 0 ? "opacity-30" : ""}`}
            >
              <ChevronLeft color="#fff" size={32} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                flatListRef.current?.scrollToIndex({
                  index: Math.min(photos.length - 1, currentIndex + 1),
                })
              }
              disabled={currentIndex === photos.length - 1}
              className={`p-2.5 bg-white/10 rounded-full ${currentIndex === photos.length - 1 ? "opacity-30" : ""}`}
            >
              <ChevronRight color="#fff" size={32} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}
