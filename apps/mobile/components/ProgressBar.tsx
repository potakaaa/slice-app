import React from "react";
import { StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  color?: string;
}

export function ProgressBar({ progress, height = 8, color }: ProgressBarProps) {
  const colors = useColors();
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: colors.muted, borderRadius: height / 2 },
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clamped * 100}%`,
            height,
            backgroundColor: color ?? colors.primary,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {},
});
