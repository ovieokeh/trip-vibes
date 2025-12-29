import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { Redirect } from "expo-router";
import { Button } from "./ui/Button";
import { Colors } from "../constants/Colors";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  resetError = () => {
    this.state = { hasError: false, error: null };
    this.forceUpdate(); // Force re-render just in case
    // Optionally navigate home
  };

  render() {
    if (this.state.hasError) {
      const colors = Colors.light;

      return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.foreground }]}>Something went wrong</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {this.state.error?.message || "An unexpected error occurred."}
            </Text>

            <Button title="Try Again" onPress={this.resetError} style={{ marginTop: 20 }} />
            {/* Added a home button just in case state is corrupted */}
            <Button
              title="Go Home"
              variant="ghost"
              onPress={() => (window.location ? (window.location.href = "/") : undefined)} // Fallback or use a prop to redirect?
              // Class components calling hooks is tricky.
              // We might need to wrap this.
              style={{ marginTop: 10 }}
            />
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
  },
});
