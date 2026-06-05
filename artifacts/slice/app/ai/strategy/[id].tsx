import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/useAppStore";
import {
  formatCurrency,
  formatPct,
  getAISuggestedOffer,
} from "@/utils/calculations";

const NEGOTIATION_TIPS = [
  "Ask for written confirmation of any settlement before making payment",
  "Never give direct access to your bank account — use a money order or cashier's check",
  "Ask whether the account can be marked as 'Paid in Full' rather than 'Settled'",
  "Record the name, employee ID, and date of every call",
  "Do not admit to owing the debt until you have verified the account",
  "Prepare a hardship statement — creditors respond well to documented hardship",
  "Never accept a verbal agreement — get everything in writing",
  "Ask about the tax implications of the forgiven debt (1099-C)",
];

const WHAT_NOT_TO_SAY = [
  "Do not say 'I can afford to pay the full amount'",
  "Do not reveal your savings or total financial picture",
  "Do not make promises you cannot keep — only commit to what you can actually do",
  "Do not accept the first offer — creditors expect to negotiate",
];

export default function AIStrategyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { creditors, profile } = useAppStore((s) => ({
    creditors: s.creditors,
    profile: s.profile,
  }));

  const creditor = creditors.find((c) => c.id === id) ?? creditors[0];
  const isSilver = profile.tier !== "free";
  const topPad = Platform.OS === "web" ? 67 : 0;

  if (!creditor) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Text style={{ padding: 20 }}>Add creditors first to see AI strategies.</Text>
      </SafeAreaView>
    );
  }

  const aiOffer = getAISuggestedOffer(creditor.balance);
  const aiOfferAmt = creditor.balance * aiOffer;
  const bottomPad = Platform.OS === "web" ? 34 : 20;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.headerCard, { backgroundColor: colors.primary }]}>
          <View style={styles.aiBadge}>
            <Feather name="cpu" size={14} color="#8B5CF6" />
            <Text style={styles.aiBadgeText}>AI Strategy</Text>
          </View>
          <Text style={styles.creditorName}>{creditor.name}</Text>
          <Text style={styles.balance}>{formatCurrency(creditor.balance)} balance</Text>
        </View>

        {!isSilver ? (
          <UpgradePrompt
            requiredTier="silver"
            feature="AI Negotiation Strategy"
            description="Get personalized negotiation strategies, suggested first offers, and step-by-step guidance for each creditor. Available on the Silver plan."
          />
        ) : (
          <>
            {/* Suggested first offer */}
            <Card style={[styles.offerCard, { backgroundColor: "#F5F3FF", borderColor: "#8B5CF6", borderWidth: 1.5 }]}>
              <Text style={[styles.offerLabel, { color: "#7C3AED" }]}>
                AI SUGGESTED FIRST OFFER
              </Text>
              <Text style={[styles.offerAmount, { color: "#5B21B6" }]}>
                {formatCurrency(aiOfferAmt)}
              </Text>
              <Text style={[styles.offerPct, { color: "#7C3AED" }]}>
                {formatPct(aiOffer)} of {formatCurrency(creditor.balance)}
              </Text>
              <Text style={[styles.offerReason, { color: "#6D28D9" }]}>
                Starting at {formatPct(aiOffer)} gives you room to negotiate up to your target of{" "}
                {formatPct(creditor.settlementPercentage)}. Creditors expect counter-offers.
              </Text>
            </Card>

            {/* Strategy steps */}
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Negotiation Strategy
              </Text>
              <View style={styles.steps}>
                {[
                  {
                    step: "1",
                    title: "Prepare your hardship statement",
                    desc: "Write 2-3 sentences explaining your financial hardship. Loss of income, medical costs, or major life changes are effective. Keep it brief and factual.",
                  },
                  {
                    step: "2",
                    title: `Open with ${formatPct(aiOffer)} offer`,
                    desc: `Tell them you can pay ${formatCurrency(aiOfferAmt)} as a full and final settlement. This gives you room to negotiate up to ${formatPct(creditor.settlementPercentage)}.`,
                  },
                  {
                    step: "3",
                    title: "Let them counter — don't rush",
                    desc: "If they counter, ask for time to 'check with family' or 'review your budget'. This is normal and expected.",
                  },
                  {
                    step: "4",
                    title: "Get the agreement in writing first",
                    desc: "Before making any payment, request a written settlement agreement via email or mail. Do not pay based on a verbal commitment.",
                  },
                  {
                    step: "5",
                    title: "Ask about credit reporting",
                    desc: `Ask if they can report the account as "Paid in Full" rather than "Settled." Not guaranteed, but worth asking.`,
                  },
                ].map((item) => (
                  <View key={item.step} style={styles.step}>
                    <View style={[styles.stepNum, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.stepNumText, { color: colors.primary }]}>
                        {item.step}
                      </Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
                        {item.desc}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            {/* Do's */}
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Key Tips
              </Text>
              {NEGOTIATION_TIPS.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Feather name="check" size={14} color={colors.success} />
                  <Text style={[styles.tipText, { color: colors.foreground }]}>{tip}</Text>
                </View>
              ))}
            </Card>

            {/* Don'ts */}
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.destructive }]}>
                What NOT to Say
              </Text>
              {WHAT_NOT_TO_SAY.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Feather name="x" size={14} color={colors.destructive} />
                  <Text style={[styles.tipText, { color: colors.foreground }]}>{tip}</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        <Button
          label="Get AI Negotiation Script"
          onPress={() => router.push(`/ai/script/${creditor.id}`)}
          variant="secondary"
          fullWidth
        />

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          This strategy is for educational purposes only. SLICE does not guarantee any
          creditor will accept a settlement offer. Consult a financial professional for
          personalized advice.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { gap: 12, padding: 16 },
  headerCard: { borderRadius: 16, padding: 20, gap: 6 },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    marginBottom: 6,
  },
  aiBadgeText: { color: "#FFFFFF", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  creditorName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  balance: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  offerCard: { padding: 16, gap: 4 },
  offerLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  offerAmount: { fontSize: 36, fontFamily: "Inter_700Bold" },
  offerPct: { fontSize: 14, fontFamily: "Inter_500Medium" },
  offerReason: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 12 },
  steps: { gap: 16 },
  step: { flexDirection: "row", gap: 12 },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepNumText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  stepContent: { flex: 1, gap: 4 },
  stepTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  stepDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  tipRow: { flexDirection: "row", gap: 10, marginBottom: 10, alignItems: "flex-start" },
  tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
  },
});
