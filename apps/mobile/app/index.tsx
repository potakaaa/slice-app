import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAppStore } from "@/store/useAppStore";

export default function Index() {
  const hasHydrated = useAppStore((s) => s._hasHydrated);
  const onboardingComplete = useAppStore((s) => s.profile.onboardingComplete);

  useEffect(() => {
    useAppStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (onboardingComplete) {
      router.replace("/(tabs)");
    } else {
      router.replace("/onboarding");
    }
  }, [hasHydrated, onboardingComplete]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
      <ActivityIndicator size="large" color="#FF6B35" />
    </View>
  );
}
