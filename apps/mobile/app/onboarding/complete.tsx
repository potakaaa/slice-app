import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "@/components/Button";
import { SliceLogo } from "@/components/SliceLogo";
import { useAuth } from "@/lib/auth";
import { celebrate } from "@/lib/celebrate";
import { integrationMessage } from "@/lib/integrationErrors";
import { useCreateCreditor, useUpsertProfile } from "@/lib/sliceData";
import { useAppStore } from "@/store/useAppStore";
import {
  calcDebtFreeDate,
  calcSettlementReadiness,
  formatCurrency,
  formatProgramLength,
  getMaxProgramLength,
  getTotalDebt,
  getTotalSettlementTarget,
} from "@/utils/calculations";

export default function OnboardingComplete() {
  const { session } = useAuth();
  const creditors = useAppStore((s) => s.creditors);
  const profile = useAppStore((s) => s.profile);
  const onboardingReadyForAuth = useAppStore((s) => s.onboardingReadyForAuth);
  const draftOwnerId = useAppStore((s) => s.draftOwnerId);
  const clearDraft = useAppStore((s) => s.clearDraft);
  const setTutorialStatus = useAppStore((s) => s.setTutorialStatus);
  const createCreditor = useCreateCreditor();
  const upsertProfile = useUpsertProfile();

  const totalDebt = getTotalDebt(creditors);
  const totalTarget = getTotalSettlementTarget(creditors);
  const savings = totalDebt - totalTarget;

  const totalExpenses = profile.monthlyExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );
  const surplus = profile.monthlyIncome - totalExpenses;
  const hasBudget = profile.monthlyIncome > 0;
  const committedContribution = Math.max(0, profile.defaultMonthlySavings);
  const availableCashFlow = Math.max(0, surplus);
  const [monthlyContribution, setMonthlyContribution] = useState(
    committedContribution
  );
  const canIncreaseContribution =
    availableCashFlow > committedContribution &&
    monthlyContribution < availableCashFlow;

  const remainingTarget = Math.max(0, totalTarget - profile.currentSavedCash);
  const committedMonths =
    committedContribution > 0
      ? Math.ceil(remainingTarget / committedContribution)
      : getMaxProgramLength(creditors);
  const months =
    monthlyContribution > 0
      ? Math.ceil(remainingTarget / monthlyContribution)
      : getMaxProgramLength(creditors);
  const fasterMonths =
    availableCashFlow > 0
      ? Math.ceil(remainingTarget / availableCashFlow)
      : months;
  const monthsSaved = Math.max(0, committedMonths - fasterMonths);
  const readiness = calcSettlementReadiness(
    creditors,
    profile.currentSavedCash,
    monthlyContribution
  );
  const readinessText = readiness.isReadyNow
    ? "Settlement-ready now"
    : readiness.daysUntilReady != null
      ? `First offer in about ${readiness.daysUntilReady} days • ${formatCurrency(readiness.dailySetAside)}/day`
      : null;

  useEffect(() => {
    if (!session) {
      router.replace("/auth");
      return;
    }
    // This screen summarizes a finished onboarding draft. If the user reached it
    // without completing onboarding (e.g. a direct sign-up), with an empty draft,
    // or with a draft owned by a different/previous account on this device, send
    // them through the flow instead of showing a stale "Your Program Is Ready".
    if (
      !onboardingReadyForAuth ||
      creditors.length === 0 ||
      draftOwnerId !== session.user.id
    ) {
      router.replace("/onboarding");
      return;
    }
    // M5: "Your Program Is Ready" — the aha moment. Full celebration with the
    // warm pride voice (its own success haptic), once per user.
    celebrate("m5_first_plan", { once: true });
  }, [session, onboardingReadyForAuth, draftOwnerId, creditors.length]);

  const handleStart = async () => {
    if (!session) {
      router.replace("/auth");
      return;
    }
    try {
      await upsertProfile.mutateAsync({
        ...profile,
        defaultMonthlySavings: monthlyContribution,
        onboardingComplete: true,
        termsAccepted: true,
        privacyAccepted: true,
      });
      for (const [index, creditor] of creditors.entries()) {
        await createCreditor.mutateAsync({
          name: creditor.name,
          phone: creditor.phone,
          balance: creditor.balance,
          settlementPercentage: creditor.settlementPercentage,
          monthlySavings: monthlyContribution,
          priority: index + 1,
        });
      }
      // Fresh sign-up: make this user eligible for the optional first-run tour
      // (the dashboard shows the opt-in welcome sheet while status is "pending").
      setTutorialStatus("pending");
      // Navigate before clearing the draft: clearing flips onboardingReadyForAuth
      // and empties creditors, which the redirect guard above would otherwise act
      // on and bounce this screen back to /onboarding mid-success.
      router.replace("/(tabs)");
      clearDraft();
    } catch (error) {
      Alert.alert(
        "Couldn't start your program",
        integrationMessage(
          error,
          "Something went wrong setting up your program. Please try again.",
        ),
      );
    }
  };

  const topPad = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FF5A00", "#FF8A00"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView style={[styles.safe, { paddingTop: topPad }]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.top}>
            <SliceLogo size={64} />
            <Text style={styles.congrats}>Your Program Is Ready!</Text>
            <Text style={styles.name}>
              {profile.name
                ? `Review your plan, ${profile.name.split(" ")[0].charAt(0).toUpperCase() + profile.name.split(" ")[0].slice(1)}.`
                : "Review your plan."}
            </Text>
          </View>

          <View style={styles.stats}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(totalDebt)}</Text>
              <Text style={styles.statLabel}>Total Debt</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(totalTarget)}</Text>
              <Text style={styles.statLabel}>Settlement Target</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(savings)}</Text>
              <Text style={styles.statLabel}>Potential Savings</Text>
            </View>
          </View>

          <View style={styles.plan}>
            {hasBudget && (
              <View style={styles.budget}>
                <View style={styles.budgetCol}>
                  <Text style={styles.budgetLabel}>Income</Text>
                  <Text style={styles.budgetValue}>
                    {formatCurrency(profile.monthlyIncome)}
                  </Text>
                </View>
                <View style={styles.budgetSep} />
                <View style={styles.budgetCol}>
                  <Text style={styles.budgetLabel}>Expenses</Text>
                  <Text style={styles.budgetValue}>
                    −{formatCurrency(totalExpenses)}
                  </Text>
                </View>
                <View style={styles.budgetSep} />
                <View style={styles.budgetCol}>
                  <Text style={styles.budgetLabel}>
                    {surplus < 0 ? "Shortfall" : "Available"}
                  </Text>
                  <Text style={styles.budgetValue}>
                    {surplus < 0 ? "−" : ""}
                    {formatCurrency(Math.abs(surplus))}
                    <Text style={styles.perMonth}>/mo</Text>
                  </Text>
                </View>
              </View>
            )}

            {hasBudget && <View style={styles.divider} />}

            <View style={styles.planMetrics}>
              <View style={styles.planMetric}>
                <Text style={styles.planLabel}>Suggested savings</Text>
                <Text style={styles.planValue}>
                  {formatCurrency(monthlyContribution)}
                  <Text style={styles.perMonth}>/mo</Text>
                </Text>
              </View>
              <View style={styles.planMetricDivider} />
              <View style={styles.planMetric}>
                <Text style={styles.planLabel}>Estimated length</Text>
                <Text style={styles.planValue}>{formatProgramLength(months)}</Text>
              </View>
            </View>

            {months > 0 && (
              <View style={styles.debtFreeRow}>
                <Text style={styles.debtFreeLabel}>You'll be debt-free by</Text>
                <Text style={styles.debtFreeValue}>{calcDebtFreeDate(months)}</Text>
              </View>
            )}

            {hasBudget &&
              remainingTarget > 0 &&
              availableCashFlow > committedContribution && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.fasterRow}>
                    <View style={styles.fasterCopy}>
                      <Text style={styles.fasterEyebrow}>
                        {canIncreaseContribution
                          ? "FASTER OPTION"
                          : "FASTER PLAN SELECTED"}
                      </Text>
                      <Text style={styles.fasterTitle}>
                        {canIncreaseContribution
                          ? `Could you set aside ${formatCurrency(availableCashFlow)}/mo?`
                          : "Faster pace selected"}
                      </Text>
                      <Text style={styles.fasterBody}>
                        {canIncreaseContribution
                          ? monthsSaved > 0
                            ? `That could be about ${monthsSaved} ${monthsSaved === 1 ? "month" : "months"} sooner — but it's your call. Keep room for life.`
                            : "That could build your fund faster — but it's your call. Keep room for life."
                          : `${fasterMonths} ${fasterMonths === 1 ? "month" : "months"} estimated • suggested was ${formatCurrency(committedContribution)}/mo`}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        setMonthlyContribution(
                          canIncreaseContribution
                            ? availableCashFlow
                            : committedContribution
                        )
                      }
                      style={({ pressed }) => [
                        styles.fasterAction,
                        pressed && styles.fasterActionPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={
                        canIncreaseContribution
                          ? `Use ${formatCurrency(availableCashFlow)} per month`
                          : `Restore ${formatCurrency(committedContribution)} per month`
                      }
                    >
                      <Text style={styles.fasterActionText}>
                        {canIncreaseContribution ? "Use it" : "Undo"}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}

            {readinessText && (
              <>
                <View style={styles.divider} />
                <View style={styles.readinessRow}>
                  <Text style={styles.readinessCheck}>✓</Text>
                  <Text style={styles.readinessText}>{readinessText}</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.readyLine}>
            <Text style={styles.readyDot}>✓</Text>
            <Text style={styles.readyText}>
              Creditor order, negotiation strategies, and tracking are ready.
            </Text>
          </View>

          <View style={styles.bottom}>
            <Button
              label="Start My Program"
              onPress={handleStart}
              style={styles.cta}
              textColor="#FF5A00"
              loading={upsertProfile.isPending || createCreditor.isPending}
              fullWidth
            />
            <Text style={styles.disclaimer}>
              Estimates only. Settlement outcomes are not guaranteed.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    gap: 16,
  },
  top: { alignItems: "center", gap: 7 },
  congrats: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 36,
  },
  name: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.9)",
    lineHeight: 23,
    textAlign: "center",
  },
  stats: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingVertical: 16,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 6,
  },
  statValue: {
    fontSize: 19,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.88)",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    lineHeight: 15,
  },
  statDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  plan: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 18,
    gap: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  budget: {
    flexDirection: "row",
    alignItems: "center",
  },
  budgetCol: { flex: 1, alignItems: "center", gap: 2 },
  budgetSep: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  budgetLabel: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  budgetValue: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  perMonth: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.82)",
  },
  planMetrics: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  planMetric: {
    flex: 1,
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  planMetricDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  planLabel: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  planValue: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  debtFreeRow: {
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingVertical: 12,
  },
  debtFreeLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  debtFreeValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  fasterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 10,
  },
  fasterCopy: { flex: 1, gap: 3 },
  fasterEyebrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  fasterTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    lineHeight: 20,
  },
  fasterBody: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    lineHeight: 17,
  },
  fasterAction: {
    minWidth: 68,
    minHeight: 48,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  fasterActionPressed: { opacity: 0.65 },
  fasterActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  readinessRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  readinessCheck: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  readinessText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    lineHeight: 21,
    textAlign: "center",
  },
  readyLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  readyDot: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  readyText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 19,
    textAlign: "center",
    flexShrink: 1,
  },
  bottom: { gap: 10, marginTop: 4, paddingTop: 2 },
  cta: { backgroundColor: "#FFFFFF" },
  disclaimer: {
    textAlign: "center",
    color: "rgba(255,255,255,0.84)",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 17,
  },
});
