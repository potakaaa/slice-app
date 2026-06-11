import { router } from "expo-router";
import React, { useEffect } from "react";
import { View } from "react-native";

import { SkeletonScreen } from "@/components/Skeleton";
import { useAuth } from "@/lib/auth";
import { celebrate } from "@/lib/celebrate";
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
    } else {
      // First landing of a freshly-registered account, before they've finished
      // onboarding. Celebrate the sign-up exactly once — the root CelebrationHost
      // keeps the confetti on screen across the nav into onboarding, and `once`
      // dedupes permanently so returning users and re-renders never re-trigger it.
      celebrate("m1_registered", { once: true });
      router.replace(
        onboardingReadyForAuth ? "/onboarding/complete" : "/onboarding/step1"
      );
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
    <View style={{ flex: 1, backgroundColor: "#FFFFFF", justifyContent: "center" }}>
      <SkeletonScreen />
    </View>
  );
}
