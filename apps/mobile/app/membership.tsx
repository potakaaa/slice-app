import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";
import { integrationMessage } from "@/lib/integrationErrors";
import { useRevenueCat } from "@/lib/revenueCat";
import { useAiUsage, useCreditors, useProfile } from "@/lib/sliceData";
import {
  AI_DAILY_LIMITS,
  TIER_BENEFITS,
  TIER_META,
  benefitsUnlockedBy,
  nextTier,
  tierMeets,
} from "@/lib/tierBenefits";
import type { SubscriptionTier } from "@/types";
import {
  formatCurrency,
  getTotalDebt,
  getTotalSettlementTarget,
} from "@/utils/calculations";

interface MemberResource {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  detail: string;
  requiredTier: SubscriptionTier;
  route?: string;
}

const MEMBER_RESOURCES: MemberResource[] = [
  {
    icon: "book-open",
    label: "Debt Settlements: Dirty Little Secrets",
    detail: "Your member copy of our negotiation playbook",
    requiredTier: "silver",
  },
  {
    icon: "video",
    label: "Weekly coaching with Marc",
    detail: "Live Zoom group sessions + 1-on-1 booking",
    requiredTier: "gold",
    route: "/coaching",
  },
  {
    icon: "phone-call",
    label: "Done-with-you creditor calls",
    detail: "We get on the call and negotiate with you",
    requiredTier: "platinum",
    route: "/coaching",
  },
];

