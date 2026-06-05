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
      <View style={styles.row}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: accent ? "rgba(255,255,255,0.2)" : colors.secondary,
            },
          ]}
        >
          <Feather
            name={icon}
            size={18}
            color={accent ? "#FFFFFF" : colors.primary}
          />
        </View>
        <View style={styles.textGroup}>
          <Text
            style={[
              styles.label,
              { color: accent ? "rgba(255,255,255,0.8)" : colors.mutedForeground },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              styles.value,
              { color: accent ? "#FFFFFF" : colors.foreground },
            ]}
          >
            {value}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: accent ? "rgba(255,255,255,0.7)" : colors.mutedForeground },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textGroup: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  value: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
