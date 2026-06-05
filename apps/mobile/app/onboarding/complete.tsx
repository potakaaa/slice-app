import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

import { Button } from "@/components/Button";
import { SliceLogo } from "@/components/SliceLogo";
import { useCreateCreditor, useUpsertProfile } from "@/lib/sliceData";
import { useAppStore } from "@/store/useAppStore";
import {
  formatCurrency,
  getMaxProgramLength,
  getTotalDebt,
  getTotalSettlementTarget,
} from "@/utils/calculations";

export default function OnboardingComplete() {
  const creditors = useAppStore((s) => s.creditors);
  const profile = useAppStore((s) => s.profile);
  const resetDraft = useAppStore((s) => s.resetApp);
  const createCreditor = useCreateCreditor();
  const upsertProfile = useUpsertProfile();

  const totalDebt = getTotalDebt(creditors);
  const totalTarget = getTotalSettlementTarget(creditors);
  const savings = totalDebt - totalTarget;
  const months = getMaxProgramLength(creditors);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleStart = async () => {
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
    resetDraft();
    router.replace("/(tabs)");
  };

  const topPad = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FF6B35", "#FF8C5A"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView style={[styles.safe, { paddingTop: topPad }]}>
        <View style={styles.content}>
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
              textColor="#FF6B35"
              loading={upsertProfile.isPending || createCreditor.isPending}
              fullWidth
            />
            <Text style={styles.disclaimer}>
              Results are estimates. SLICE does not guarantee settlement outcomes.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 20,
    justifyContent: "space-between",
  },
  top: { alignItems: "center", gap: 12, paddingTop: 16 },
  congrats: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  name: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.9)",
  },
  stats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  statCard: { flex: 1, alignItems: "center", gap: 4 },
  statValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  savingsValue: { color: "#DCFCE7" },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  timeline: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 16,
  },
  timelineText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  timelineMonths: {
    color: "#FFFFFF",
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  bullets: { gap: 10 },
  bullet: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletDot: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
  },
  bulletText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 22,
  },
  bottom: { gap: 10, paddingBottom: Platform.OS === "web" ? 34 : 0 },
  cta: { backgroundColor: "#FFFFFF" },
  disclaimer: {
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
