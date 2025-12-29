import { View, StyleSheet, ViewProps, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";

interface ScreenProps extends ViewProps {
  scrollable?: boolean;
  padded?: boolean;
  safeArea?: boolean;
  centered?: boolean;
  refreshControl?: React.ReactElement;
}

export function Screen({
  children,
  scrollable = false,
  padded = true,
  safeArea = true,
  centered = false,
  style,
  refreshControl,
  ...props
}: ScreenProps) {
  const colors = Colors.light; // TODO: Add dark mode support

  const containerStyle = [
    styles.container,
    { backgroundColor: colors.background },
    padded && styles.padded,
    centered && styles.centered,
    style,
  ];
  const wrapperStyle = { flex: 1 as const, backgroundColor: colors.background };

  if (scrollable && safeArea) {
    return (
      <SafeAreaView style={wrapperStyle}>
        <ScrollView
          contentContainerStyle={containerStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          {...props}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (scrollable) {
    return (
      <View style={wrapperStyle}>
        <ScrollView
          contentContainerStyle={containerStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...props}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  if (safeArea) {
    return (
      <SafeAreaView style={wrapperStyle} {...props}>
        <View style={containerStyle}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <View style={wrapperStyle} {...props}>
      <View style={containerStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: 20,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
});
