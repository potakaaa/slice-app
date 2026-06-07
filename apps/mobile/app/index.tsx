import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/sliceData";
import { useAppStore } from "@/store/useAppStore";

export default function Index() {
  const { loading: authLoading, session } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);
  const onboardingReadyForAuth = useAppStore((state) => state.onboardingReadyForAuth);
  const markOnboardingSeen = useAppStore((state) => state.markOnboardingSeen);

  useEffect(() => {
    if (authLoading || !hasHydrated) return;
    if (!session) {
      router.replace(hasSeenOnboarding ? "/auth" : "/onboarding");
      return;
    }
    if (profileLoading) return;
    if (profile.onboardingComplete) {
      markOnboardingSeen();
      router.replace("/(tabs)");
    } else if (onboardingReadyForAuth) {
      router.replace("/onboarding/complete");
    } else {
      router.replace("/onboarding");
    }
  }, [
    authLoading,
    hasHydrated,
    hasSeenOnboarding,
    onboardingReadyForAuth,
    markOnboardingSeen,
    profile.onboardingComplete,
    profileLoading,
    session,
  ]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
      <ActivityIndicator size="large" color="#FF5A00" />
    </View>
  );
}
