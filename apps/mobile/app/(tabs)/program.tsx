import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ProgressBar } from "@/components/ProgressBar";
import { useColors } from "@/hooks/useColors";
import { useCreditors, useUpdateCreditor } from "@/lib/sliceData";
import {
  calcProgramLength,
  calcSettledAmount,
  formatCurrency,
  getTotalDebt,
  getTotalSettlementTarget,
  getSortedBySnowball,
} from "@/utils/calculations";
import { router } from "expo-router";
import { Button } from "@/components/Button";


export default function ProgramScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { creditors } = useCreditors();
  const updateCreditor = useUpdateCreditor();

  const sorted = getSortedBySnowball(creditors);
  const totalDebt = getTotalDebt(creditors);
  const totalTarget = getTotalSettlementTarget(creditors);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : 84;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Debt Program</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Customize each creditor's settlement target and savings
        </Text>
      </View>

      {creditors.length === 0 ? (
        <EmptyState
          icon="layers"
          title="No program yet"
          description="Add creditors to generate your customized debt program."
          actionLabel="Add Creditor"
          onAction={() => router.push("/creditor/add")}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Program summary */}
          <Card style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
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
                <Text style={styles.summaryLabel}>Est. Savings</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(totalDebt - totalTarget)}
                </Text>
              </View>
            </View>
          </Card>

          {/* Column headers */}
          <View style={[styles.tableHeader, { borderColor: colors.border }]}>
            <Text style={[styles.th, { color: colors.mutedForeground, flex: 2 }]}>Creditor</Text>
            <Text style={[styles.th, { color: colors.mutedForeground }]}>Owed</Text>
            <Text style={[styles.th, { color: colors.mutedForeground }]}>Target</Text>
            <Text style={[styles.th, { color: colors.mutedForeground }]}>Mo.</Text>
          </View>

          {sorted.map((creditor) => {
            const settled = calcSettledAmount(creditor.balance, creditor.settlementPercentage);
            const months = calcProgramLength(settled, creditor.monthlySavings);
            return (
              <Card key={creditor.id} style={styles.creditorCard}>
                <View style={styles.creditorRow}>
                  <Text style={[styles.creditorName, { color: colors.foreground, flex: 2 }]} numberOfLines={1}>
                    {creditor.name}
                  </Text>
                  <Text style={[styles.creditorStat, { color: colors.foreground }]}>
                    {formatCurrency(creditor.balance)}
                  </Text>
                  <Text style={[styles.creditorStat, { color: colors.primary }]}>
                    {formatCurrency(settled)}
                  </Text>
                  <Text style={[styles.creditorStat, { color: colors.foreground }]}>
                    {months}mo
                  </Text>
                </View>

                {/* Monthly savings quick edit */}
                <View style={styles.savingsRow}>
                  <Text style={[styles.savingsLabel, { color: colors.mutedForeground }]}>
                    Monthly savings: {formatCurrency(creditor.monthlySavings)}
                  </Text>
                  <View style={styles.savingsBtns}>
                    <Pressable
                      onPress={() =>
                        updateCreditor.mutate({
                          id: creditor.id,
                          updates: { monthlySavings: Math.max(50, creditor.monthlySavings - 50) },
                        })
                      }
                      style={[styles.adjustBtn, { backgroundColor: colors.muted }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Decrease monthly savings for ${creditor.name} by 50 dollars`}
                    >
                      <Feather name="minus" size={14} color={colors.foreground} />
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        updateCreditor.mutate({
                          id: creditor.id,
                          updates: { monthlySavings: creditor.monthlySavings + 50 },
                        })
                      }
                      style={[styles.adjustBtn, { backgroundColor: colors.muted }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Increase monthly savings for ${creditor.name} by 50 dollars`}
                    >
                      <Feather name="plus" size={14} color={colors.foreground} />
                    </Pressable>
                  </View>
                </View>
              </Card>
            );
          })}

          <Button
            label="Snowball Timeline"
            variant="secondary"
            onPress={() => router.push("/snowball")}
            fullWidth
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  scroll: { padding: 16, gap: 12 },
  summaryCard: { padding: 16, marginBottom: 4 },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.25)" },
  summaryLabel: { color: "#FFFFFF", fontSize: 11, fontFamily: "Inter_700Bold" },
  summaryValue: { color: "#FFFFFF", fontSize: 15, fontFamily: "Inter_700Bold" },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    gap: 8,
  },
  th: { fontSize: 11, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "center" },
  creditorCard: { gap: 10 },
  creditorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  creditorName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  creditorStat: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", textAlign: "center" },
  savingsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  savingsLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  savingsBtns: { flexDirection: "row", gap: 8 },
  adjustBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
