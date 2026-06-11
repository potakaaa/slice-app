import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  formatCurrency,
  formatPct,
  formatReadyTimeline,
  getNextBestMove,
  type SettlementReadiness,
} from "@/utils/calculations";

function headlineFor(r: SettlementReadiness): string {
  switch (r.status) {
    case "ready":
      return "Settlement-ready now";
    case "almost":
      return "Almost ready";
    case "needs_input":
      return "Finish your plan";
    default:
      return r.daysUntilReady != null
        ? `Settlement-ready in ${formatReadyTimeline(r.daysUntilReady)}`
        : "Building your plan";
  }
}

function sublineFor(r: SettlementReadiness): string {
  switch (r.status) {
    case "ready":
      return "You have enough saved to make your first offer.";
    case "almost":
      return `You need ${formatCurrency(r.remainingNeeded)} more to reach your first offer target.`;
    case "needs_input":
      return `You need ${formatCurrency(r.remainingNeeded)} more. Add a monthly amount to see your timeline.`;
    default:
      return `Save ${formatCurrency(r.dailySetAside)}/day to reach your first offer fund.`;
  }
}

interface Props {
  readiness: SettlementReadiness;
}

/**
 * Outcome-first hero: the single emotionally clear answer to "am I ready to
 * make my first settlement offer, and if not, when?" Renders only when a
 * priority creditor exists (the home screen shows an empty state otherwise).
 */
export function SettlementReadinessCard({ readiness }: Props) {
  const colors = useColors();
  const creditor = readiness.priorityCreditor;
  if (!creditor) return null;

  const move = getNextBestMove(readiness);
  const hasMonthly = readiness.monthlySetAside > 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.primary }]}>
      <Text style={styles.eyebrow}>Settlement readiness</Text>
      <Text style={styles.headline}>{headlineFor(readiness)}</Text>
      <Text style={styles.subline}>{sublineFor(readiness)}</Text>

      {/* Target + progress */}
      <View style={styles.targetBlock}>
        <Text style={styles.targetLine}>
          {creditor.name} — {formatCurrency(readiness.firstOfferTarget)} (
          {formatPct(creditor.settlementPercentage)} of {formatCurrency(creditor.balance)})
        </Text>
        <View
          style={styles.progressTrack}
          accessibilityRole="progressbar"
          accessibilityLabel="Settlement fund progress"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(readiness.progress * 100) }}
        >
          <View style={[styles.progressFill, { width: `${readiness.progress * 100}%` }]} />
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressCaption}>
            Saved {formatCurrency(readiness.currentSaved)} of{" "}
            {formatCurrency(readiness.firstOfferTarget)}
          </Text>
          <Pressable
            onPress={() => router.push("/add-to-fund" as any)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Add to settlement fund"
          >
            <Text style={styles.addToFund}>+ Add to fund</Text>
          </Pressable>
        </View>
      </View>

      {/* Mini stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Daily</Text>
          <Text style={styles.statValue}>{hasMonthly ? formatCurrency(readiness.dailySetAside) : "—"}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Weekly</Text>
          <Text style={styles.statValue}>{hasMonthly ? formatCurrency(readiness.weeklySetAside) : "—"}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Saved</Text>
          <Text style={styles.statValue}>{formatCurrency(readiness.currentSaved)}</Text>
        </View>
      </View>

      {/* Next best move */}
      <Text style={styles.nextMove}>
        <Text style={styles.nextMoveLabel}>Next best move: </Text>
        {move.label}
      </Text>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push("/what-if" as any)}
          style={({ pressed }) => [styles.btnGhost, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.btnGhostText}>What if?</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/ai/script/${creditor.id}` as any)}
          style={({ pressed }) => [styles.btnSolid, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={[styles.btnSolidText, { color: colors.primary }]}>Generate script</Text>
        </Pressable>
      </View>

      <Text style={styles.disclaimer}>
        Estimates are for planning only and do not guarantee creditor acceptance.
      </Text>
    </View>
  );
}

const WHITE = "#FFFFFF";

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 20, gap: 10 },
  eyebrow: {
    color: WHITE,
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    opacity: 0.9,
  },
  headline: { color: WHITE, fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subline: { color: WHITE, fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 20, opacity: 0.95 },
  targetBlock: { gap: 6, marginTop: 4 },
  targetLine: { color: WHITE, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: WHITE },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  progressCaption: { color: WHITE, fontSize: 11, fontFamily: "Inter_500Medium", opacity: 0.9, flex: 1 },
  addToFund: { color: WHITE, fontSize: 12, fontFamily: "Inter_700Bold" },
  stats: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  stat: { flex: 1, gap: 2 },
  statLabel: { color: WHITE, fontSize: 10, fontFamily: "Inter_700Bold", opacity: 0.85 },
  statValue: { color: WHITE, fontSize: 16, fontFamily: "Inter_700Bold" },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: 12,
  },
  nextMove: { color: WHITE, fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 19, marginTop: 2 },
  nextMoveLabel: { fontFamily: "Inter_700Bold" },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  btnGhost: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnGhostText: { color: WHITE, fontSize: 14, fontFamily: "Inter_700Bold" },
  btnSolid: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnSolidText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  disclaimer: {
    color: WHITE,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    lineHeight: 14,
    opacity: 0.85,
    marginTop: 2,
  },
});
