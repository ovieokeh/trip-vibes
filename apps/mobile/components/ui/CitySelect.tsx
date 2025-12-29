import React, { useState } from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList, TextInput } from "react-native";
import { Colors } from "../../constants/Colors";
import { X, Search, Check } from "lucide-react-native";

// Shared interface or local definition
interface City {
  id: string;
  name: string;
  country: string;
}

// Temporary hardcoded list matching some likely database entries
const POPULAR_CITIES: City[] = [
  { id: "amsterdam", name: "Amsterdam", country: "Netherlands" },
  { id: "london", name: "London", country: "United Kingdom" },
  { id: "paris", name: "Paris", country: "France" },
  { id: "new-york", name: "New York", country: "United States" },
  { id: "tokyo", name: "Tokyo", country: "Japan" },
  { id: "barcelona", name: "Barcelona", country: "Spain" },
  { id: "berlin", name: "Berlin", country: "Germany" },
  { id: "rome", name: "Rome", country: "Italy" },
];

interface CitySelectProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (city: City) => void;
  selectedCityId?: string | null;
}

export function CitySelect({ visible, onClose, onSelect, selectedCityId }: CitySelectProps) {
  const colors = Colors.light;
  const [search, setSearch] = useState("");

  const filteredCities = POPULAR_CITIES.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

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
        </View>

        <FlatList
          data={filteredCities}
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
});
