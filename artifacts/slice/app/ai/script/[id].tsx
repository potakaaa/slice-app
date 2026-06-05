import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
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
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/useAppStore";
import { formatCurrency, formatPct, getAISuggestedOffer } from "@/utils/calculations";
import type { ScriptTone } from "@/types";

const TONES: { value: ScriptTone; label: string; desc: string }[] = [
  { value: "calm", label: "Calm", desc: "Measured and professional" },
  { value: "firm", label: "Firm", desc: "Direct and confident" },
  { value: "hardship", label: "Hardship", desc: "Emphasizes financial difficulty" },
  { value: "direct", label: "Short & Direct", desc: "Quick, no frills" },
];

function buildScript(
  creditorName: string,
  balance: number,
  offerPct: number,
  offerAmt: number,
  tone: ScriptTone
): Record<string, string> {
  const name = creditorName;
  const pct = formatPct(offerPct);
  const amt = formatCurrency(offerAmt);

  const hardshipLine =
    tone === "hardship"
      ? `I've been experiencing significant financial hardship recently and I'm unable to pay the full balance. `
      : tone === "calm"
        ? `Due to a change in my financial situation, I'm exploring settlement options. `
        : "";

  return {
    "First Call": `Hello, I'm calling about account number [your account number]. ${hardshipLine}I'd like to discuss settling this account. Is there someone in your hardship or settlement department I can speak with?\n\nIf connected: I'm prepared to offer a lump-sum settlement of ${amt} (${pct} of the balance) to resolve this account in full. This is what I can realistically do right now.`,
    "Settlement Offer Call": `I've reviewed my finances and I can offer ${amt} as a full and final settlement on the ${name} account. This is my best offer. I'm prepared to send payment immediately once I receive a written settlement agreement.\n\nIf they counter: I understand. Let me think about that and get back to you. Can I call you back at this number?`,
    "Follow-Up Call": `Hello, I'm following up on the settlement offer I made on [date]. I offered ${amt} to settle my account in full. Has there been any progress on that request?\n\nIf they need more: I appreciate you checking. My maximum is ${formatCurrency(balance * Math.min(offerPct + 0.1, 0.7))} — that is the most I can do.`,
    "Final Confirmation": `I'm calling to confirm the settlement agreement I should have received by mail or email. Before I send payment, I need to confirm: the account is being settled for ${amt}, you'll provide a written confirmation, and the account will be updated once payment is received.\n\nDo I have that right?`,
    "What NOT to Say": `Never say:\n• "I can pay more if I need to"\n• "I have money in savings"\n• "My family could help me"\n• "I really need to get this settled quickly"\n\nThese signal that you have flexibility they can exploit.`,
    "Questions to Ask": `Before paying anything, ask:\n1. Can I get this agreement in writing before I send any payment?\n2. Will this be reported as "Paid in Full" or "Settled" to credit bureaus?\n3. What is the final balance and is there any interest still accruing?\n4. Will I receive a payoff confirmation letter after payment?\n5. Is there any additional balance or fees that could appear later?`,
  };
}

export default function AIScriptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const creditors = useAppStore((s) => s.creditors);
  const profile = useAppStore((s) => s.profile);

  const creditor = creditors.find((c) => c.id === id) ?? creditors[0];
  const [tone, setTone] = useState<ScriptTone>("calm");
  const [activeTab, setActiveTab] = useState(0);

  const isSilver = profile.tier !== "free";
  const topPad = Platform.OS === "web" ? 67 : 0;

  if (!creditor) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Text style={{ padding: 20 }}>Add creditors first to generate scripts.</Text>
      </SafeAreaView>
    );
  }

  const aiOffer = getAISuggestedOffer(creditor.balance);
  const aiOfferAmt = creditor.balance * aiOffer;
  const scripts = buildScript(creditor.name, creditor.balance, aiOffer, aiOfferAmt, tone);
  const scriptKeys = Object.keys(scripts);
  const bottomPad = Platform.OS === "web" ? 34 : 20;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerCard, { backgroundColor: colors.primary }]}>
          <View style={styles.aiBadge}>
            <Feather name="file-text" size={14} color="#FFF" />
            <Text style={styles.aiBadgeText}>AI Script</Text>
          </View>
          <Text style={styles.creditorName}>{creditor.name}</Text>
          <Text style={styles.balance}>
            {formatCurrency(creditor.balance)} · Suggested offer: {formatCurrency(aiOfferAmt)}
          </Text>
        </View>

        {!isSilver ? (
          <UpgradePrompt
            requiredTier="silver"
            feature="AI Negotiation Scripts"
            description="Get customized call scripts for every stage of your negotiation — first call, settlement offer, follow-up, and final confirmation. Available on the Silver plan."
          />
        ) : (
          <>
            {/* Tone selector */}
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Choose Your Tone
              </Text>
              <View style={styles.toneGrid}>
                {TONES.map((t) => (
                  <Pressable
                    key={t.value}
                    onPress={() => setTone(t.value)}
                    style={[
                      styles.toneBtn,
                      {
                        backgroundColor:
                          tone === t.value ? colors.primary : colors.muted,
                        borderColor:
                          tone === t.value ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.toneName,
                        { color: tone === t.value ? "#FFFFFF" : colors.foreground },
                      ]}
                    >
                      {t.label}
                    </Text>
                    <Text
                      style={[
                        styles.toneDesc,
                        { color: tone === t.value ? "rgba(255,255,255,0.8)" : colors.mutedForeground },
                      ]}
                    >
                      {t.desc}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Card>

            {/* Script tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabs}
            >
              {scriptKeys.map((key, i) => (
                <Pressable
                  key={key}
                  onPress={() => setActiveTab(i)}
                  style={[
                    styles.tab,
                    {
                      backgroundColor:
                        activeTab === i ? colors.primary : colors.muted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: activeTab === i ? "#FFFFFF" : colors.foreground },
                    ]}
                  >
                    {key}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Script content */}
            <Card style={styles.scriptCard}>
              <Text style={[styles.scriptTitle, { color: colors.primary }]}>
                {scriptKeys[activeTab]}
              </Text>
              <Text style={[styles.scriptText, { color: colors.foreground }]}>
                {scripts[scriptKeys[activeTab]]}
              </Text>
              <View style={[styles.phoneHint, { backgroundColor: colors.secondary }]}>
                <Feather name="phone" size={14} color={colors.primary} />
                <Text style={[styles.phoneHintText, { color: colors.mutedForeground }]}>
                  Read this script while on the phone. Fill in [brackets] with your actual info.
                </Text>
              </View>
            </Card>
          </>
        )}

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Scripts are templates for educational use only. SLICE does not guarantee results.
          Consult a financial professional for legal advice.
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
  balance: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 12 },
  toneGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  toneBtn: {
    width: "47%",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 3,
  },
  toneName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  toneDesc: { fontSize: 11, fontFamily: "Inter_400Regular" },
  tabs: { gap: 8, paddingHorizontal: 0, paddingBottom: 2 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  scriptCard: { gap: 12 },
  scriptTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  scriptText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  phoneHint: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    alignItems: "flex-start",
  },
  phoneHintText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
  },
});
