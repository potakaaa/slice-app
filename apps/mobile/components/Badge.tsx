import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { CreditorStatus } from "@/types";

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
}

export function Badge({ label, color, textColor }: BadgeProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color ?? colors.secondary },
      ]}
    >
      <Text
        style={[styles.text, { color: textColor ?? colors.secondaryForeground }]}
      >
        {label}
      </Text>
    </View>
  );
}

interface StatusBadgeProps {
  status: CreditorStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = useColors();
  const map: Record<CreditorStatus, { bg: string; text: string; label: string }> = {
    active: { bg: colors.secondary, text: colors.primary, label: "Active" },
    negotiating: { bg: "#FFF3CD", text: "#B45309", label: "Negotiating" },
    settled: { bg: "#DCFCE7", text: "#16A34A", label: "Settled" },
    closed: { bg: colors.muted, text: colors.mutedForeground, label: "Closed" },
  };
  const config = map[status];
  return <Badge label={config.label} color={config.bg} textColor={config.text} />;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
