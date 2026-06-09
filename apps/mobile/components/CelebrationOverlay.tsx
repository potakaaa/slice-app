import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { hapticSuccess } from "@/lib/haptics";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const CONFETTI_COLORS = ["#FF5A00", "#FF8A00", "#22C55E", "#F59E0B", "#FFFFFF"];
const PIECE_COUNT = 24;
const VISIBLE_MS = 1900;

interface CelebrationOverlayProps {
  visible: boolean;
  title: string;
  message?: string;
  onDone: () => void;
}

interface PieceSpec {
  startX: number;
  color: string;
  size: number;
  delay: number;
  drift: number;
  duration: number;
}

/**
 * Full-screen celebration moment (Pillar 3: Emotional Connection).
 *
 * Confetti rains, a success badge springs in, and a success haptic fires.
 * Tap anywhere (or wait) to dismiss. Render this near the root of a screen
 * and drive it with a `visible` boolean.
 */
export function CelebrationOverlay({ visible, title, message, onDone }: CelebrationOverlayProps) {
  const pieces = useMemo<PieceSpec[]>(
    () =>
      Array.from({ length: PIECE_COUNT }, () => ({
        startX: Math.random() * SCREEN_W,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 7 + Math.random() * 7,
        delay: Math.random() * 250,
        drift: (Math.random() - 0.5) * 120,
        duration: 1400 + Math.random() * 700,
      })),
    // Reshuffle each time it becomes visible.
    [visible],
  );

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onDone} accessibilityRole="button">
        {pieces.map((p, i) => (
          <ConfettiPiece key={i} spec={p} />
        ))}
        <CelebrationBadge title={title} message={message} onDone={onDone} />
      </Pressable>
    </View>
  );
}

function CelebrationBadge({
  title,
  message,
  onDone,
}: {
  title: string;
  message?: string;
  onDone: () => void;
}) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    hapticSuccess();
    scale.value = withSequence(
      withSpring(1.06, { damping: 9, stiffness: 140 }),
      withSpring(1, { damping: 12, stiffness: 140 }),
    );
    // Fade in, hold while the moment lands, then fade out and dismiss.
    opacity.value = withSequence(
      withTiming(1, { duration: 220 }),
      withDelay(
        VISIBLE_MS,
        withTiming(0, { duration: 260, easing: Easing.in(Easing.ease) }, (finished) => {
          if (finished) runOnJS(onDone)();
        }),
      ),
    );
  }, [onDone, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.badgeWrap, style]} pointerEvents="none">
      <View style={styles.badgeIcon}>
        <Feather name="check" size={34} color="#FFFFFF" />
      </View>
      <Text style={styles.badgeTitle}>{title}</Text>
      {message ? <Text style={styles.badgeMessage}>{message}</Text> : null}
    </Animated.View>
  );
}

function ConfettiPiece({ spec }: { spec: PieceSpec }) {
  const translateY = useSharedValue(-40);
  const translateX = useSharedValue(spec.startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      spec.delay,
      withTiming(SCREEN_H + 60, { duration: spec.duration, easing: Easing.in(Easing.quad) }),
    );
    translateX.value = withDelay(
      spec.delay,
      withTiming(spec.startX + spec.drift, { duration: spec.duration, easing: Easing.inOut(Easing.ease) }),
    );
    rotate.value = withDelay(
      spec.delay,
      withTiming(360 * (spec.drift > 0 ? 2 : -2), { duration: spec.duration }),
    );
    opacity.value = withDelay(
      spec.delay + spec.duration - 400,
      withTiming(0, { duration: 400 }),
    );
  }, [opacity, rotate, spec, translateX, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        { width: spec.size, height: spec.size * 0.6, backgroundColor: spec.color },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  piece: {
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: 2,
  },
  badgeWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  badgeIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  badgeTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  badgeMessage: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 22,
  },
});
