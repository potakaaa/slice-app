import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";

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
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.muted },
        { opacity },
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
