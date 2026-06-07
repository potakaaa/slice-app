import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";

import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";
import { integrationMessage } from "@/lib/integrationErrors";
import { useRevenueCat } from "@/lib/revenueCat";
import type { PaidTier } from "@/lib/revenueCatUtils";
import { useProfile } from "@/lib/sliceData";
import type { SubscriptionTier } from "@/types";

interface PlanConfig {
  tier: SubscriptionTier;
  name: string;
  price: string;
  period: string;
  color: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: PlanConfig[] = [
  {
    tier: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    color: "#6B7280",
    features: [
      "Dashboard",
      "Creditor list & management",
      "Customized debt program",
      "Settlement calculator",
      "Snowball timeline",
      "Monthly savings planner",
      "Credit repair education",
      "Credit score tracker",
    ],
  },
  {
    tier: "silver",
    name: "Silver",
    price: "$9.99",
    period: "per month",
    color: "#64748B",
    highlight: true,
    features: [
      "Everything in Free",
      "Zest AI Debt Coach",
      "AI negotiation strategy (all creditors)",
      "AI customized negotiation scripts",
      "Tone selector for scripts",
      "Mastermind preview access",
    ],
  },
  {
    tier: "gold",
    name: "Gold",
    price: "$24.99",
    period: "per month",
    color: "#B45309",
    features: [
      "Everything in Silver",
      "Mastermind replay library",
      "Coaching session options",
      "Tax advisory booking",
      "1-on-1 with Marc Feinberg",
      "Priority support",
    ],
  },
  {
    tier: "platinum",
    name: "Platinum",
    price: "$49.99",
    period: "per month",
    color: "#7C3AED",
    features: [
      "Everything in Gold",
      "Live done-with-you creditor calls",
      "Priority coaching scheduling",
      "Direct access to Marc Feinberg",
      "Advanced settlement guidance",
      "White-glove support",
    ],
  },
];

export default function PricingScreen() {
  const colors = useColors();
  const { profile } = useProfile();
  const revenueCat = useRevenueCat();
  const [activeAction, setActiveAction] = useState<SubscriptionTier | "restore" | "manage" | null>(null);
  const [actionError, setActionError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 20;

  const handleUpgrade = async (plan: PlanConfig) => {
    if (plan.tier === profile.tier) return;
    setActiveAction(plan.tier);
    setActionError("");
    try {
      if (plan.tier === "free") {
        await revenueCat.manage();
        return;
      }
      const result = await revenueCat.purchase(plan.tier as PaidTier);
      if (!result.cancelled) {
        Alert.alert("Subscription Updated", `${plan.name} access is now syncing to your SLICE account.`);
      }
    } catch (error) {
      setActionError(integrationMessage(error, "The subscription action could not be completed."));
    } finally {
      setActiveAction(null);
    }
  };

  const handleRestore = async () => {
    setActiveAction("restore");
    setActionError("");
    try {
      await revenueCat.restore();
      Alert.alert("Purchases Restored", "Your subscription access has been refreshed.");
    } catch (error) {
      setActionError(integrationMessage(error, "Purchases could not be restored."));
    } finally {
      setActiveAction(null);
    }
  };

  const handleManage = async () => {
    setActiveAction("manage");
    setActionError("");
    try {
      await revenueCat.manage();
    } catch (error) {
      setActionError(integrationMessage(error, "Subscription management could not be opened."));
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Choose the plan that fits your debt resolution journey.
          Upgrade or downgrade anytime.
        </Text>

        <View style={[styles.currentBanner, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
          <Feather name="check-circle" size={16} color={colors.primary} />
          <Text style={[styles.currentText, { color: colors.foreground }]}>
            Current plan:{" "}
            <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold" }}>
              {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)}
            </Text>
          </Text>
        </View>

        {!revenueCat.available && (
          <Card style={[styles.integrationNotice, { borderColor: colors.primary }]}>
            <Feather name="info" size={18} color={colors.primary} />
            <Text style={[styles.integrationNoticeText, { color: colors.foreground }]}>
              Real purchases require an iOS or Android development build. Expo Go and web can preview this screen only.
            </Text>
          </Card>
        )}

        {(actionError || revenueCat.error) && (
          <Card style={[styles.errorCard, { borderColor: colors.destructive }]}>
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {actionError || integrationMessage(revenueCat.error, "Subscription products could not be loaded.")}
            </Text>
            {revenueCat.available && (
              <Pressable onPress={() => revenueCat.refresh()}>
                <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
              </Pressable>
            )}
          </Card>
        )}

        {PLANS.map((plan) => {
          const isCurrent = profile.tier === plan.tier;
          const storePackage = plan.tier === "free" ? undefined : revenueCat.packages[plan.tier];
          const displayPrice = storePackage?.product.priceString ?? plan.price;
          const packageUnavailable = plan.tier !== "free" && revenueCat.configured && !storePackage;
          return (
            <View
              key={plan.tier}
              style={[
                styles.planCard,
                {
                  backgroundColor: colors.card,
                  borderColor: plan.highlight ? colors.primary : isCurrent ? plan.color : colors.border,
                  borderWidth: plan.highlight || isCurrent ? 2 : 1,
                },
              ]}
            >
              {plan.highlight && (
                <View style={[styles.popularTag, { backgroundColor: colors.primary }]}>
                  <Text style={styles.popularTagText}>MOST POPULAR</Text>
                </View>
              )}
              {isCurrent && !plan.highlight && (
                <View style={[styles.popularTag, { backgroundColor: plan.color }]}>
                  <Text style={styles.popularTagText}>CURRENT PLAN</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.planPrice, { color: colors.foreground }]}>
                      {displayPrice}
                    </Text>
                    <Text style={[styles.planPeriod, { color: colors.mutedForeground }]}>
                      /{plan.period}
                    </Text>
                  </View>
                </View>
                {isCurrent && (
                  <View style={[styles.currentDot, { backgroundColor: "#22C55E" }]} />
                )}
              </View>

              <View style={styles.features}>
                {plan.features.map((feature, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Feather name="check" size={14} color={plan.color} />
                    <Text style={[styles.featureText, { color: colors.foreground }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => handleUpgrade(plan)}
                disabled={
                  isCurrent ||
                  activeAction !== null ||
                  revenueCat.loading ||
                  !revenueCat.available ||
                  packageUnavailable
                }
                style={[
                  styles.upgradeBtn,
                  {
                    backgroundColor: isCurrent ? colors.muted : plan.color,
                    opacity:
                      isCurrent ||
                      activeAction !== null ||
                      revenueCat.loading ||
                      !revenueCat.available ||
                      packageUnavailable
                        ? 0.55
                        : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.upgradeBtnText,
                    { color: isCurrent ? colors.mutedForeground : "#FFFFFF" },
                  ]}
                >
                  {activeAction === plan.tier
                    ? "Processing..."
                    : isCurrent
                      ? "Current Plan"
                      : packageUnavailable
                        ? "Unavailable"
                        : plan.tier === "free"
                          ? "Manage Paid Plan"
                          : `Choose ${plan.name}`}
                </Text>
              </Pressable>
            </View>
          );
        })}

        <View style={styles.subscriptionActions}>
          <Pressable
            onPress={handleRestore}
            disabled={activeAction !== null || !revenueCat.available}
          >
            <Text style={[styles.subscriptionLink, { color: colors.primary }]}>
              {activeAction === "restore" ? "Restoring..." : "Restore Purchases"}
            </Text>
          </Pressable>
          {profile.tier !== "free" && (
            <Pressable
              onPress={handleManage}
              disabled={activeAction !== null || !revenueCat.available}
            >
              <Text style={[styles.subscriptionLink, { color: colors.primary }]}>
                {activeAction === "manage" ? "Opening..." : "Manage Subscription"}
              </Text>
            </Pressable>
          )}
        </View>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Store pricing is loaded through RevenueCat when available. Billing and cancellation are
          handled by Apple App Store or Google Play. SLICE does not guarantee debt settlement results.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 16 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  currentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  currentText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  integrationNotice: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1 },
  integrationNoticeText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 18 },
  errorCard: { borderWidth: 1, gap: 8 },
  errorText: { fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 18 },
  retryText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  planCard: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
    overflow: "hidden",
    position: "relative",
  },
  popularTag: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomLeftRadius: 10,
  },
  popularTagText: { color: "#FFFFFF", fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  planName: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  planPrice: { fontSize: 28, fontFamily: "Inter_700Bold" },
  planPeriod: { fontSize: 12, fontFamily: "Inter_400Regular" },
  currentDot: { width: 10, height: 10, borderRadius: 5 },
  features: { gap: 10 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  upgradeBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  upgradeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  subscriptionActions: { flexDirection: "row", justifyContent: "center", gap: 20 },
  subscriptionLink: { fontSize: 13, fontFamily: "Inter_700Bold" },
  disclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16 },
});
