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
  const draftOwnerId = useAppStore((state) => state.draftOwnerId);
  const markOnboardingSeen = useAppStore((state) => state.markOnboardingSeen);
  const clearDraft = useAppStore((state) => state.clearDraft);

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
      // The persisted onboarding draft is device-wide, so only trust the
      // "ready for the Program-Ready screen" flag when the draft was stamped by
      // THIS signed-in user. A draft owned by a previous/abandoned account (or
      // an unowned pre-v4 draft) would otherwise route a brand-new account
      // straight to "Your Program Is Ready" — skipping onboarding entirely.
      const draftValid =
        onboardingReadyForAuth && draftOwnerId === session.user.id;
      if (onboardingReadyForAuth && !draftValid) {
        clearDraft();
      }
      // First landing of a freshly-registered account, before they've finished
      // onboarding. Celebrate the sign-up exactly once — the root CelebrationHost
      // keeps the confetti on screen across the nav into onboarding, and `once`
      // dedupes permanently so returning users and re-renders never re-trigger it.
      celebrate("m1_registered", { once: true });
      router.replace(
        draftValid ? "/onboarding/complete" : "/onboarding/step1"
      );
    }
  }, [
    authLoading,
    hasHydrated,
    hasSeenOnboarding,
    onboardingReadyForAuth,
    draftOwnerId,
    markOnboardingSeen,
    clearDraft,
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
