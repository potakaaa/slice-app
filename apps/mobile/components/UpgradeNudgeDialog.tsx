import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { TIER_BENEFITS, TIER_META } from "@/lib/tierBenefits";
import { useAppStore } from "@/store/useAppStore";
import { useCelebrationStore } from "@/store/useCelebrationStore";

/**
 * Weekly upgrade nudge for free users.
 *
 * Once every 7 days, a free user who has finished onboarding sees an
 * encouraging popup inviting them to unlock the paid AI negotiation tools.
 * The cadence is stamped via `markUpgradePrompted()` the moment it appears, so
 * it can only show once per week and never stacks on the same session it first
 * fires. It also stands down while a celebration is on screen so it never
 * buries confetti. Dismissing ("Not now") is always one tap away — the nudge is
 * a gentle invitation, not a wall.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
/** How often (days) a free user may see the upgrade nudge. */
const UPGRADE_PROMPT_INTERVAL_DAYS = 7;
/** The first paid tier we upsell free users to. */
const TARGET_TIER = "silver" as const;

function daysSince(timestamp: number | null): number {
  if (timestamp == null) return Number.POSITIVE_INFINITY;
  return (Date.now() - timestamp) / DAY_MS;
}

export function UpgradeNudgeDialog() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const tier = useAppStore((s) => s.profile.tier);
  const onboardingComplete = useAppStore((s) => s.profile.onboardingComplete);
  const sessionCount = useAppStore((s) => s.sessionCount);
  const lastUpgradePromptAt = useAppStore((s) => s.lastUpgradePromptAt);
  const markUpgradePrompted = useAppStore((s) => s.markUpgradePrompted);
  const celebrationActive = useCelebrationStore((s) => s.active !== null);

  // Local visibility so dismissing closes the modal immediately without waiting
  // on the persisted timestamp to propagate.
  const [open, setOpen] = useState(false);

  const eligible =
    hasHydrated &&
    tier === "free" &&
    onboardingComplete &&
    // Never on the very first session — keep the first run free of upsell so it
    // doesn't stack with onboarding / savings / review prompts.
    sessionCount > 1 &&
    !celebrationActive &&
    daysSince(lastUpgradePromptAt) >= UPGRADE_PROMPT_INTERVAL_DAYS;

  // When the user becomes eligible, open the nudge and immediately stamp the
  // cooldown so it can't re-trigger this week (even across re-renders/remounts).
  useEffect(() => {
    if (eligible) {
      setOpen(true);
      markUpgradePrompted();
    }
  }, [eligible, markUpgradePrompted]);

  const benefits = TIER_BENEFITS[TARGET_TIER].headline;
  const tierLabel = TIER_META[TARGET_TIER].label;

  const dismiss = () => setOpen(false);
  const seePlans = () => {
    setOpen(false);
    router.push("/pricing");
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={dismiss} accessibilityLabel="Dismiss" />
      <View style={styles.centerWrap} pointerEvents="box-none">
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              marginBottom: insets.bottom,
            },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
            <Feather name="zap" size={26} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            Unlock AI tools 🚀
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            You're doing the hard part. Let an AI coach draft the exact words to settle
            for less — and negotiate with confidence.
          </Text>

          <View style={styles.benefits}>
            {benefits.map((benefit) => (
              <View key={benefit} style={styles.benefitRow}>
                <Feather name="check-circle" size={16} color={colors.primary} />
                <Text style={[styles.benefitText, { color: colors.foreground }]}>
                  {benefit}
                </Text>
              </View>
            ))}
          </View>

          <Button
            label={`Unlock ${tierLabel}`}
            onPress={seePlans}
            fullWidth
            style={styles.cta}
          />
          <Pressable
            onPress={dismiss}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Not now"
            style={styles.dismissBtn}
          >
            <Text style={[styles.dismissLabel, { color: colors.mutedForeground }]}>
              Not now
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 22,
    paddingVertical: 22,
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
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
  benefits: {
    alignSelf: "stretch",
    gap: 10,
    marginTop: 4,
  },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  cta: { marginTop: 8, alignSelf: "stretch" },
  dismissBtn: { paddingVertical: 6 },
  dismissLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
