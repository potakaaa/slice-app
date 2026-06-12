import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useReduceMotion } from "@/hooks/useReduceMotion";
import { hapticLight } from "@/lib/haptics";

const VISIBLE_MS = 4500;

interface ToastProps {
  title: string;
  message?: string;
  onDone: () => void;
}

/**
 * Lightweight bottom toast (Pillar 3, T1 micro celebrations).
 *
 * Non-blocking affirmation for small wins — slides up, holds ~2.2s, fades out.
 * Tap to dismiss early. Honors reduce-motion (cross-fade instead of slide) and
 * announces itself to screen readers. Driven by `CelebrationHost`, not mounted
 * per-screen.
 */
export function Toast({ title, message, onDone }: ToastProps) {
  const reduceMotion = useReduceMotion();
  const translateY = useRef(new Animated.Value(reduceMotion ? 0 : 40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    hapticLight();
    AccessibilityInfo.announceForAccessibility(
      message ? `${title}. ${message}` : title,
    );

    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(VISIBLE_MS),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 240,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => animation.stop();
  }, [message, onDone, opacity, title, translateY]);

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Animated.View
        style={[styles.toast, { opacity, transform: [{ translateY }] }]}
        accessibilityRole="alert"
      >
        <Pressable style={styles.row} onPress={onDone} accessibilityRole="button">
          <View style={styles.icon}>
            <Feather name="check" size={16} color="#FFFFFF" />
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "web" ? 40 : 90,
  },
  toast: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#1F1B16",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 1 },
  title: { color: "#FFFFFF", fontSize: 14, fontFamily: "Inter_700Bold" },
  message: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12.5,
    fontFamily: "Inter_500Medium",
    lineHeight: 17,
  },
})
