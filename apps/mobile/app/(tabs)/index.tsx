import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
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
import { ProgramSnapshotHero } from "@/components/ProgramSnapshotHero";
import { CreditorCard } from "@/components/CreditorCard";
import { EmptyState } from "@/components/EmptyState";
import { SavingsAccountPrompt } from "@/components/SavingsAccountPrompt";
import { NextFocusCard } from "@/components/NextFocusCard";
import { SkeletonScreen } from "@/components/Skeleton";
import { TierBadge } from "@/components/TierBadge";
import { TourWelcomeSheet } from "@/components/tour";
import { UpgradeNudgeDialog } from "@/components/UpgradeNudgeDialog";
import { useColors } from "@/hooks/useColors";
import { celebrate } from "@/lib/celebrate";
// TEMPORARY (revert later): post-onboarding App Store review prompt.
import { maybeRequestReviewAfterOnboarding } from "@/lib/reviewPrompt";
import { useAggregateProgram, useCreditors, useProfile } from "@/lib/sliceData";
import { useAppStore } from "@/store/useAppStore";
import {
  buildSimpleDebtProgram,
  calcSettlementReadiness,
  getMaxProgramLength,
  getSortedBySnowball,
  getTotalDebt,
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
  const { creditors, isLoading } = useCreditors();
  const { debtProgram } = useAggregateProgram();
  const savingsAccountCreated = useAppStore((s) => s.savingsAccountCreated);

  const totalDebt = getTotalDebt(creditors);
  const totalTarget = getTotalSettlementTarget(creditors);
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
  const aggregateProgram = debtProgram ?? buildSimpleDebtProgram(totalDebt, profile.defaultMonthlySavings);

  // M16: the user saved enough to make a real offer on their priority creditor —
  // a major motivation moment. Celebrate once per creditor that reaches ready.
  const readyCreditorId = readiness.isReadyNow ? readiness.priorityCreditor?.id : undefined;
  useEffect(() => {
    if (readyCreditorId) {
      celebrate("m16_ready", { once: `m16_ready:${readyCreditorId}` });
    }
  }, [readyCreditorId]);

  // TEMPORARY (revert later): once the user finishes onboarding and lands on the
  // dashboard, prompt them to review the app on the App Store. Bypasses the
  // normal earned-win goodwill gates (see lib/reviewPrompt.ts). A short delay
  // lets the dashboard paint before the native sheet appears.
  // TO REVERT: delete this effect + the maybeRequestReviewAfterOnboarding import,
  // and remove that function from lib/reviewPrompt.ts.
  useEffect(() => {
    if (!profile.onboardingComplete) return;
    const timer = setTimeout(() => {
      void maybeRequestReviewAfterOnboarding();
    }, 1500);
    return () => clearTimeout(timer);
  }, [profile.onboardingComplete]);

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
          <Pressable
            onPress={() => router.push("/membership")}
            accessibilityRole="button"
            accessibilityLabel="View your membership and plan"
          >
            <TierBadge tier={profile.tier} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/profile")}
            style={styles.profileBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Profile and settings"
          >
            <Feather name="user" size={20} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomPad },
          creditors.length === 0 && styles.scrollEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && creditors.length === 0 ? (
          <SkeletonScreen />
        ) : creditors.length === 0 ? (
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
            {/* Post-onboarding: open a dedicated settlement savings account.
                Persists every launch until done, and (via the tour gate below)
                takes priority over the first-run tour prompt. */}
            {profile.onboardingComplete && !savingsAccountCreated && (
              <SavingsAccountPrompt />
            )}

            {/* Free-tier upsell now lives in the weekly UpgradeNudgeDialog popup,
                so the dashboard only shows the member-benefits card for paying
                tiers. */}
            {profile.tier !== "free" && (
              <Pressable
                onPress={() => router.push("/membership")}
                style={({ pressed }) => [
                  styles.tierCard,
                  { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <TierBadge tier={profile.tier} size="lg" gradient />
                <Text style={[styles.tierCardText, { color: colors.foreground }]}>
                  View your member benefits
                </Text>
                <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
              </Pressable>
            )}

            {/* Whole-program snapshot — the first program content the user
                sees: their program, overall progress, and debt-free date. */}
            <ProgramSnapshotHero
              programName={programName}
              totalDebt={totalDebt}
              totalTarget={totalTarget}
              savings={savings}
              savingsRatio={savingsRatio}
              currentSaved={profile.currentSavedCash}
              months={months}
              suggestedMonthly={aggregateProgram.monthlySavingsAmount}
              settlementPct={profile.defaultSettlementPercentage}
              onPress={() => router.push("/savings-planner")}
            />

            {/* Your next focus: the single-creditor first-offer story, demoted
                below the whole-program snapshot. */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Your next focus
              </Text>
              <NextFocusCard readiness={readiness} />
            </View>

            {/* Next priority creditor detail */}
            {nextCreditor && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Next Priority
                  </Text>
                  <Pressable onPress={() => router.push("/snowball")}>
                    <Text style={[styles.seeAll, { color: colors.primary }]}>Snowball Timeline</Text>
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

      {/* First-run opt-in tour prompt (renders only while status is "pending"). */}
      <TourWelcomeSheet />

      {/* Weekly free→paid upgrade nudge (free users only, once every 7 days). */}
      <UpgradeNudgeDialog />
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
  greeting: { fontSize: 13, fontFamily: "Inter_500Medium" },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  profileBtn: { padding: 4 },
  scroll: { padding: 16, gap: 14 },
  scrollEmpty: { flexGrow: 1 },
  emptyWrapper: { flex: 1 },
  tierCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  tierCardText: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
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