export default function MembershipScreen() {
  const colors = useColors();
  const { profile } = useProfile();
  const { creditors } = useCreditors();
  const { features } = useAiUsage();
  const revenueCat = useRevenueCat();
  const [subscriptionBusy, setSubscriptionBusy] = useState<"restore" | "manage" | null>(null);

  const tier = profile.tier;
  const meta = TIER_META[tier];
  const isPaid = tier !== "free";
  const upgradeTier = nextTier(tier);

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 20;

  const estimatedSavings = getTotalDebt(creditors) - getTotalSettlementTarget(creditors);
  const settledCount = creditors.filter((c) => c.status === "settled").length;
  const aiUsedToday = features.reduce((sum, f) => sum + f.used, 0);

  const benefits = benefitsUnlockedBy(tier);

  const handleSubscriptionAction = async (action: "restore" | "manage") => {
    setSubscriptionBusy(action);
    try {
      if (action === "restore") {
        await revenueCat.restore();
        Alert.alert("Purchases Restored", "Your subscription access has been refreshed.");
      } else {
        await revenueCat.manage();
      }
    } catch (error) {
      Alert.alert("Subscription", integrationMessage(error, "The subscription action could not be completed."));
    } finally {
      setSubscriptionBusy(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Prestige hero — the unmistakable "you own this" moment */}
        <LinearGradient
          colors={meta.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <Feather name={meta.icon} size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.heroEyebrow}>
            {isPaid ? "YOUR MEMBERSHIP" : "CURRENT PLAN"}
          </Text>
          <Text style={styles.heroTitle}>SLICE {meta.label}</Text>
          <Text style={styles.heroTagline}>{meta.tagline}</Text>
        </LinearGradient>

        {!isPaid && (
          <Card style={[styles.upsellHeadline, { borderColor: colors.primary }]}>
            <Text style={[styles.upsellHeadlineTitle, { color: colors.foreground }]}>
              Unlock AI negotiation, scripts & coaching
            </Text>
            <Text style={[styles.upsellHeadlineDesc, { color: colors.mutedForeground }]}>
              Paid members get AI strategy, call scripts, the Zest coach, and live coaching —
              everything you need to settle for less.
            </Text>
            <Button label="See plans" onPress={() => router.push("/pricing")} fullWidth />
          </Card>
        )}

        {/* What you've unlocked */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {isPaid ? "What you've unlocked" : "What's included"}
          </Text>
          <View style={styles.benefitList}>
            {benefits.map((benefit) => (
              <View key={benefit} style={styles.benefitRow}>
                <View style={[styles.benefitCheck, { backgroundColor: meta.color }]}>
                  <Feather name="check" size={11} color="#FFFFFF" />
                </View>
                <Text style={[styles.benefitText, { color: colors.foreground }]}>{benefit}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* AI usage meters */}
        <Card>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>
              AI requests today
            </Text>
            {isPaid && (
              <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
                Resets daily
              </Text>
            )}
          </View>
          {isPaid ? (
            <View style={styles.meterList}>
              {features.map((feature) => {
                const ratio = feature.limit > 0 ? Math.min(1, feature.used / feature.limit) : 0;
                return (
                  <View key={feature.key} style={styles.meter}>
                    <View style={styles.meterLabelRow}>
                      <Text style={[styles.meterLabel, { color: colors.foreground }]}>
                        {feature.label}
                      </Text>
                      <Text style={[styles.meterValue, { color: colors.mutedForeground }]}>
                        {feature.used}/{feature.limit}
                      </Text>
                    </View>
                    <View style={[styles.meterTrack, { backgroundColor: colors.muted }]}>
                      <View
                        style={[
                          styles.meterFill,
                          { width: `${ratio * 100}%`, backgroundColor: meta.color },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={[styles.lockedText, { color: colors.mutedForeground }]}>
              Unlock up to {AI_DAILY_LIMITS.silver} AI requests/day per tool with Silver.
            </Text>
          )}
        </Card>

        {/* Value delivered */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Value delivered</Text>
          <View style={styles.valueRow}>
            <View style={styles.valueStat}>
              <Text style={[styles.valueNumber, { color: colors.primary }]}>
                {formatCurrency(Math.max(0, estimatedSavings))}
              </Text>
              <Text style={[styles.valueLabel, { color: colors.mutedForeground }]}>
                Est. savings
              </Text>
            </View>
            <View style={styles.valueStat}>
              <Text style={[styles.valueNumber, { color: colors.foreground }]}>{settledCount}</Text>
              <Text style={[styles.valueLabel, { color: colors.mutedForeground }]}>
                Creditors settled
              </Text>
            </View>
            <View style={styles.valueStat}>
              <Text style={[styles.valueNumber, { color: colors.foreground }]}>{aiUsedToday}</Text>
              <Text style={[styles.valueLabel, { color: colors.mutedForeground }]}>
                AI requests today
              </Text>
            </View>
          </View>
        </Card>

        {/* Member resources */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Member resources</Text>
          <View style={styles.resourceList}>
            {MEMBER_RESOURCES.map((resource) => {
              const unlocked = tierMeets(tier, resource.requiredTier);
              const interactive = unlocked && Boolean(resource.route);
              return (
                <Pressable
                  key={resource.label}
                  disabled={!interactive}
                  onPress={() => resource.route && router.push(resource.route as never)}
                  style={({ pressed }) => [styles.resourceRow, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <View
                    style={[
                      styles.resourceIcon,
                      { backgroundColor: unlocked ? colors.secondary : colors.muted },
                    ]}
                  >
                    <Feather
                      name={unlocked ? resource.icon : "lock"}
                      size={16}
                      color={unlocked ? colors.primary : colors.mutedForeground}
                    />
                  </View>
                  <View style={styles.resourceText}>
                    <Text style={[styles.resourceLabel, { color: colors.foreground }]}>
                      {resource.label}
                    </Text>
                    <Text style={[styles.resourceDetail, { color: colors.mutedForeground }]}>
                      {unlocked
                        ? resource.detail
                        : `Unlocks with ${TIER_META[resource.requiredTier].label}`}
                    </Text>
                  </View>
                  {interactive && (
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Unlock more — next tier upsell */}
        {upgradeTier && (
          <Pressable
            onPress={() => router.push("/pricing")}
            style={({ pressed }) => [
              styles.unlockCard,
              { borderColor: TIER_META[upgradeTier].color, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={styles.unlockHeader}>
              <Feather name={TIER_META[upgradeTier].icon} size={18} color={TIER_META[upgradeTier].color} />
              <Text style={[styles.unlockTitle, { color: colors.foreground }]}>
                Unlock more with {TIER_META[upgradeTier].label}
              </Text>
            </View>
            <View style={styles.unlockBenefits}>
              {TIER_BENEFITS[upgradeTier].headline.map((benefit) => (
                <View key={benefit} style={styles.unlockBenefitRow}>
                  <Feather name="plus" size={13} color={TIER_META[upgradeTier].color} />
                  <Text style={[styles.unlockBenefitText, { color: colors.foreground }]}>
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>
            <View style={[styles.unlockCta, { backgroundColor: TIER_META[upgradeTier].color }]}>
              <Text style={styles.unlockCtaText}>Choose {TIER_META[upgradeTier].label}</Text>
            </View>
          </Pressable>
        )}

        {/* Manage subscription */}
        {isPaid && (
          <View style={styles.manageRow}>
            <Pressable
              onPress={() => handleSubscriptionAction("restore")}
              disabled={subscriptionBusy !== null || !revenueCat.available}
            >
              <Text style={[styles.manageLink, { color: colors.primary }]}>
                {subscriptionBusy === "restore" ? "Restoring..." : "Restore Purchases"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleSubscriptionAction("manage")}
              disabled={subscriptionBusy !== null || !revenueCat.available}
            >
              <Text style={[styles.manageLink, { color: colors.primary }]}>
                {subscriptionBusy === "manage" ? "Opening..." : "Manage Subscription"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 14 },
  hero: {
    borderRadius: 18,
    padding: 22,
    gap: 4,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  heroTitle: { color: "#FFFFFF", fontSize: 26, fontFamily: "Inter_700Bold" },
  heroTagline: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontFamily: "Inter_500Medium" },
  upsellHeadline: { borderWidth: 1.5, gap: 8 },
  upsellHeadlineTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  upsellHeadlineDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHint: { fontSize: 11, fontFamily: "Inter_500Medium" },
  benefitList: { gap: 10 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  meterList: { gap: 14 },
  meter: { gap: 6 },
  meterLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  meterLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  meterValue: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  meterTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  meterFill: { height: 8, borderRadius: 4 },
  lockedText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  valueRow: { flexDirection: "row", gap: 12 },
  valueStat: { flex: 1, gap: 3 },
  valueNumber: { fontSize: 18, fontFamily: "Inter_700Bold" },
  valueLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  resourceList: { gap: 4 },
  resourceRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  resourceIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  resourceText: { flex: 1, gap: 2 },
  resourceLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  resourceDetail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  unlockCard: { borderRadius: 16, borderWidth: 1.5, padding: 18, gap: 14 },
  unlockHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  unlockTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  unlockBenefits: { gap: 8 },
  unlockBenefitRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  unlockBenefitText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  unlockCta: { paddingVertical: 13, borderRadius: 10, alignItems: "center" },
  unlockCtaText: { color: "#FFFFFF", fontSize: 14, fontFamily: "Inter_700Bold" },
  manageRow: { flexDirection: "row", justifyContent: "center", gap: 20, paddingTop: 4 },
  manageLink: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
