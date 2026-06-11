import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface SegmentedPercentProps {
  /** Options as decimals, e.g. [0.3, 0.4, 0.5]. */
  options: number[];
  /** Currently selected option as a decimal. */
  value: number;
  onChange: (value: number) => void;
  /** When true each option flexes to fill the row evenly (settings layout).
   *  Default is intrinsic width with wrapping (onboarding layout). */
  fill?: boolean;
  disabled?: boolean;
}

/**
 * Shared settlement-percentage selector. Previously re-implemented inline in
 * onboarding and profile with subtly different styling; this unifies the look,
 * the selected-state comparison (rounded to avoid float drift), and the
 * accessibility semantics, and enforces a 44pt minimum touch target.
 */
export function SegmentedPercent({
  options,
  value,
  onChange,
  fill = false,
  disabled = false,
}: SegmentedPercentProps) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = Math.round(value * 100) === Math.round(option * 100);
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={`${Math.round(option * 100)} percent settlement target`}
            style={[
              styles.option,
              fill ? styles.fill : styles.intrinsic,
              {
                backgroundColor: selected ? colors.primary : colors.muted,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.text,
                { color: selected ? colors.primaryForeground : colors.foreground },
              ]}
            >
              {Math.round(option * 100)}%
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  option: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  intrinsic: { paddingHorizontal: 16 },
  fill: { flex: 1 },
  text: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
