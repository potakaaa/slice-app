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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SliceLogo } from "@/components/SliceLogo";
import { SummaryCard } from "@/components/SummaryCard";
import { CreditorCard } from "@/components/CreditorCard";
import { EmptyState } from "@/components/EmptyState";
import { TierBadge } from "@/components/TierBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/useAppStore";
import {
  formatCurrency,
  getMaxProgramLength,
  getSortedBySnowball,
  getTotalDebt,
  getTotalMonthlySavings,
  getTotalSettlementTarget,
} from "@/utils/calculations";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, creditors } = useAppStore((s) => ({
    profile: s.profile,
    creditors: s.creditors,
  }));

  const totalDebt = getTotalDebt(creditors);
  const totalTarget = getTotalSettlementTarget(creditors);
  const totalSavings = getTotalMonthlySavings(creditors);
  const months = getMaxProgramLength(creditors);
  const savings = totalDebt - totalTarget;
  const savingsRatio = totalDebt > 0 ? savings / totalDebt : 0;
  const sorted = getSortedBySnowball(creditors);
  const nextCreditor = sorted.find((c) => c.status === "active");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : 84;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <SliceLogo size={36} />
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              Good day{profile.name ? `, ${profile.name.split(" ")[0]}` : ""}
            </Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Your Debt Program
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TierBadge tier={profile.tier} />
          <Pressable onPress={() => router.push("/profile")} style={styles.profileBtn}>
            <Feather name="user" size={20} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {creditors.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <EmptyState
              icon="credit-card"
              title="No creditors yet"
              description="Add your first creditor to start building your debt program."
              actionLabel="Add Creditor"
              onAction={() => router.push("/creditor/add")}
            />
          </View>
        ) : (
          <>
            {/* Hero stats */}
            <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
              <Text style={styles.heroLabel}>Total Debt</Text>
              <Text style={styles.heroAmount}>{formatCurrency(totalDebt)}</Text>
              <View style={styles.heroRow}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Settlement Target</Text>
                  <Text style={styles.heroStatValue}>{formatCurrency(totalTarget)}</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Est. Savings</Text>
                  <Text style={[styles.heroStatValue, styles.savingsGreen]}>
                    {formatCurrency(savings)}
                  </Text>
                </View>
              </View>
              <View style={styles.heroPctRow}>
                <Text style={styles.heroPctLabel}>
                  Potential savings: {Math.round(savingsRatio * 100)}%
                </Text>
              </View>
              <ProgressBar progress={0} height={6} color="rgba(255,255,255,0.5)" />
            </View>

            {/* Summary row */}
            <View style={styles.summaryRow}>
              <SummaryCard
                label="Monthly Savings"
                value={formatCurrency(totalSavings)}
                icon="trending-up"
                style={{ flex: 1 }}
              />
              <SummaryCard
                label="Program Length"
                value={`${months} mo`}
                icon="clock"
                style={{ flex: 1 }}
              />
            </View>
            <View style={styles.summaryRow}>
              <SummaryCard
                label="Creditors"
                value={String(creditors.length)}
                icon="users"
                subtitle={`${creditors.filter((c) => c.status === "settled").length} settled`}
                style={{ flex: 1 }}
              />
              <SummaryCard
                label="Credit Score"
                value={profile.creditScore > 0 ? String(profile.creditScore) : "—"}
                icon="bar-chart-2"
                subtitle={profile.creditScore > 0 ? "Track in Credit Repair" : "Tap to add"}
                style={{ flex: 1 }}
              />
            </View>

            {/* Next focus */}
            {nextCreditor && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Next Focus — Snowball Priority
                  </Text>
                  <Pressable onPress={() => router.push("/snowball")}>
                    <Text style={[styles.seeAll, { color: colors.primary }]}>Timeline</Text>
                  </Pressable>
                </View>
                <CreditorCard creditor={nextCreditor} rank={1} />
              </View>
            )}

            {/* Quick actions */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Quick Actions
              </Text>
              <View style={styles.quickActions}>
                {[
                  { label: "Add Creditor", icon: "plus-circle", action: () => router.push("/creditor/add") },
                  { label: "Calculator", icon: "percent", action: () => router.push("/calculator") },
                  { label: "AI Strategy", icon: "cpu", action: () => router.push("/ai/strategy/first") },
                  { label: "Credit Repair", icon: "shield", action: () => router.push("/credit-repair") },
                ].map((item, i) => (
                  <Pressable
                    key={i}
                    onPress={item.action}
                    style={({ pressed }) => [
                      styles.quickAction,
                      { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <View style={[styles.qaIcon, { backgroundColor: colors.secondary }]}>
                      <Feather name={item.icon as any} size={20} color={colors.primary} />
                    </View>
                    <Text style={[styles.qaLabel, { color: colors.foreground }]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Disclaimer */}
            <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
              SLICE does not guarantee settlement results. Estimates are for planning
              purposes only. Consult a financial professional for personalized advice.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  greeting: { fontSize: 11, fontFamily: "Inter_400Regular" },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  profileBtn: { padding: 4 },
  scroll: { padding: 16, gap: 16 },
  emptyWrapper: { height: 400 },
  heroCard: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  heroLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  heroAmount: {
    color: "#FFFFFF",
    fontSize: 36,
    fontFamily: "Inter_700Bold",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroStat: { flex: 1, gap: 2 },
  heroStatLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  heroStatValue: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  savingsGreen: { color: "#DCFCE7" },
  heroStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: 16,
  },
  heroPctRow: { flexDirection: "row", justifyContent: "flex-end" },
  heroPctLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 6,
  },
  summaryRow: { flexDirection: "row", gap: 12 },
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickAction: {
    width: "47%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    alignItems: "flex-start",
  },
  qaIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  qaLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});
