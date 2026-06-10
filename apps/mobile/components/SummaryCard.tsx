import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { Card } from "./Card";

interface SummaryCardProps {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  subtitle?: string;
  accent?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SummaryCard({
  label,
  value,
  icon,
  subtitle,
  accent = false,
  style,
}: SummaryCardProps) {
  const colors = useColors();
  return (
    <Card
      style={[
        style,
        accent && { backgroundColor: colors.primary, borderColor: colors.primary },
      ]}
    >
      <Feather
        name={icon}
        size={16}
        color={accent ? "#FFFFFF" : colors.mutedForeground}
        style={styles.icon}
      />
      <Text
        style={[styles.value, { color: accent ? "#FFFFFF" : colors.foreground }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={[styles.label, { color: accent ? "#FFFFFF" : colors.mutedForeground }]}>
        {label}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: accent ? "#FFFFFF" : colors.mutedForeground }]}>
          {subtitle}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  icon: { marginBottom: 6 },
  value: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    marginTop: 1,
  },
});
