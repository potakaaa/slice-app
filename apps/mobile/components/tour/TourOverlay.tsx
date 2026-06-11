import React from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

import { useTour } from "./TourProvider";

/**
 * First-run tour card: a small, non-blocking explainer pinned just above the tab
 * bar so the user can still see the page it's describing. The tour auto-navigates
 * to each tab; the user steps through with Back / Next. Renders nothing when the
 * tour is inactive.
 */
export function TourOverlay() {
  const { isActive, step, stepIndex, totalSteps, reduceMotion, next, prev, skip, finish } = useTour();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (!isActive || !step) return null;

  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= totalSteps - 1;
  const tabBarClearance = (Platform.OS === "web" ? 90 : 64) + insets.bottom + 10;

  return (
    <Modal
      visible
      transparent
      animationType={reduceMotion ? "none" : "slide"}
      statusBarTranslucent
      onRequestClose={skip}
    >
      {/* No dim — the page stays visible. This wrapper only positions the card. */}
      <View style={[styles.wrap, { paddingBottom: tabBarClearance }]} pointerEvents="box-none">
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.progress, { color: colors.primary }]}>
              Step {stepIndex + 1} of {totalSteps}
            </Text>
            <View style={styles.dots}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, { backgroundColor: i === stepIndex ? colors.primary : colors.border }]}
                />
              ))}
            </View>
            <Pressable onPress={skip} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close tour">
              <Text style={[styles.close, { color: colors.mutedForeground }]}>✕</Text>
            </Pressable>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>{step.title}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>{step.body}</Text>

          <View style={styles.actions}>
            <Pressable onPress={skip} hitSlop={8} accessibilityRole="button" accessibilityLabel="Skip tour">
              <Text style={[styles.skip, { color: colors.mutedForeground }]}>Skip</Text>
            </Pressable>

            <View style={styles.navBtns}>
              {!isFirst && (
                <Pressable
                  onPress={prev}
                  accessibilityRole="button"
                  accessibilityLabel="Previous step"
                  style={({ pressed }) => [
                    styles.backBtn,
                    { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.backLabel, { color: colors.foreground }]}>Back</Text>
                </Pressable>
              )}
              <Pressable
                onPress={isLast ? finish : next}
                accessibilityRole="button"
                accessibilityLabel={isLast ? "Finish tour" : "Next step"}
                style={({ pressed }) => [
                  styles.nextBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={[styles.nextLabel, { color: colors.primaryForeground }]}>
                  {isLast ? "Finish" : "Next"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.22,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  progress: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dots: { flexDirection: "row", gap: 5, flex: 1, justifyContent: "center" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  close: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  title: { fontSize: 16, fontFamily: "Inter_700Bold", lineHeight: 21 },
  body: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  skip: { fontSize: 13, fontFamily: "Inter_500Medium" },
  navBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
  },
  backLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  nextBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 9,
  },
  nextLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
