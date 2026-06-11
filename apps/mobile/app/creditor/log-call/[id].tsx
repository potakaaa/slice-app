import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";
import { celebrate } from "@/lib/celebrate";
import { hapticSelection } from "@/lib/haptics";
import { useCreateContactLog, useCreditors, useUpdateCreditor } from "@/lib/sliceData";
import { useAppStore } from "@/store/useAppStore";
import {
  formatMoneyInput,
  getFollowUpDateISO,
  OUTCOME_LABELS,
  outcomeMarksSettled,
  parseMoneyInput,
  type FollowUpOption,
} from "@/utils/calculations";
import type { ContactOutcome } from "@/types";

const OUTCOMES = Object.keys(OUTCOME_LABELS) as ContactOutcome[];
const FOLLOW_UPS: { value: FollowUpOption; label: string }[] = [
  { value: "none", label: "None" },
  { value: "1w", label: "1 week" },
  { value: "2w", label: "2 weeks" },
  { value: "1m", label: "1 month" },
];

export default function LogCallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { creditors } = useCreditors();
  const createLog = useCreateContactLog();
  const updateCreditor = useUpdateCreditor();
  const recordHappyMoment = useAppStore((s) => s.recordHappyMoment);

  const creditor = creditors.find((c) => c.id === id);
  const [outcome, setOutcome] = useState<ContactOutcome>("left_message");
  const [amount, setAmount] = useState("");
  const [followUp, setFollowUp] = useState<FollowUpOption>("none");
  const [notes, setNotes] = useState("");

  const topPad = Platform.OS === "web" ? 67 : 0;

  if (!creditor) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.foreground }]}>Creditor not found</Text>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    await createLog.mutateAsync({
      creditorId: creditor.id,
      outcome,
      amountOffered: parseMoneyInput(amount) > 0 ? parseMoneyInput(amount) : null,
      followUpDate: getFollowUpDateISO(followUp),
      notes: notes.trim(),
    });

    if (outcomeMarksSettled(outcome) && creditor.status !== "settled") {
      updateCreditor.mutate({ id: creditor.id, updates: { status: "settled" } });
      // Clearing the last creditor is debt-free — the ultimate peak (hero).
      const becameDebtFree = creditors
        .filter((c) => c.id !== creditor.id)
        .every((c) => c.status === "settled");
      recordHappyMoment(becameDebtFree ? 3 : 1);
      if (becameDebtFree) {
        celebrate("m19_debt_free", { once: true });
      } else {
        celebrate("m17_settled");
      }
      router.back();
      return;
    }
    // M13: the user picked up the phone and logged a real call — the bravest,
    // most valuable real-world action. Full celebration, once. (If they also set
    // a follow-up, M13's higher tier wins the single on-screen slot.)
    celebrate("m13_logged_call", { once: true });
    // M15: scheduling a follow-up keeps momentum — a light nudge the first time.
    if (followUp !== "none") {
      celebrate("m15_follow_up", { once: true });
    }
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.foreground }]}>Log a call</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {creditor.name} — record what happened so you know your next move.
          </Text>

          {/* Outcome */}
          <Card>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>OUTCOME</Text>
            <View style={styles.chips}>
              {OUTCOMES.map((o) => (
                <Pressable
                  key={o}
                  onPress={() => {
                    hapticSelection();
                    setOutcome(o);
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: outcome === o ? colors.primary : colors.muted,
                      borderColor: outcome === o ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: outcome === o ? "#FFFFFF" : colors.foreground },
                    ]}
                  >
                    {OUTCOME_LABELS[o]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Amount */}
          <Card>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              AMOUNT OFFERED (OPTIONAL)
            </Text>
            <View style={[styles.dollarInput, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.dollar, { color: colors.mutedForeground }]}>$</Text>
              <TextInput
                value={amount}
                onChangeText={(v) => setAmount(formatMoneyInput(v))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.dollarTextInput, { color: colors.foreground }]}
              />
            </View>
          </Card>

          {/* Follow-up */}
          <Card>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>FOLLOW UP IN</Text>
            <View style={styles.chips}>
              {FOLLOW_UPS.map((f) => (
                <Pressable
                  key={f.value}
                  onPress={() => {
                    hapticSelection();
                    setFollowUp(f.value);
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: followUp === f.value ? colors.primary : colors.muted,
                      borderColor: followUp === f.value ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: followUp === f.value ? "#FFFFFF" : colors.foreground },
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Notes */}
          <Card>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>NOTES</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="What was said, who you spoke to, next steps…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[styles.notesInput, { color: colors.foreground, borderColor: colors.border }]}
            />
          </Card>

          <Button
            label="Save call log"
            onPress={handleSave}
            loading={createLog.isPending}
            fullWidth
          />
          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            Estimates are for planning only and do not guarantee creditor acceptance.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { gap: 12, padding: 16 },
  notFound: { padding: 20, fontSize: 16, fontFamily: "Inter_400Regular" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 4 },
  label: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  dollarInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
  },
  dollar: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginRight: 4 },
  dollarTextInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", height: 50 },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
  },
});
