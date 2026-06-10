import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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
import type { PurchasesPackage } from "react-native-purchases";

import { Card } from "@/components/Card";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { useColors } from "@/hooks/useColors";
import { integrationMessage } from "@/lib/integrationErrors";
import { useRevenueCat } from "@/lib/revenueCat";
import type { BillingPeriod, PaidTier } from "@/lib/revenueCatUtils";
import { useProfile } from "@/lib/sliceData";
import { TIER_BENEFITS, TIER_META } from "@/lib/tierBenefits";
import { router } from "expo-router";
import type { SubscriptionTier } from "@/types";

interface PlanConfig {
  tier: SubscriptionTier;
  name: string;
  monthlyPrice: string;
  /** Per-month price when billed yearly (20% off). Omit for the free plan. */
  yearlyPrice?: string;
  /** Total charged once per year when billed yearly. */
  yearlyTotal?: string;
  color: string;
  highlight?: boolean;
}

const PLANS: PlanConfig[] = [
  { tier: "free", name: "Free", monthlyPrice: "$0", color: "#6B7280" },
  {
    tier: "silver",
    name: "Silver",
    monthlyPrice: "$19",
    yearlyPrice: "$15.20",
    yearlyTotal: "$182.40",
    color: "#64748B",
  },
  {
    tier: "gold",
    name: "Gold",
    monthlyPrice: "$49",
    yearlyPrice: "$39.20",
    yearlyTotal: "$470.40",
    color: "#B45309",
    highlight: true,
  },
  {
    tier: "platinum",
    name: "Platinum",
    monthlyPrice: "$99",
    yearlyPrice: "$79.20",
    yearlyTotal: "$950.40",
    color: "#7C3AED",
  },
];

// Label of the tier directly below each paid tier, for "Everything in X" copy.
const PREV_TIER_LABEL: Partial<Record<SubscriptionTier, string>> = {
  silver: "Free",
  gold: "Silver",
  platinum: "Gold",
};

// Trust signals shown above the plans. These are factual reassurances, not
// testimonials or results claims. Swap in real member testimonials here once
// they're available and compliance-approved.
const TRUST_POINTS: { icon: keyof typeof Feather.glyphMap; text: string }[] = [
  { icon: "book-open", text: "Built on the methods in our book, Debt Settlements: Dirty Little Secrets" },
  { icon: "award", text: "Live coaching with Marc Feinberg, SLICE's founder" },
  { icon: "refresh-cw", text: "Cancel anytime — billing is handled by the App Store or Google Play" },
];

function freeTrialLabel(pkg?: PurchasesPackage): string | null {
  const intro = pkg?.product.introPrice;
  if (!intro || intro.price > 0) return null;
  const unit = (intro.periodUnit ?? "DAY").toLowerCase();
  return `Start ${intro.periodNumberOfUnits}-${unit} free trial`;
}

