import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Alert,
  Platform,
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
  calcSettlementReadiness,
  formatCurrency,
  getMaxProgramLength,
  getTotalDebt,
  getTotalSettlementTarget,
} from "@/utils/calculations";

export default function OnboardingComplete() {
  const { session } = useAuth();
  const creditors = useAppStore((s) => s.creditors);
  const profile = useAppStore((s) => s.profile);
  const onboardingReadyForAuth = useAppStore((s) => s.onboardingReadyForAuth);
  const clearDraft = useAppStore((s) => s.clearDraft);
  const setTutorialStatus = useAppStore((s) => s.setTutorialStatus);
  const createCreditor = useCreateCreditor();
  const upsertProfile = useUpsertProfile();

  const totalDebt = getTotalDebt(creditors);
  const totalTarget = getTotalSettlementTarget(creditors);
  const savings = totalDebt - totalTarget;
  const months = getMaxProgramLength(creditors);
  const readiness = calcSettlementReadiness(
    creditors,
    profile.currentSavedCash,
    profile.defaultMonthlySavings
  );
  const readinessText = readiness.isReadyNow
    ? "You may be settlement-ready now — enough saved to make your first offer."
    : readiness.daysUntilReady != null
      ? `You may be settlement-ready in ${readiness.daysUntilReady} days — save about ${formatCurrency(readiness.dailySetAside)}/day.`
      : null;

  useEffect(() => {
    if (!session) {
      router.replace("/auth");
      return;
    }
    // This screen summarizes a finished onboarding draft. If the user reached it
    // without completing onboarding (e.g. a direct sign-up), send them through
    // the flow instead of showing an empty/stale "Your Program Is Ready".
    if (!onboardingReadyForAuth || creditors.length === 0) {
      router.replace("/onboarding");
      return;
    }
    // M5: "Your Program Is Ready" — the aha moment. Full celebration with the
    // warm pride voice (its own success haptic), once per user.
    celebrate("m5_first_plan", { once: true });
  }, [session, onboardingReadyForAuth, creditors.length]);

  const handleStart = async () => {
    if (!session) {
      router.replace("/auth");
      return;
    }
    try {
      await upsertProfile.mutateAsync({
        ...profile,
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
          monthlySavings: creditor.monthlySavings,
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
            <SliceLogo size={80} />
            <Text style={styles.congrats}>Your Program Is Ready!</Text>
            <Text style={styles.name}>
              {profile.name
                ? `Great work, ${profile.name.split(" ")[0].charAt(0).toUpperCase() + profile.name.split(" ")[0].slice(1)}!`
                : "Great work!"}
            </Text>
          </View>

          <View style={styles.stats}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(totalDebt)}</Text>
              <Text style={styles.statLabel}>Total Debt</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(totalTarget)}</Text>
              <Text style={styles.statLabel}>Settlement Target</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statCard}>
              <Text style={[styles.statValue, styles.savingsValue]}>
                {formatCurrency(savings)}
              </Text>
              <Text style={styles.statLabel}>Potential Savings</Text>
            </View>
          </View>

          {months > 0 && (
            <View style={styles.timeline}>
              <Text style={styles.timelineText}>
                Estimated program length:
              </Text>
              <Text style={styles.timelineMonths}>
                {months} months
              </Text>
            </View>
          )}

          {readinessText && (
            <View style={styles.readiness}>
              <Text style={styles.readinessText}>{readinessText}</Text>
            </View>
          )}

          <View style={styles.bullets}>
            {[
              "Your creditors are sorted by snowball priority",
              "AI negotiation strategies are ready for each creditor",
              "Track savings progress on your dashboard",
            ].map((item, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>✓</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
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
              Results are estimates. SLICE does not guarantee settlement outcomes.
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
    paddingTop: 28,
    paddingBottom: Platform.OS === "web" ? 40 : 28,
    gap: 24,
  },
  top: { alignItems: "center", gap: 14 },
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
    color: "#FFFFFF",
    lineHeight: 24,
    textAlign: "center",
  },
  stats: {
    gap: 0,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  statCard: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  savingsValue: { color: "#FFFFFF" },
  statLabel: {
    fontSize: 11,
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  timeline: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 20,
    gap: 4,
  },
  timelineText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
  timelineMonths: {
    color: "#FFFFFF",
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  readiness: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  readinessText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
    textAlign: "center",
  },
  bullets: { gap: 14, paddingHorizontal: 2 },
  bullet: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  bulletDot: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
  },
  bulletText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    lineHeight: 23,
  },
  bottom: { gap: 12, marginTop: "auto", paddingTop: 4 },
  cta: { backgroundColor: "#FFFFFF" },
  disclaimer: {
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 17,
  },
});
