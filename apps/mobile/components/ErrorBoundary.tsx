import React from "react";
import { View, Text, SafeAreaView } from "react-native";
import { Button } from "./ui/Button";

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
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 justify-center items-center bg-background">
          <View className="p-5 w-full items-center">
            <Text className="text-2xl font-bold mb-2.5 text-foreground">Something went wrong</Text>
            <Text className="text-base text-center opacity-80 text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred."}
            </Text>

            <Button title="Try Again" onPress={this.resetError} className="mt-5" />
            <Button
              title="Go Home"
              variant="ghost"
              onPress={() => {
                // In an actual app, we'd use router.replace('/')
                // but linking can be a fallback for ErrorBoundary
                this.resetError();
              }}
              className="mt-2.5"
            />
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
