import { Feather } from "@expo/vector-icons";
import React from "react";
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
import * as Haptics from "expo-haptics";

import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/useAppStore";
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
  const { profile, upgradeTier } = useAppStore((s) => ({
    profile: s.profile,
    upgradeTier: s.upgradeTier,
  }));

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 20;

  const handleUpgrade = (plan: PlanConfig) => {
    if (plan.tier === profile.tier) return;
    Alert.alert(
      `Upgrade to ${plan.name}`,
      `${plan.name} plan is ${plan.price}/${plan.period}. In-app purchases will be available soon via RevenueCat. For now, your plan has been updated for demo purposes.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Upgrade (Demo)",
          onPress: () => {
            upgradeTier(plan.tier);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
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

        {PLANS.map((plan) => {
          const isCurrent = profile.tier === plan.tier;
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
                      {plan.price}
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
                style={[
                  styles.upgradeBtn,
                  {
                    backgroundColor: isCurrent ? colors.muted : plan.color,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.upgradeBtnText,
                    { color: isCurrent ? colors.mutedForeground : "#FFFFFF" },
                  ]}
                >
                  {isCurrent ? "Current Plan" : plan.tier === "free" ? "Downgrade to Free" : `Upgrade to ${plan.name}`}
                </Text>
              </Pressable>
            </View>
          );
        })}

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Subscription pricing shown is for illustration. Actual billing will be handled via
          RevenueCat / App Store. Cancel anytime. SLICE does not guarantee debt settlement results.
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
  disclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16 },
});
