import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/Badge";
import { useColors } from "@/hooks/useColors";
import { useCreditors } from "@/lib/sliceData";
import {
  calcProgramLength,
  calcSettledAmount,
  calcTargetDate,
  formatCurrency,
  formatPct,
  getMaxProgramLength,
  getSortedBySnowball,
  getTotalDebt,
  getTotalSettlementTarget,
  getTotalMonthlySavings,
} from "@/utils/calculations";

export default function SnowballScreen() {
  const colors = useColors();
  const { creditors } = useCreditors();
  const sorted = getSortedBySnowball(creditors);
  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 20;

  const totalMonths = getMaxProgramLength(creditors);
  const totalDebt = getTotalDebt(creditors);
  const totalTarget = getTotalSettlementTarget(creditors);
  const totalSavings = getTotalMonthlySavings(creditors);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
      {creditors.length === 0 ? (
        <EmptyState
          icon="bar-chart-2"
          title="No creditors yet"
          description="Add creditors to see your snowball payoff timeline."
          actionLabel="Add Creditor"
          onAction={() => router.push("/creditor/add")}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary */}
          <View style={[styles.summary, { backgroundColor: colors.primary }]}>
            <Text style={styles.summaryTitle}>Total Program Length</Text>
            <Text style={styles.summaryMonths}>{totalMonths} months</Text>
            <Text style={styles.summaryDate}>
              Target completion: {calcTargetDate(totalMonths)}
            </Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Owed</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalDebt)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Target</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalTarget)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Monthly Save</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalSavings)}</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.method, { color: colors.mutedForeground }]}>
            Snowball method: Pay off smallest balances first for quick wins, then roll savings into the next creditor.
          </Text>

          {/* Timeline */}
          {sorted.map((creditor, i) => {
            const settled = calcSettledAmount(creditor.balance, creditor.settlementPercentage);
            const months = calcProgramLength(settled, creditor.monthlySavings);
            const targetDate = calcTargetDate(months);
            const isFirst = i === 0;

            return (
              <Pressable
                key={creditor.id}
                onPress={() => router.push(`/creditor/${creditor.id}`)}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              >
                <View style={styles.timelineRow}>
                  {/* Left: number + line */}
                  <View style={styles.leftCol}>
                    <View
                      style={[
                        styles.circle,
                        {
                          backgroundColor: isFirst ? colors.primary : colors.muted,
                          borderColor: isFirst ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.circleText,
                          { color: isFirst ? "#FFFFFF" : colors.foreground },
                        ]}
                      >
                        {i + 1}
                      </Text>
                    </View>
                    {i < sorted.length - 1 && (
                      <View style={[styles.line, { backgroundColor: colors.border }]} />
                    )}
                  </View>

                  {/* Right: card */}
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: colors.card,
                        borderColor: isFirst ? colors.primary : colors.border,
                        borderWidth: isFirst ? 1.5 : 1,
                      },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardLeft}>
                        <Text style={[styles.creditorName, { color: colors.foreground }]}>
                          {creditor.name}
                        </Text>
                        {isFirst && (
                          <View style={[styles.focusTag, { backgroundColor: colors.primary }]}>
                            <Text style={styles.focusTagText}>NEXT FOCUS</Text>
                          </View>
                        )}
                      </View>
                      <StatusBadge status={creditor.status} />
                    </View>

                    <View style={styles.cardStats}>
                      <View style={styles.stat}>
                        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Balance</Text>
                        <Text style={[styles.statValue, { color: colors.foreground }]}>
                          {formatCurrency(creditor.balance)}
                        </Text>
                      </View>
                      <View style={styles.stat}>
                        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Target ({formatPct(creditor.settlementPercentage)})</Text>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                          {formatCurrency(settled)}
                        </Text>
                      </View>
                      <View style={styles.stat}>
                        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Timeline</Text>
                        <Text style={[styles.statValue, { color: colors.foreground }]}>
                          {months} mo
                        </Text>
                      </View>
                    </View>

                    <View style={styles.dateRow}>
                      <Feather name="calendar" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                        Target: {targetDate}
                      </Text>
                    </View>
                    <ProgressBar progress={creditor.status === "settled" ? 1 : 0} height={5} />
                  </View>
                </View>
              </Pressable>
            );
          })}

          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            Timelines are estimates based on your monthly savings. Actual settlement dates depend
            on negotiation and creditor acceptance.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  summary: { borderRadius: 16, padding: 20, gap: 8 },
  summaryTitle: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Inter_500Medium" },
  summaryMonths: { color: "#FFFFFF", fontSize: 40, fontFamily: "Inter_700Bold" },
  summaryDate: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "Inter_400Regular" },
  summaryRow: { flexDirection: "row", marginTop: 8, alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center", gap: 3 },
  summaryLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_400Regular" },
  summaryValue: { color: "#FFFFFF", fontSize: 14, fontFamily: "Inter_700Bold" },
  summaryDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.25)" },
  method: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, textAlign: "center" },
  timelineRow: { flexDirection: "row", gap: 12, marginBottom: 0 },
  leftCol: { alignItems: "center", width: 36 },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  circleText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  line: { width: 2, flex: 1, marginTop: 4, marginBottom: 4, minHeight: 16 },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardLeft: { flex: 1, gap: 4 },
  creditorName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  focusTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  focusTagText: { color: "#FFFFFF", fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  cardStats: { flexDirection: "row", justifyContent: "space-between" },
  stat: { gap: 2 },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  dateRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  dateText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  disclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16 },
});
