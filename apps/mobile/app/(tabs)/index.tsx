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
import { SettlementReadinessCard } from "@/components/SettlementReadinessCard";
import { TierBadge } from "@/components/TierBadge";
import { useColors } from "@/hooks/useColors";
import { useAggregateProgram, useCreditors, useProfile } from "@/lib/sliceData";
import {
  buildSimpleDebtProgram,
  calcSettlementReadiness,
  formatCurrency,
  getMaxProgramLength,
  getSortedBySnowball,
  getTotalDebt,
  getTotalMonthlySavings,
  getTotalSettlementTarget,
} from "@/utils/calculations";

function getPersonalProgramName(name: string) {
  const firstName = name.trim().split(/\s+/)[0];
  if (!firstName) return "Your Customized Debt Program";
  return `${firstName}${firstName.endsWith("s") ? "'" : "'s"} Customized Debt Program`;
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { creditors } = useCreditors();
  const { debtProgram } = useAggregateProgram();

  const totalDebt = getTotalDebt(creditors);
  const totalTarget = getTotalSettlementTarget(creditors);
  const totalSavings = getTotalMonthlySavings(creditors);
  const months = getMaxProgramLength(creditors);
  const savings = totalDebt - totalTarget;
  const savingsRatio = totalDebt > 0 ? Math.round((savings / totalDebt) * 100) : 0;
  const sorted = getSortedBySnowball(creditors);
  const nextCreditor = sorted.find((c) => c.status === "active");
  const readiness = calcSettlementReadiness(
    creditors,
    profile.currentSavedCash,
    profile.defaultMonthlySavings
  );
  const programName = getPersonalProgramName(profile.name);
  const shouldPromptProgram = creditors.length > 0 && !debtProgram?.disclosureAccepted;
  const aggregateProgram = debtProgram ?? buildSimpleDebtProgram(totalDebt, profile.defaultMonthlySavings);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = 84;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <SliceLogo size={32} />
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {profile.name ? `Hi, ${profile.name.split(" ")[0]}` : "Welcome back"}
            </Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Your Plan
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
              icon="target"
              title="See your first settlement plan"
              description="Add one creditor and SLICE will show when you're settlement-ready, how much to save, and your next best move."
              actionLabel="Add a creditor"
              onAction={() => router.push("/creditor/add")}
            />
          </View>
        ) : (
          <>
            {shouldPromptProgram && (
              <Pressable
                onPress={() => router.push("/savings-planner")}
                style={({ pressed }) => [
                  styles.programPrompt,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.primary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={styles.programPromptIcon}>
                  <Feather name="target" size={20} color={colors.primary} />
                </View>
                <View style={styles.programPromptText}>
                  <Text style={[styles.programPromptEyebrow, { color: colors.primary }]}>
                    Program setup ready
                  </Text>
                  <Text style={[styles.programPromptTitle, { color: colors.foreground }]}>
                    Build {programName}
                  </Text>
                  <Text style={[styles.programPromptDesc, { color: colors.mutedForeground }]}>
                    See your 50% settlement estimate, savings timeline, and month-by-month tracker.
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.primary} />
              </Pressable>
            )}

            {/* Outcome-first hero: settlement readiness */}
            <SettlementReadinessCard readiness={readiness} />

            {/* Demoted program numbers */}
            <View style={styles.summaryRow}>
              <SummaryCard
                label="Total Debt"
                value={formatCurrency(totalDebt)}
                icon="credit-card"
                style={{ flex: 1 }}
              />
              <SummaryCard
                label="Settlement Target"
                value={formatCurrency(totalTarget)}
                icon="percent"
                subtitle={`Save ${formatCurrency(savings)} (${savingsRatio}%)`}
                style={{ flex: 1 }}
              />
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
                subtitle={profile.creditScore > 0 ? "Track in Credit Repair" : "Not set"}
                style={{ flex: 1 }}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Customized Program
                </Text>
                <Pressable onPress={() => router.push("/savings-planner")}>
                  <Text style={[styles.seeAll, { color: colors.primary }]}>View Tracker</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => router.push("/savings-planner")}
                style={({ pressed }) => [
                  styles.programOverview,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={styles.programOverviewHeader}>
                  <View style={styles.programOverviewTitleWrap}>
                    <Text style={[styles.programOverviewTitle, { color: colors.foreground }]}>
                      {programName}
                    </Text>
                    <Text style={[styles.programOverviewFooterText, { color: colors.mutedForeground }]}>
                      {aggregateProgram.programLengthMonths > 0
                        ? `${aggregateProgram.programLengthMonths} month savings timeline`
                        : "Add monthly savings to generate a timeline"}
                    </Text>
                  </View>
                  <View style={[styles.programOverviewBadge, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.programOverviewBadgeText, { color: colors.primary }]}>
                      50%
                    </Text>
                  </View>
                </View>

                <View style={styles.programOverviewStats}>
                  <View style={styles.programOverviewStat}>
                    <Text style={[styles.programOverviewLabel, { color: colors.mutedForeground }]}>
                      Settlement estimate
                    </Text>
                    <Text style={[styles.programOverviewValue, { color: colors.primary }]}>
                      {formatCurrency(aggregateProgram.estimatedSettlementAmount)}
                    </Text>
                  </View>
                  <View style={styles.programOverviewStat}>
                    <Text style={[styles.programOverviewLabel, { color: colors.mutedForeground }]}>
                      Monthly savings
                    </Text>
                    <Text style={[styles.programOverviewValue, { color: colors.foreground }]}>
                      {formatCurrency(aggregateProgram.monthlySavingsAmount)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>

            {/* Next focus */}
            {nextCreditor && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Next Priority
                  </Text>
                  <Pressable onPress={() => router.push("/snowball")}>
                    <Text style={[styles.seeAll, { color: colors.primary }]}>Full Timeline</Text>
                  </Pressable>
                </View>
                <CreditorCard creditor={nextCreditor} rank={1} />
              </View>
            )}

            {/* Quick actions */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
              <View style={styles.quickActions}>
                {[
                  { label: "Add Creditor", icon: "plus", route: "/creditor/add" },
                  { label: "Calculator", icon: "percent", route: "/calculator" },
                  { label: "AI Strategy", icon: "cpu", route: "/ai/strategy/first" },
                  { label: "Credit Repair", icon: "shield", route: "/credit-repair" },
                ].map((item, i) => (
                  <Pressable
                    key={i}
                    onPress={() => {
                      const route = item.route.endsWith("first") && creditors.length > 0
                        ? (item.route.replace("first", creditors[0].id) as any)
                        : (item.route as any);
                      router.push(route);
                    }}
                    style={({ pressed }) => [
                      styles.quickAction,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <Feather name={item.icon as any} size={18} color={colors.primary} />
                    <Text style={[styles.qaLabel, { color: colors.foreground }]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
              Settlement estimates are for planning only. Consult a financial professional for personalized advice.
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  greeting: { fontSize: 11, fontFamily: "Inter_400Regular" },
  headerTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  profileBtn: { padding: 4 },
  scroll: { padding: 16, gap: 14 },
  emptyWrapper: { height: 400 },
  programPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  programPromptIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  programPromptText: { flex: 1, gap: 3 },
  programPromptEyebrow: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
  },
  programPromptTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    lineHeight: 21,
  },
  programPromptDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  programOverview: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  programOverviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  programOverviewTitleWrap: { flex: 1, gap: 3 },
  programOverviewEyebrow: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
  },
  programOverviewTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    lineHeight: 24,
  },
  programOverviewBadge: {
    minWidth: 44,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  programOverviewBadgeText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  programOverviewStats: { flexDirection: "row", gap: 10 },
  programOverviewStat: { flex: 1, gap: 3 },
  programOverviewLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  programOverviewValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  programOverviewFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  programOverviewFooterText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 17,
  },
  summaryRow: { flexDirection: "row", gap: 12 },
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickAction: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
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
