import React, { useState, useEffect } from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator } from "react-native";
import { Colors } from "../../constants/Colors";
import { X, Search, Check } from "lucide-react-native";
import { useDebounce } from "../../hooks/use-debounce";
import { searchCities, getCityById } from "../../lib/vibe-api";
import { City } from "@trip-vibes/shared";

interface CitySelectProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (city: City) => void;
  selectedCityId?: string | null;
}

export function CitySelect({ visible, onClose, onSelect, selectedCityId }: CitySelectProps) {
  const colors = Colors.light;
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Destination</Text>
          <TouchableOpacity onPress={onClose}>
            <X color={colors.foreground} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={colors.mutedForeground} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search cities..."
            value={search}
            onChangeText={setSearch}
            style={[styles.input, { color: colors.foreground }]}
            placeholderTextColor={colors.mutedForeground}
            autoFocus={false}
          />
          {isLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />}
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.item,
                { backgroundColor: selectedCityId === item.id ? colors.primary + "10" : "transparent" },
              ]}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <View>
                <Text style={[styles.cityName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.countryName, { color: colors.mutedForeground }]}>{item.country}</Text>
              </View>
              {selectedCityId === item.id && <Check color={colors.primary} size={20} />}
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            !isLoading && search.length >= 2 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No cities found</Text>
              </View>
            ) : search.length > 0 && search.length < 2 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Type at least 2 characters</Text>
              </View>
            ) : null
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    margin: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: 24,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cityName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  countryName: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
});