export default function PricingScreen() {
  const colors = useColors();
  const { profile } = useProfile();
  const revenueCat = useRevenueCat();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");
  const [activeAction, setActiveAction] = useState<SubscriptionTier | "restore" | "manage" | null>(null);
  const [actionError, setActionError] = useState("");
  const [celebrateTier, setCelebrateTier] = useState<SubscriptionTier | null>(null);

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 20;

  useEffect(() => {
    void revenueCat.refresh();
  }, []);

  const handleUpgrade = async (plan: PlanConfig) => {
    if (plan.tier === profile.tier) return;
    setActiveAction(plan.tier);
    setActionError("");
    try {
      if (plan.tier === "free") {
        await revenueCat.manage();
        return;
      }
      const result = await revenueCat.purchase(plan.tier as PaidTier, billingPeriod);
      if (!result.cancelled) {
        setCelebrateTier(plan.tier);
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

  const celebrateMeta = celebrateTier ? TIER_META[celebrateTier] : null;
  const celebrateMessage = celebrateTier
    ? TIER_BENEFITS[celebrateTier].headline.slice(0, 2).join(" · ")
    : undefined;

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

        {/* Trust signals */}
        <Card style={styles.socialProof}>
          {TRUST_POINTS.map((item) => (
            <View key={item.text} style={styles.proofRow}>
              <Feather name={item.icon} size={16} color={colors.primary} />
              <Text style={[styles.proofQuote, { color: colors.foreground, flex: 1 }]}>
                {item.text}
              </Text>
            </View>
          ))}
        </Card>

        <View style={[styles.billingToggle, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          {(["monthly", "yearly"] as BillingPeriod[]).map((period) => {
            const active = billingPeriod === period;
            return (
              <Pressable
                key={period}
                onPress={() => setBillingPeriod(period)}
                style={[
                  styles.billingOption,
                  active && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.billingOptionText,
                    { color: active ? "#FFFFFF" : colors.mutedForeground },
                  ]}
                >
                  {period === "monthly" ? "Monthly" : "Yearly · Save 20%"}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.billingNote, { color: colors.primary }]}>
          Pay yearly in full and save 20% — that's 2 months free.
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
          const isYearly = billingPeriod === "yearly" && plan.tier !== "free";
          const storePackage =
            plan.tier === "free" ? undefined : revenueCat.packages[plan.tier]?.[billingPeriod];
          const fallbackPrice = isYearly ? plan.yearlyPrice ?? plan.monthlyPrice : plan.monthlyPrice;
          const displayPrice = storePackage?.product.priceString ?? fallbackPrice;
          const period = plan.tier === "free" ? "forever" : "per month";
          const packageUnavailable = plan.tier !== "free" && revenueCat.configured && !storePackage;
          const trialLabel = freeTrialLabel(storePackage);
          const planFeatures =
            plan.tier === "free"
              ? TIER_BENEFITS.free.all
              : [
                  `Everything in ${PREV_TIER_LABEL[plan.tier] ?? "Free"}`,
                  ...TIER_BENEFITS[plan.tier].all,
                ];
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
                <View style={styles.planHeaderLeft}>
                  <View style={styles.planNameRow}>
                    <Feather name={TIER_META[plan.tier].icon} size={16} color={plan.color} />
                    <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={[styles.planPrice, { color: colors.foreground }]}>
                      {displayPrice}
                    </Text>
                    <Text style={[styles.planPeriod, { color: colors.mutedForeground }]}>
                      /{period}
                    </Text>
                  </View>
                  {isYearly && plan.yearlyTotal && (
                    <Text style={[styles.yearlyTotal, { color: colors.mutedForeground }]}>
                      {plan.yearlyTotal} billed annually
                    </Text>
                  )}
                  {isYearly && (
                    <View style={[styles.savePill, { backgroundColor: colors.success }]}>
                      <Text style={styles.savePillText}>SAVE 20%</Text>
                    </View>
                  )}
                  {trialLabel && (
                    <Text style={[styles.trialText, { color: colors.success }]}>{trialLabel}</Text>
                  )}
                </View>
                {isCurrent && (
                  <View style={[styles.currentDot, { backgroundColor: "#22C55E" }]} />
                )}
              </View>

              <View style={styles.features}>
                {planFeatures.map((feature, i) => (
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
                          : trialLabel
                            ? `Try ${plan.name} free`
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

      <CelebrationOverlay
        visible={celebrateTier !== null}
        title={celebrateMeta ? `${celebrateMeta.label} Unlocked!` : "Unlocked!"}
        message={celebrateMessage}
        onDone={() => {
          setCelebrateTier(null);
          router.push("/membership");
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 16 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  socialProof: { gap: 14 },
  proofRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  proofQuote: { fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 19 },
  billingToggle: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 7,
    alignItems: "center",
  },
  billingOptionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  billingNote: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginTop: -8,
  },
  yearlyTotal: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  savePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  savePillText: { color: "#FFFFFF", fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.6 },
  trialText: { fontSize: 12, fontFamily: "Inter_700Bold", marginTop: 6 },
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
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  planHeaderLeft: { flex: 1 },
  planNameRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 4 },
  planName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  planPrice: { fontSize: 28, fontFamily: "Inter_700Bold" },
  planPeriod: { fontSize: 12, fontFamily: "Inter_400Regular" },
  currentDot: { width: 10, height: 10, borderRadius: 5 },
  features: { gap: 10 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
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
