import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";
import { celebrate } from "@/lib/celebrate";
import { hapticSelection } from "@/lib/haptics";
import { useCreditors, useProfile, useUpsertProfile } from "@/lib/sliceData";
import {
  calcSettlementReadiness,
  formatCurrency,
  formatMoneyInput,
  parseMoneyInput,
  type SettlementReadiness,
} from "@/utils/calculations";

const STEP = 50;

function dayLabel(r: SettlementReadiness): string {
  if (r.status === "empty") return "—";
  if (r.isReadyNow) return "Ready now";
  if (r.daysUntilReady == null) return "Add savings";
  return `${r.daysUntilReady} days`;
}

export default function WhatIfScreen() {
  const colors = useColors();
  const { creditors } = useCreditors();
  const { profile } = useProfile();
  const upsertProfile = useUpsertProfile();

  const currentMonthly = Math.max(0, profile.defaultMonthlySavings);
  const savedCash = profile.currentSavedCash;
  const [newMonthly, setNewMonthly] = useState(currentMonthly);

  const before = calcSettlementReadiness(creditors, savedCash, currentMonthly);
  const after = calcSettlementReadiness(creditors, savedCash, newMonthly);
  const changed = newMonthly !== currentMonthly;

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 16;

  const setMonthly = (value: number) => {
    hapticSelection();
    setNewMonthly(Math.max(0, value));
    // M9: the user is taking control of the numbers — a light nudge, once.
    celebrate("m9_what_if", { once: true });
  };

  const handleUse = async () => {
    await upsertProfile.mutateAsync({ defaultMonthlySavings: newMonthly });
    router.back();
  };

  if (creditors.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <View style={styles.empty}>
          <Feather name="sliders" size={32} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Add a creditor first
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            The simulator needs at least one creditor to estimate your settlement timeline.
          </Text>
          <Button label="Add a creditor" onPress={() => router.push("/creditor/add")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>
          What if you changed your monthly set-aside? See how it moves your first offer date.
        </Text>

        {/* Control */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            MONTHLY SET-ASIDE
          </Text>
          <View style={styles.stepperRow}>
            <Pressable
              onPress={() => setMonthly(newMonthly - STEP)}
              style={[styles.stepBtn, { backgroundColor: colors.muted }]}
              hitSlop={6}
            >
              <Feather name="minus" size={20} color={colors.foreground} />
            </Pressable>

            <View style={styles.amountWrap}>
              <Text style={[styles.dollar, { color: colors.mutedForeground }]}>$</Text>
              <TextInput
                value={formatMoneyInput(newMonthly)}
                onChangeText={(v) => setNewMonthly(parseMoneyInput(v))}
                keyboardType="numeric"
                style={[styles.amountInput, { color: colors.foreground }]}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
              />
              <Text style={[styles.perMonth, { color: colors.mutedForeground }]}>/mo</Text>
            </View>

            <Pressable
              onPress={() => setMonthly(newMonthly + STEP)}
              style={[styles.stepBtn, { backgroundColor: colors.primary }]}
              hitSlop={6}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </Card>

        {/* Result */}
        <View style={[styles.result, { backgroundColor: colors.primary }]}>
          <Text style={styles.resultLabel}>NEW SETTLEMENT TIMELINE</Text>
          <Text style={styles.resultBig}>{dayLabel(after)}</Text>
          {changed && (
            <Text style={styles.resultDelta}>
              Was {dayLabel(before)} → now {dayLabel(after)}
            </Text>
          )}
          <View style={styles.resultStats}>
            <View style={styles.resultStat}>
              <Text style={styles.resultStatLabel}>Daily</Text>
              <Text style={styles.resultStatValue}>
                {after.monthlySetAside > 0 ? formatCurrency(after.dailySetAside) : "—"}
              </Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultStat}>
              <Text style={styles.resultStatLabel}>Weekly</Text>
              <Text style={styles.resultStatValue}>
                {after.monthlySetAside > 0 ? formatCurrency(after.weeklySetAside) : "—"}
              </Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultStat}>
              <Text style={styles.resultStatLabel}>Ready by</Text>
              <Text style={styles.resultStatValue}>{after.readyDate ?? "—"}</Text>
            </View>
          </View>
          {after.priorityCreditor && (
            <Text style={styles.resultCreditor}>
              First offer: {after.priorityCreditor.name} ·{" "}
              {formatCurrency(after.firstOfferTarget)}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label="Use this plan"
            onPress={handleUse}
            loading={upsertProfile.isPending}
            disabled={!changed}
            fullWidth
          />
          <Button
            label="Reset"
            variant="secondary"
            onPress={() => setMonthly(currentMonthly)}
            disabled={!changed}
            fullWidth
          />
        </View>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Estimates are for planning only and do not guarantee creditor acceptance.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { gap: 14, padding: 16 },
  intro: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  amountWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  dollar: { fontSize: 22, fontFamily: "Inter_600SemiBold" },
  amountInput: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    minWidth: 80,
    padding: 0,
  },
  perMonth: { fontSize: 14, fontFamily: "Inter_400Regular", marginLeft: 2 },
  result: { borderRadius: 16, padding: 20, gap: 8 },
  resultLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.6,
    opacity: 0.9,
  },
  resultBig: { color: "#FFFFFF", fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  resultDelta: { color: "#FFFFFF", fontSize: 14, fontFamily: "Inter_500Medium", opacity: 0.95 },
  resultStats: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  resultStat: { flex: 1, gap: 2 },
  resultStatLabel: { color: "#FFFFFF", fontSize: 10, fontFamily: "Inter_700Bold", opacity: 0.85 },
  resultStatValue: { color: "#FFFFFF", fontSize: 15, fontFamily: "Inter_700Bold" },
  resultDivider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: 12,
  },
  resultCreditor: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
    opacity: 0.95,
  },
  actions: { gap: 10 },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
