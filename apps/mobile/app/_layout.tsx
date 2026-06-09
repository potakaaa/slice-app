import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/lib/auth";
import { initCrashReporting, reportError } from "@/lib/crashReporting";
import { RevenueCatProvider } from "@/lib/revenueCat";

SplashScreen.preventAutoHideAsync();
initCrashReporting();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back", headerTintColor: "#FF5A00", headerBackVisible: Platform.OS !== "ios" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen
        name="creditor/add"
        options={{ title: "Add Creditor", presentation: "modal" }}
      />
      <Stack.Screen name="creditor/[id]" options={{ title: "Creditor Detail" }} />
      <Stack.Screen
        name="creditor/edit/[id]"
        options={{ title: "Edit Creditor", presentation: "modal" }}
      />
      <Stack.Screen
        name="creditor/log-call/[id]"
        options={{ title: "Log a Call", presentation: "modal" }}
      />
      <Stack.Screen
        name="add-to-fund"
        options={{ title: "Add to Settlement Fund", presentation: "modal" }}
      />
      <Stack.Screen name="ai/strategy/[id]" options={{ title: "AI Strategy" }} />
      <Stack.Screen name="ai/script/[id]" options={{ title: "AI Script" }} />
      <Stack.Screen name="calculator" options={{ title: "Settlement Calculator" }} />
      <Stack.Screen name="what-if" options={{ title: "What-If Simulator" }} />
      <Stack.Screen name="savings-planner" options={{ title: "Savings Planner" }} />
      <Stack.Screen name="snowball" options={{ title: "Snowball Timeline" }} />
      <Stack.Screen name="credit-repair" options={{ title: "Credit Repair" }} />
      <Stack.Screen name="coaching" options={{ title: "Coaching with Marc" }} />
      <Stack.Screen name="pricing" options={{ title: "Upgrade Plan" }} />
      <Stack.Screen name="profile" options={{ title: "Profile & Settings" }} />
      <Stack.Screen name="legal" options={{ title: "Legal Disclaimer" }} />
      <Stack.Screen name="privacy-policy" options={{ title: "Privacy Policy" }} />
      <Stack.Screen name="terms" options={{ title: "Terms and Conditions" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary
        onError={(error, componentStack) => reportError(error, { componentStack })}
      >
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RevenueCatProvider>
              <GestureHandlerRootView>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </RevenueCatProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
