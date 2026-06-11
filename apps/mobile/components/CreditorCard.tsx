import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { Creditor } from "@/types";
import {
  calcProgramLength,
  calcSettledAmount,
  formatCurrency,
  formatPct,
} from "@/utils/calculations";
import { StatusBadge } from "./Badge";
import { Card } from "./Card";

interface CreditorCardProps {
  creditor: Creditor;
  showProgress?: boolean;
  rank?: number;
}

export function CreditorCard({ creditor, showProgress = false, rank }: CreditorCardProps) {
  const colors = useColors();
  const settled = calcSettledAmount(creditor.balance, creditor.settlementPercentage);
  const months = calcProgramLength(settled, creditor.monthlySavings);

  return (
    <Pressable
      onPress={() => router.push(`/creditor/${creditor.id}`)}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.nameRow}>
            {rank !== undefined && (
              <View style={[styles.rank, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.rankText, { color: colors.primary }]}>{rank}</Text>
              </View>
            )}
            <View style={styles.nameGroup}>
              <Text style={[styles.name, { color: colors.foreground }]}>
                {creditor.name}
              </Text>
              <Text style={[styles.phone, { color: colors.mutedForeground }]}>
                {creditor.phone || "No phone"}
              </Text>
            </View>
          </View>
          <View style={styles.right}>
            <StatusBadge status={creditor.status} />
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} style={{ marginTop: 4 }} />
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Owed</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {formatCurrency(creditor.balance)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Target</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {formatCurrency(settled)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Savings</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {formatCurrency(creditor.monthlySavings)}/mo
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Length</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {months} mo
            </Text>
          </View>
        </View>

        {showProgress && (
          <View style={styles.progressSection}>
            <Text style={[styles.pct, { color: colors.mutedForeground }]}>
              {formatPct(creditor.settlementPercentage)} settlement target
            </Text>
          </View>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  nameGroup: { flex: 1 },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  phone: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
    gap: 4,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: { alignItems: "center" },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  progressSection: {
    marginTop: 12,
  },
  pct: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
