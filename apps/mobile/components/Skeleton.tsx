import React, { useEffect } from "react";
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Branded shimmer placeholder (Pillar 2: Smooth UX).
 *
 * Replaces bare spinners so loads read as "content arriving" rather than
 * "app stalled".
 */
export function Skeleton({ width = "100%", height = 16, radius = 8, style }: SkeletonProps) {
  const colors = useColors();
  const progress = useSharedValue(0.4);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(progress);
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.muted },
        animatedStyle,
        style,
      ]}
    />
  );
}

/**
 * A small stack of skeleton lines for full-screen loading states.
 */
export function SkeletonScreen() {
  return (
    <View style={styles.screen}>
      <Skeleton width={140} height={28} radius={10} />
      <Skeleton width="100%" height={120} radius={16} style={styles.block} />
      <View style={styles.row}>
        <Skeleton width="48%" height={72} radius={12} />
        <Skeleton width="48%" height={72} radius={12} />
      </View>
      <Skeleton width="100%" height={96} radius={12} style={styles.block} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { width: "100%", paddingHorizontal: 16, paddingTop: 24, gap: 14 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  block: { marginTop: 4 },
});
