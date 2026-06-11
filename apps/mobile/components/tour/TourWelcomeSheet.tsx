import { Feather } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/useAppStore";

import { useTour } from "./TourProvider";

/**
 * First-run opt-in prompt. Renders only while `tutorialStatus === "pending"`.
 * Accepting starts the guided tour; "Skip for now" (or dismissing) opts out —
 * the tour stays replayable from More → Replay app tour.
 */
export function TourWelcomeSheet() {
  const tutorialStatus = useAppStore((s) => s.tutorialStatus);
  const { start, skip, reduceMotion } = useTour();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const visible = tutorialStatus === "pending";

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? "none" : "slide"}
      onRequestClose={skip}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={skip} accessibilityLabel="Dismiss" />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <View style={styles.handle} />
        <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
          <Feather name="compass" size={26} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Welcome to SLICE 👋</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          New here? Take a quick 30-second tour and we'll show you around. You can stop anytime.
        </Text>

        <Button label="Show me the tour" onPress={start} fullWidth style={styles.cta} />
        <Pressable
          onPress={skip}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Skip the tour for now"
          style={styles.skipBtn}
        >
          <Text style={[styles.skipLabel, { color: colors.mutedForeground }]}>Skip for now</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: "center",
    gap: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(128,128,128,0.35)",
    marginBottom: 6,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  cta: { marginTop: 6 },
  skipBtn: { paddingVertical: 6 },
  skipLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
