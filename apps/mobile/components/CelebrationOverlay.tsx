import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useReduceMotion } from "@/hooks/useReduceMotion";
import { hapticSuccess } from "@/lib/haptics";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const CONFETTI_COLORS = ["#FF5A00", "#FF8A00", "#22C55E", "#F59E0B", "#FFFFFF"];
const PIECE_COUNT = 24;
const HERO_PIECE_COUNT = 60;
const VISIBLE_MS = 1900;
const HERO_VISIBLE_MS = 3200;

type CelebrationVariant = "standard" | "hero";

interface CelebrationOverlayProps {
  visible: boolean;
  title: string;
  message?: string;
  onDone: () => void;
  /** "hero" = the debt-free peak: more confetti, longer hold. */
  variant?: CelebrationVariant;
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
export function CelebrationOverlay({
  visible,
  title,
  message,
  onDone,
  variant = "standard",
}: CelebrationOverlayProps) {
  const reduceMotion = useReduceMotion();
  const pieceCount = variant === "hero" ? HERO_PIECE_COUNT : PIECE_COUNT;
  const holdMs = variant === "hero" ? HERO_VISIBLE_MS : VISIBLE_MS;

  const pieces = useMemo<PieceSpec[]>(
    () =>
      // Suppress confetti for reduce-motion users; the message + haptic remain.
      reduceMotion
        ? []
        : Array.from({ length: pieceCount }, () => ({
            startX: Math.random() * SCREEN_W,
            color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            size: 7 + Math.random() * 7,
            delay: Math.random() * 250,
            drift: (Math.random() - 0.5) * 120,
            duration: 1400 + Math.random() * 700,
          })),
    // Reshuffle each time it becomes visible.
    [visible, pieceCount, reduceMotion],
  );

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onDone} accessibilityRole="button">
        {pieces.map((p, i) => (
          <ConfettiPiece key={i} spec={p} />
        ))}
        <CelebrationBadge title={title} message={message} holdMs={holdMs} onDone={onDone} />
      </Pressable>
    </View>
  );
}

function CelebrationBadge({
  title,
  message,
  holdMs,
  onDone,
}: {
  title: string;
  message?: string;
  holdMs: number;
  onDone: () => void;
}) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    hapticSuccess();
    const animation = Animated.parallel([
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.06,
          damping: 9,
          stiffness: 140,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 12,
          stiffness: 140,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.delay(holdMs),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished) onDone();
    });

    return () => {
      animation.stop();
    };
  }, [holdMs, onDone, opacity, scale]);

  return (
    <Animated.View
      style={[styles.badgeWrap, { opacity, transform: [{ scale }] }]}
      pointerEvents="none"
    >
      <View style={styles.badgeIcon}>
        <Feather name="check" size={34} color="#FFFFFF" />
      </View>
      <Text style={styles.badgeTitle}>{title}</Text>
      {message ? <Text style={styles.badgeMessage}>{message}</Text> : null}
    </Animated.View>
  );
}

function ConfettiPiece({ spec }: { spec: PieceSpec }) {
  const translateY = useRef(new Animated.Value(-40)).current;
  const translateX = useRef(new Animated.Value(spec.startX)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = Animated.delay(spec.delay);
    const animation = Animated.parallel([
      Animated.sequence([
        delay,
        Animated.timing(translateY, {
          toValue: SCREEN_H + 60,
          duration: spec.duration,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(spec.delay),
        Animated.timing(translateX, {
          toValue: spec.startX + spec.drift,
          duration: spec.duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(spec.delay),
        Animated.timing(rotate, {
          toValue: spec.drift > 0 ? 2 : -2,
          duration: spec.duration,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(spec.delay + spec.duration - 400),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start();
    return () => animation.stop();
  }, [opacity, rotate, spec, translateX, translateY]);

  const rotation = rotate.interpolate({
    inputRange: [-2, 2],
    outputRange: ["-720deg", "720deg"],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        { width: spec.size, height: spec.size * 0.6, backgroundColor: spec.color },
        {
          opacity,
          transform: [{ translateX }, { translateY }, { rotate: rotation }],
        },
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
