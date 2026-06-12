import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  calcDebtFreeDate,
  formatCurrency,
  formatPct,
  formatProgramLength,
} from "@/utils/calculations";

interface ProgramSnapshotHeroProps {
  /** Personalized program name, e.g. "Marc's Customized Debt Program". */
  programName: string;
  /** Total amount owed across all creditors. */
  totalDebt: number;
  /** Amount needed to settle the whole program (sum of settlement targets). */
  totalTarget: number;
  /** Total dollars saved vs. paying in full (totalDebt - totalTarget). */
  savings: number;
  /** Percent off the full balance (savings / totalDebt), rounded. */
  savingsRatio: number;
  /** Cash already set aside toward the program (profile.currentSavedCash). */
  currentSaved: number;
  /** Program length in months. */
  months: number;
  /** Suggested monthly savings (never framed as a requirement). */
  suggestedMonthly: number;
  /** Settlement percentage target, as a decimal (e.g. 0.5). */
  settlementPct: number;
  /** Tapping the hero opens the savings planner. */
  onPress: () => void;
}

/**
 * Celebrate-first whole-program hero. The first program content on the home
 * screen: the user's name + program, an overall progress story (saved vs. the
 * whole settlement target), the debt-free date, and the program's headline
 * numbers. Pure/presentational — all values are computed by the caller.
 */
export function ProgramSnapshotHero({
  programName,
  totalDebt,
  totalTarget,
  savings,
  savingsRatio,
  currentSaved,
  months,
  suggestedMonthly,
  settlementPct,
  onPress,
}: ProgramSnapshotHeroProps) {
  const progress =
    totalTarget > 0 ? Math.min(1, Math.max(0, currentSaved / totalTarget)) : 0;
  const pct = Math.round(progress * 100);

  let celebration: string;
  if (currentSaved <= 0) {
    celebration = "Your plan is set 🎯 Every dollar you set aside moves this bar.";
  } else if (pct >= 100) {
    celebration = "You've saved enough to settle your whole program 🎉";
  } else {
    celebration = `You're ${pct}% of the way to settling — keep going!`;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${programName}. ${formatCurrency(currentSaved)} saved of ${formatCurrency(totalTarget)} to settle. Tap to plan your savings.`}
      style={({ pressed }) => [styles.wrapper, { opacity: pressed ? 0.92 : 1 }]}
    >
      <LinearGradient
        colors={["#FF5A00", "#FF8A00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Title + settlement badge */}
        <View style={styles.headerRow}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{programName}</Text>
            <Text style={styles.subtitle}>{formatCurrency(totalDebt)} total debt</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{formatPct(settlementPct)}</Text>
          </View>
        </View>

        {/* Overall progress — the celebratory centerpiece */}
        <View style={styles.progressBlock}>
          <View
            style={styles.progressTrack}
            accessibilityRole="progressbar"
            accessibilityLabel="Overall program progress"
            accessibilityValue={{ min: 0, max: 100, now: pct }}
          >
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressCaption}>
              Saved {formatCurrency(currentSaved)} of {formatCurrency(totalTarget)}
            </Text>
            <Text style={styles.progressPct}>{pct}%</Text>
          </View>
          <Text style={styles.celebration}>{celebration}</Text>
        </View>

        {/* Debt-free date */}
        <View style={styles.debtFreeRow}>
          <Feather name="flag" size={14} color="#FFFFFF" />
          <Text style={styles.debtFreeText}>
            {months > 0
              ? `Debt-free by ${calcDebtFreeDate(months)} • ${formatProgramLength(months)}`
              : "Add a suggested monthly amount to see your timeline"}
          </Text>
        </View>

        {/* Headline numbers */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>To settle</Text>
            <Text style={styles.statValue}>{formatCurrency(totalTarget)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>You save</Text>
            <Text style={styles.statValue}>{formatCurrency(savings)}</Text>
            <Text style={styles.statSub}>{savingsRatio}% off</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Suggested/mo</Text>
            <Text style={styles.statValue}>{formatCurrency(suggestedMonthly)}</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Tap to plan your savings</Text>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.9)" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const WHITE = "#FFFFFF";

const styles = StyleSheet.create({
  wrapper: { borderRadius: 16 },
  card: { borderRadius: 16, padding: 20, gap: 14 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  titleWrap: { flex: 1, gap: 3 },
  title: { color: WHITE, fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 26, letterSpacing: -0.3 },
  subtitle: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  badge: {
    minWidth: 46,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  badgeText: { color: WHITE, fontSize: 14, fontFamily: "Inter_700Bold" },
  progressBlock: { gap: 7 },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressFill: { height: 10, borderRadius: 5, backgroundColor: WHITE },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  progressCaption: { color: WHITE, fontSize: 12, fontFamily: "Inter_500Medium", opacity: 0.95, flex: 1 },
  progressPct: { color: WHITE, fontSize: 13, fontFamily: "Inter_700Bold" },
  celebration: { color: WHITE, fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 19 },
  debtFreeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  debtFreeText: { color: WHITE, fontSize: 13, fontFamily: "Inter_700Bold", flexShrink: 1 },
  stats: { flexDirection: "row", alignItems: "center" },
  stat: { flex: 1, gap: 2, alignItems: "center" },
  statLabel: { color: "rgba(255,255,255,0.85)", fontSize: 10, fontFamily: "Inter_700Bold", textAlign: "center" },
  statValue: { color: WHITE, fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  statSub: { color: "rgba(255,255,255,0.85)", fontSize: 10, fontFamily: "Inter_600SemiBold" },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 8,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  footerText: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontFamily: "Inter_700Bold" },
});
