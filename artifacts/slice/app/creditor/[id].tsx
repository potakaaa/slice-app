import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Badge, StatusBadge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/useAppStore";
import {
  calcProgramLength,
  calcSettledAmount,
  calcTargetDate,
  formatCurrency,
  formatPct,
  getAISuggestedOffer,
} from "@/utils/calculations";
import type { CreditorStatus } from "@/types";

const SETTLEMENT_OPTIONS = [0.3, 0.4, 0.5, 0.6, 0.7];
const STATUS_OPTIONS: { value: CreditorStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "negotiating", label: "Negotiating" },
  { value: "settled", label: "Settled" },
];

export default function CreditorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { creditors, updateCreditor, deleteCreditor } = useAppStore((s) => ({
    creditors: s.creditors,
    updateCreditor: s.updateCreditor,
    deleteCreditor: s.deleteCreditor,
  }));

  const creditor = creditors.find((c) => c.id === id);
  const [notes, setNotes] = useState(creditor?.notes ?? "");
  const topPad = Platform.OS === "web" ? 67 : 0;

  if (!creditor) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.foreground }]}>
          Creditor not found
        </Text>
      </SafeAreaView>
    );
  }

  const settled = calcSettledAmount(creditor.balance, creditor.settlementPercentage);
  const months = calcProgramLength(settled, creditor.monthlySavings);
  const targetDate = calcTargetDate(months);
  const aiOffer = getAISuggestedOffer(creditor.balance);
  const aiOfferAmt = creditor.balance * aiOffer;

  const handleDelete = () => {
    Alert.alert(
      "Delete Creditor",
      `Remove ${creditor.name} from your program?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteCreditor(creditor.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleNotesChange = (text: string) => {
    setNotes(text);
    updateCreditor(creditor.id, { notes: text });
  };

  const bottomPad = Platform.OS === "web" ? 34 : 16;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroName}>{creditor.name}</Text>
              {creditor.phone ? (
                <Text style={styles.heroPhone}>{creditor.phone}</Text>
              ) : null}
            </View>
            <StatusBadge status={creditor.status} />
          </View>
          <Text style={styles.heroAmount}>{formatCurrency(creditor.balance)}</Text>
          <Text style={styles.heroLabel}>Total Balance Owed</Text>
        </View>

        {/* Status selector */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            STATUS
          </Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((s) => (
              <Pressable
                key={s.value}
                onPress={() => updateCreditor(creditor.id, { status: s.value })}
                style={[
                  styles.statusBtn,
                  {
                    backgroundColor:
                      creditor.status === s.value ? colors.primary : colors.muted,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        creditor.status === s.value ? "#FFFFFF" : colors.foreground,
                    },
                  ]}
                >
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Program card */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            YOUR PROGRAM
          </Text>
          <View style={styles.programGrid}>
            <View style={styles.programItem}>
              <Text style={[styles.programLabel, { color: colors.mutedForeground }]}>Balance</Text>
              <Text style={[styles.programValue, { color: colors.foreground }]}>
                {formatCurrency(creditor.balance)}
              </Text>
            </View>
            <View style={styles.programItem}>
              <Text style={[styles.programLabel, { color: colors.mutedForeground }]}>Target ({formatPct(creditor.settlementPercentage)})</Text>
              <Text style={[styles.programValue, { color: colors.primary }]}>
                {formatCurrency(settled)}
              </Text>
            </View>
            <View style={styles.programItem}>
              <Text style={[styles.programLabel, { color: colors.mutedForeground }]}>Monthly Savings</Text>
              <Text style={[styles.programValue, { color: colors.foreground }]}>
                {formatCurrency(creditor.monthlySavings)}
              </Text>
            </View>
            <View style={styles.programItem}>
              <Text style={[styles.programLabel, { color: colors.mutedForeground }]}>Program Length</Text>
              <Text style={[styles.programValue, { color: colors.foreground }]}>
                {months} months
              </Text>
            </View>
          </View>
          <View style={styles.targetDate}>
            <Feather name="calendar" size={14} color={colors.mutedForeground} />
            <Text style={[styles.targetDateText, { color: colors.mutedForeground }]}>
              Estimated target: {targetDate}
            </Text>
          </View>

          {/* Settlement % */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 12 }]}>
            SETTLEMENT TARGET
          </Text>
          <View style={styles.pctRow}>
            {SETTLEMENT_OPTIONS.map((pct) => (
              <Pressable
                key={pct}
                onPress={() => updateCreditor(creditor.id, { settlementPercentage: pct })}
                style={[
                  styles.pctBtn,
                  {
                    backgroundColor:
                      creditor.settlementPercentage === pct ? colors.primary : colors.muted,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pctText,
                    {
                      color:
                        creditor.settlementPercentage === pct ? "#FFFFFF" : colors.foreground,
                    },
                  ]}
                >
                  {formatPct(pct)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* AI hint */}
        <Card style={[styles.aiCard, { backgroundColor: "#F5F3FF", borderColor: "#8B5CF6" }]}>
          <View style={styles.aiHeader}>
            <Feather name="cpu" size={18} color="#8B5CF6" />
            <Text style={[styles.aiTitle, { color: "#7C3AED" }]}>AI Suggested First Offer</Text>
          </View>
          <Text style={[styles.aiOffer, { color: "#7C3AED" }]}>
            {formatCurrency(aiOfferAmt)} ({formatPct(aiOffer)})
          </Text>
          <Text style={[styles.aiDesc, { color: "#6D28D9" }]}>
            Based on your balance of {formatCurrency(creditor.balance)}, starting with a{" "}
            {formatPct(aiOffer)} offer gives you negotiating room to settle around{" "}
            {formatPct(creditor.settlementPercentage)}.
          </Text>
          <Button
            label="Get Full AI Strategy"
            onPress={() => router.push(`/ai/strategy/${creditor.id}`)}
            style={styles.aiBtn}
          />
        </Card>

        {/* Notes */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            NOTES
          </Text>
          <TextInput
            value={notes}
            onChangeText={handleNotesChange}
            placeholder="Add call notes, next steps, or reminders..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[styles.notesInput, { color: colors.foreground, borderColor: colors.border }]}
          />
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label="AI Negotiation Strategy"
            onPress={() => router.push(`/ai/strategy/${creditor.id}`)}
            fullWidth
          />
          <Button
            label="AI Negotiation Script"
            variant="secondary"
            onPress={() => router.push(`/ai/script/${creditor.id}`)}
            fullWidth
          />
          <Button
            label="Delete Creditor"
            variant="destructive"
            onPress={handleDelete}
            fullWidth
          />
        </View>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          SLICE does not guarantee that any creditor will accept a settlement offer.
          Always get agreements in writing before making any payment.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { gap: 12, padding: 16 },
  notFound: { padding: 20, fontSize: 16, fontFamily: "Inter_400Regular" },
  hero: {
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  heroName: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  heroPhone: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  heroAmount: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  heroLabel: { fontSize: 12, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular" },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  statusRow: { flexDirection: "row", gap: 8 },
  statusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  statusText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  programGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  programItem: { width: "47%", gap: 3 },
  programLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  programValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  targetDate: { flexDirection: "row", gap: 6, alignItems: "center" },
  targetDateText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  pctRow: { flexDirection: "row", gap: 8 },
  pctBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
  },
  pctText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  aiCard: { borderWidth: 1.5, gap: 8 },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  aiOffer: { fontSize: 26, fontFamily: "Inter_700Bold" },
  aiDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  aiBtn: { backgroundColor: "#8B5CF6", marginTop: 4 },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
  },
  actions: { gap: 10 },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
  },
});
