import React, { useState, useEffect } from "react";
import { View, Text, Modal, TouchableOpacity, FlatList, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Search, Check } from "lucide-react-native";
import { useTheme } from "../ThemeProvider";
import { useDebounce } from "../../hooks/use-debounce";
import { searchCities } from "../../lib/vibe-api";
import { City } from "@trip-vibes/shared";

interface CitySelectProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (city: City) => void;
  selectedCityId?: string | null;
}

export function CitySelect({ visible, onClose, onSelect, selectedCityId }: CitySelectProps) {
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [results, setResults] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSearch("");
      setResults([]);
      return;
    }

    const query = debouncedSearch.trim();
    if (query.length < 2) {
      setResults([]);
      return;
    }

    let active = true;
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const data = await searchCities(query);
        if (active) {
          setResults(data);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchResults();

    return () => {
      active = false;
    };
  }, [debouncedSearch, visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-row justify-between items-center p-4 border-b border-border">
          <Text className="text-lg font-semibold text-foreground">Select Destination</Text>
          <TouchableOpacity onPress={onClose}>
            <X color={colors.foreground} size={24} />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center p-3 m-4 bg-muted rounded-xl">
          <Search size={20} color={colors.mutedForeground} className="mr-2" />
          <TextInput
            placeholder="Search cities..."
            value={search}
            onChangeText={setSearch}
            className="flex-1 text-base h-6 text-foreground"
            placeholderTextColor={colors.mutedForeground}
            autoFocus={false}
          />
          {isLoading && <ActivityIndicator size="small" color={colors.primary} className="ml-2" />}
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`flex-row justify-between items-center py-4 px-5 border-b border-border ${
                selectedCityId === item.id ? "bg-primary/10" : "bg-transparent"
              }`}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <View>
                <Text className="text-base font-semibold text-foreground mb-1">{item.name}</Text>
                <Text className="text-sm text-muted-foreground">{item.country}</Text>
              </View>
              {selectedCityId === item.id && <Check color={colors.primary} size={20} />}
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            !isLoading && search.length >= 2 ? (
              <View className="p-8 items-center">
                <Text className="text-sm text-muted-foreground">No cities found</Text>
              </View>
            ) : search.length > 0 && search.length < 2 ? (
              <View className="p-8 items-center">
                <Text className="text-sm text-muted-foreground">Type at least 2 characters</Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </Modal>
  );
}
