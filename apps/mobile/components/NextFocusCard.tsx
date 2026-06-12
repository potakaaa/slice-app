import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  formatCurrency,
  formatReadyTimeline,
  getNextBestMove,
  type SettlementReadiness,
} from "@/utils/calculations";
import { Card } from "./Card";

interface Props {
  readiness: SettlementReadiness;
}

type Pill = { label: string; bg: string; fg: string };

/**
 * Compact, glanceable "next focus" card for the home screen. Surfaces the
 * single priority creditor's first-offer status in a quiet, light card — broken
 * into small rows (who, where you stand, one action) so it supports the
 * whole-program hero rather than competing with it.
 */
export function NextFocusCard({ readiness }: Props) {
  const colors = useColors();
  const creditor = readiness.priorityCreditor;
  if (!creditor) return null;

  const move = getNextBestMove(readiness);
  const hasTarget = readiness.firstOfferTarget > 0;
  const pct = Math.round(readiness.progress * 100);

  const pill: Pill = (() => {
    switch (readiness.status) {
      case "ready":
        return { label: "Ready", bg: colors.success, fg: colors.successForeground };
      case "almost":
        return { label: "Almost ready", bg: colors.warning, fg: colors.warningForeground };
      case "needs_input":
        return { label: "Add savings", bg: colors.secondary, fg: colors.secondaryForeground };
      default:
        return {
          label:
            readiness.daysUntilReady != null
              ? formatReadyTimeline(readiness.daysUntilReady)
              : "In progress",
          bg: colors.secondary,
          fg: colors.secondaryForeground,
        };
    }
  })();

  const subline = (() => {
    switch (readiness.status) {
      case "ready":
        return "You have enough saved to make your first offer.";
      case "needs_input":
        return "Add a suggested monthly amount to see your timeline.";
      default:
        return `${formatCurrency(readiness.remainingNeeded)} to go for your first offer.`;
    }
  })();

  return (
    <Card style={styles.card}>
      {/* Who + status */}
      <View style={styles.headerRow}>
        <View style={styles.identity}>
          <View style={[styles.iconBadge, { backgroundColor: colors.secondary }]}>
            <Feather name="target" size={16} color={colors.primary} />
          </View>
          <View style={styles.identityText}>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>FIRST OFFER</Text>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
              {creditor.name}
            </Text>
          </View>
        </View>
        <View style={[styles.pill, { backgroundColor: pill.bg }]}>
          <Text style={[styles.pillText, { color: pill.fg }]}>{pill.label}</Text>
        </View>
      </View>

      {/* Where you stand */}
      <Text style={[styles.subline, { color: colors.foreground }]}>{subline}</Text>

      {/* Slim progress */}
      {hasTarget && (
        <View style={styles.progressBlock}>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <View
              style={[styles.progressFill, { backgroundColor: colors.primary, width: `${readiness.progress * 100}%` }]}
              accessibilityRole="progressbar"
              accessibilityLabel="First offer fund progress"
              accessibilityValue={{ min: 0, max: 100, now: pct }}
            />
          </View>
          <Text style={[styles.progressCaption, { color: colors.mutedForeground }]}>
            Saved {formatCurrency(readiness.currentSaved)} of {formatCurrency(readiness.firstOfferTarget)}
          </Text>
        </View>
      )}

      {/* One clear action + a quiet fund link */}
      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push(move.route as any)}
          style={({ pressed }) => [styles.cta, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel={move.actionLabel}
        >
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>{move.actionLabel}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/add-to-fund" as any)}
          hitSlop={8}
          style={({ pressed }) => [styles.fundLink, { opacity: pressed ? 0.6 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Add to settlement fund"
        >
          <Feather name="plus" size={14} color={colors.primary} />
          <Text style={[styles.fundLinkText, { color: colors.primary }]}>Add to fund</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  identity: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  identityText: { flex: 1, gap: 1 },
  eyebrow: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.6 },
  name: { fontSize: 16, fontFamily: "Inter_700Bold" },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  subline: { fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  progressBlock: { gap: 5 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  progressCaption: { fontSize: 11, fontFamily: "Inter_500Medium" },
  actions: { flexDirection: "row", alignItems: "center", gap: 12 },
  cta: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  fundLink: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 4 },
  fundLinkText: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
