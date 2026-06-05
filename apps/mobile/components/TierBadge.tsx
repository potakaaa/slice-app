import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { SubscriptionTier } from "@/types";

const TIER_CONFIG: Record<SubscriptionTier, { bg: string; text: string; label: string }> = {
  free: { bg: "#E5E7EB", text: "#6B7280", label: "FREE" },
  silver: { bg: "#E8EBF0", text: "#64748B", label: "SILVER" },
  gold: { bg: "#FEF3C7", text: "#B45309", label: "GOLD" },
  platinum: { bg: "#EDE9FE", text: "#7C3AED", label: "PLATINUM" },
};

interface TierBadgeProps {
  tier: SubscriptionTier;
}

export function TierBadge({ tier }: TierBadgeProps) {
  const config = TIER_CONFIG[tier];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
});
