import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { TIER_META } from "@/lib/tierBenefits";
import type { SubscriptionTier } from "@/types";

// Soft chip background per tier (used by the default, non-gradient variant).
const CHIP_BG: Record<SubscriptionTier, string> = {
  free: "#E5E7EB",
  silver: "#E8EBF0",
  gold: "#FEF3C7",
  platinum: "#EDE9FE",
};

interface TierBadgeProps {
  tier: SubscriptionTier;
  size?: "sm" | "lg";
  /** Render a filled gradient badge with white text for hero/prestige usage. */
  gradient?: boolean;
}

export function TierBadge({ tier, size = "sm", gradient = false }: TierBadgeProps) {
  const meta = TIER_META[tier];
  const large = size === "lg";
  const iconSize = large ? 16 : 11;

  if (gradient) {
    return (
      <LinearGradient
        colors={meta.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badge, large ? styles.badgeLg : styles.badgeSm]}
      >
        <Feather name={meta.icon} size={iconSize} color="#FFFFFF" />
        <Text style={[styles.text, large ? styles.textLg : styles.textSm, { color: "#FFFFFF" }]}>
          {meta.label.toUpperCase()}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.badge,
        large ? styles.badgeLg : styles.badgeSm,
        { backgroundColor: CHIP_BG[tier] },
      ]}
    >
      <Feather name={meta.icon} size={iconSize} color={meta.color} />
      <Text style={[styles.text, large ? styles.textLg : styles.textSm, { color: meta.color }]}>
        {meta.label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  badgeSm: {
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeLg: {
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9,
  },
  text: {
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  textSm: { fontSize: 11 },
  textLg: { fontSize: 13 },
});
