import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";

const DISCLAIMERS = [
  {
    icon: "alert-triangle",
    title: "Not a Law Firm",
    text: "SLICE is not a law firm and does not provide legal advice. Nothing in this app constitutes legal advice or creates an attorney-client relationship. For legal advice, consult a licensed attorney.",
  },
  {
    icon: "dollar-sign",
    title: "No Tax Advice",
    text: "SLICE does not provide tax advice. Forgiven debt may be taxable income (Form 1099-C). Consult a licensed tax professional or CPA for guidance on the tax implications of debt settlement.",
  },
  {
    icon: "credit-card",
    title: "No Guaranteed Credit Repair",
    text: "SLICE does not provide credit repair services and does not guarantee any improvement in your credit score. Debt settlement may negatively impact your credit score.",
  },
  {
    icon: "x-circle",
    title: "No Settlement Guarantees",
    text: "SLICE does not guarantee that any creditor will accept a settlement offer. Creditors are not required to settle and may decline any offer. Results vary by creditor, account age, balance, and individual circumstances.",
  },
  {
    icon: "file-text",
    title: "Get Everything in Writing",
    text: "Before making any payment toward a settlement, you must receive a written settlement agreement from your creditor. SLICE is not responsible for any verbal agreements or payments made without written confirmation.",
  },
  {
    icon: "users",
    title: "Consult Professionals",
    text: "The tools and information in SLICE are for educational and planning purposes only. For decisions about your specific financial situation, consult qualified legal, tax, credit, or financial professionals.",
  },
  {
    icon: "info",
    title: "Estimates Are Not Guarantees",
    text: "All calculations, timelines, and estimates in SLICE are based on user-entered data and general assumptions. They are for planning purposes only and do not represent guaranteed outcomes.",
  },
  {
    icon: "lock",
    title: "Data Privacy",
    text: "SLICE stores account and program data with service providers needed to operate the app, including Supabase and enabled AI, subscription, email, and scheduling providers. Review the Privacy Policy for details about collection, use, and sharing.",
  },
];

export default function LegalScreen() {
  const colors = useColors();
  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 20;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.banner, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
          <Feather name="shield" size={24} color={colors.primary} />
          <View style={styles.bannerText}>
            <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
              Legal Disclaimer
            </Text>
            <Text style={[styles.bannerSubtitle, { color: colors.mutedForeground }]}>
              Please read all disclaimers before using SLICE.
            </Text>
          </View>
        </View>

        {DISCLAIMERS.map((item, i) => (
          <Card key={i} style={styles.disclaimerCard}>
            <View style={styles.disclaimerHeader}>
              <View style={[styles.disclaimerIcon, { backgroundColor: colors.secondary }]}>
                <Feather name={item.icon as any} size={18} color={colors.primary} />
              </View>
              <Text style={[styles.disclaimerTitle, { color: colors.foreground }]}>
                {item.title}
              </Text>
            </View>
            <Text style={[styles.disclaimerText, { color: colors.foreground }]}>
              {item.text}
            </Text>
          </Card>
        ))}

        <Card style={[styles.finalCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.finalTitle}>Summary</Text>
          <Text style={styles.finalText}>
            SLICE is an educational debt resolution tool. It is not a law firm, credit repair
            company, or financial advisor. All settlement figures, timelines, and strategies are
            estimates for planning only. Always consult qualified professionals and get all
            settlement agreements in writing before making any payment.
          </Text>
        </Card>

        <View style={styles.docsRow}>
          <Pressable
            onPress={() => router.push("/privacy-policy")}
            style={[styles.docLink, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Feather name="lock" size={16} color={colors.primary} />
            <Text style={[styles.docLinkText, { color: colors.foreground }]}>Privacy Policy</Text>
            <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/terms")}
            style={[styles.docLink, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Feather name="clipboard" size={16} color={colors.primary} />
            <Text style={[styles.docLinkText, { color: colors.foreground }]}>Terms and Conditions</Text>
            <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          SLICE App v1.0.0 · Last updated June 2026
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  bannerSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  disclaimerCard: { gap: 10 },
  disclaimerHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  disclaimerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  disclaimerTitle: { fontSize: 14, fontFamily: "Inter_700Bold", flex: 1 },
  disclaimerText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  finalCard: { padding: 20, gap: 8 },
  finalTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  finalText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    lineHeight: 22,
  },
  docsRow: { gap: 10 },
  docLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  docLinkText: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  version: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    paddingBottom: 8,
    marginTop: 4,
  },
});
