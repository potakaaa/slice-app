import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/sliceData";

export default function Index() {
  const { loading: authLoading, session } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      router.replace("/auth");
      return;
    }
    if (profileLoading) return;
    if (profile.onboardingComplete) {
      router.replace("/(tabs)");
    } else {
      router.replace("/onboarding");
    }
  }, [authLoading, profile.onboardingComplete, profileLoading, session]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
      <ActivityIndicator size="large" color="#FF6B35" />
    </View>
  );
}
