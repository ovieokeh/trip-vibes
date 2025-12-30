import React from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Text,
  SafeAreaView,
} from "react-native";
import { X, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useTheme } from "../../components/ThemeProvider";
import { API_URL } from "../../lib/api";

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
  const flatListRef = React.useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  React.useEffect(() => {
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
    <View style={styles.imageContainer}>
      {item.url ? (
        <Image source={{ uri: getImageUri(item.url) }} style={styles.fullImage} resizeMode="contain" />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: colors.muted }]} />
      )}
    </View>
  );

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title} numberOfLines={1}>
                {title || "Photos"}
              </Text>
              <Text style={styles.subtitle}>
                {currentIndex + 1} of {photos.length}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#fff" size={24} />
            </TouchableOpacity>
          </View>

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
            <View style={styles.controls}>
              <TouchableOpacity
                onPress={() => flatListRef.current?.scrollToIndex({ index: Math.max(0, currentIndex - 1) })}
                disabled={currentIndex === 0}
                style={[styles.navButton, currentIndex === 0 && styles.disabled]}
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
                style={[styles.navButton, currentIndex === photos.length - 1 && styles.disabled]}
              >
                <ChevronRight color="#fff" size={32} />
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
  closeButton: {
    padding: 8,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    aspectRatio: 1,
  },
  controls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    pointerEvents: "box-none",
  },
  navButton: {
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 30,
  },
  disabled: {
    opacity: 0.3,
  },
});
