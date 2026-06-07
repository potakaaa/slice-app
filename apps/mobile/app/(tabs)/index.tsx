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
import { useColors } from "@/hooks/useColors";
import { useCreditors, useProfile } from "@/lib/sliceData";
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
  const { profile } = useProfile();
  const { creditors } = useCreditors();

  const totalDebt = getTotalDebt(creditors);
  const totalTarget = getTotalSettlementTarget(creditors);
  const totalSavings = getTotalMonthlySavings(creditors);
  const months = getMaxProgramLength(creditors);
  const savings = totalDebt - totalTarget;
  const savingsRatio = totalDebt > 0 ? Math.round((savings / totalDebt) * 100) : 0;
  const sorted = getSortedBySnowball(creditors);
  const nextCreditor = sorted.find((c) => c.status === "active");

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
              Your Program
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
            {/* Hero */}
            <View style={[styles.hero, { backgroundColor: colors.primary }]}>
              <Text style={styles.heroLabel}>Total Debt</Text>
              <Text style={styles.heroAmount}>{formatCurrency(totalDebt)}</Text>
              <View style={styles.heroSeparator} />
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Settlement Target</Text>
                  <Text style={styles.heroStatValue}>{formatCurrency(totalTarget)}</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Estimated Savings</Text>
                  <Text style={[styles.heroStatValue, styles.savingsColor]}>
                    {formatCurrency(savings)}
                  </Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Savings Rate</Text>
                  <Text style={[styles.heroStatValue, styles.savingsColor]}>{savingsRatio}%</Text>
                </View>
              </View>
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
  hero: {
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  heroLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  heroAmount: {
    color: "#FFFFFF",
    fontSize: 38,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  heroSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  heroStats: { flexDirection: "row", alignItems: "center" },
  heroStat: { flex: 1, gap: 3 },
  heroStatLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  heroStatValue: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  savingsColor: { color: "#FFFFFF" },
  heroStatDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: 12,
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
