import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/useAppStore";
import {
  formatCurrency,
  formatMoneyInput,
  generateId,
  parseMoneyInput,
} from "@/utils/calculations";
import type { Creditor } from "@/types";

interface TempCreditor {
  id: string;
  name: string;
  phone: string;
  balance: string;
}

export default function OnboardingStep2() {
  const colors = useColors();
  const profile = useAppStore((s) => s.profile);
  const draftCreditors = useAppStore((s) => s.creditors);
  const setDraftCreditors = useAppStore((s) => s.setCreditors);

  const [creditors, setCreditors] = useState<TempCreditor[]>([
    ...(draftCreditors.length > 0
      ? draftCreditors.map((creditor) => ({
          id: creditor.id,
          name: creditor.name,
          phone: creditor.phone,
          balance: formatMoneyInput(creditor.balance),
        }))
      : [{ id: generateId(), name: "", phone: "", balance: "" }]),
  ]);

  const topPad = Platform.OS === "web" ? 67 : 0;

  const addRow = () => {
    setCreditors((prev) => [
      ...prev,
      { id: generateId(), name: "", phone: "", balance: "" },
    ]);
  };

  const removeRow = (id: string) => {
    if (creditors.length === 1) return;
    setCreditors((prev) => prev.filter((c) => c.id !== id));
  };

  const updateRow = (id: string, field: keyof TempCreditor, value: string) => {
    setCreditors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const validCreditors = creditors.filter(
    (c) => c.name.trim() && parseMoneyInput(c.balance) > 0
  );
  const canContinue = validCreditors.length > 0;

  // Pillar 1 (Instant Value Delivery): surface the "you could save $X" win the
  // moment a debt is entered — before any sign-up gate.
  const previewDebt = validCreditors.reduce(
    (sum, c) => sum + parseMoneyInput(c.balance),
    0
  );
  const previewSavings = previewDebt * (1 - profile.defaultSettlementPercentage);

  const handleNext = () => {
    setDraftCreditors(
      validCreditors.map((creditor, index) => ({
        id: creditor.id,
        name: creditor.name.trim(),
        phone: creditor.phone.trim(),
        balance: parseMoneyInput(creditor.balance),
        settlementPercentage: profile.defaultSettlementPercentage,
        monthlySavings: profile.defaultMonthlySavings,
        status: "active",
        notes: "",
        priority: index + 1,
        addedAt: new Date().toISOString(),
      }))
    );
    router.push("/onboarding/step3");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          {Platform.OS !== "ios" && (
            <Pressable onPress={() => router.back()} style={styles.back}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </Pressable>
          )}
          <View style={styles.progress}>
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                style={[
                  styles.dot,
                  {
                    backgroundColor: step <= 2 ? colors.primary : colors.muted,
                    width: step === 2 ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.foreground }]}>Add your creditors</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Step 2 of 3 — List who you owe and how much
          </Text>

          <View style={styles.creditorList}>
            {creditors.map((c, i) => (
              <View
                key={c.id}
                style={[styles.creditorCard, { borderColor: colors.border, backgroundColor: colors.card }]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    Creditor {i + 1}
                  </Text>
                  {creditors.length > 1 && (
                    <Pressable onPress={() => removeRow(c.id)}>
                      <Feather name="trash-2" size={18} color={colors.destructive} />
                    </Pressable>
                  )}
                </View>

                <TextInput
                  value={c.name}
                  onChangeText={(v) => updateRow(c.id, "name", v)}
                  placeholder="Creditor name (e.g., Bank of America)"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                />
                <TextInput
                  value={c.phone}
                  onChangeText={(v) => updateRow(c.id, "phone", v)}
                  placeholder="Phone number (optional)"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                  keyboardType="phone-pad"
                />
                <View style={[styles.dollarInput, { borderColor: colors.border }]}>
                  <Text style={[styles.dollar, { color: colors.mutedForeground }]}>$</Text>
                  <TextInput
                    value={c.balance}
                    onChangeText={(value) =>
                      updateRow(c.id, "balance", formatMoneyInput(value))
                    }
                    placeholder="Amount owed"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numeric"
                    style={[styles.dollarField, { color: colors.foreground }]}
                  />
                </View>
                {parseMoneyInput(c.balance) > 0 && (
                  <Text style={[styles.preview, { color: colors.mutedForeground }]}>
                    Settlement target: {formatCurrency(parseMoneyInput(c.balance) * profile.defaultSettlementPercentage)} (
                    {Math.round(profile.defaultSettlementPercentage * 100)}%)
                  </Text>
                )}
              </View>
            ))}
          </View>

          <Pressable onPress={addRow} style={[styles.addBtn, { borderColor: colors.primary }]}>
            <Feather name="plus" size={18} color={colors.primary} />
            <Text style={[styles.addText, { color: colors.primary }]}>Add Another Creditor</Text>
          </Pressable>

          <Text style={[styles.tip, { color: colors.mutedForeground }]}>
            You can add or edit creditors later in the app.
          </Text>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: Platform.OS === "web" ? 34 : 16 }]}>
          {previewSavings > 0 && (
            <View style={[styles.savingsBanner, { backgroundColor: colors.secondary }]}>
              <View style={styles.savingsIcon}>
                <Feather name="trending-down" size={18} color={colors.primary} />
              </View>
              <View style={styles.savingsText}>
                <Text style={[styles.savingsLabel, { color: colors.mutedForeground }]}>
                  You could save an estimated
                </Text>
                <Text style={[styles.savingsValue, { color: colors.primary }]}>
                  {formatCurrency(previewSavings)}
                </Text>
              </View>
            </View>
          )}
          <Button
            label={`Continue with ${validCreditors.length} creditor${validCreditors.length !== 1 ? "s" : ""}`}
            onPress={handleNext}
            disabled={!canContinue}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 16,
  },
  back: { padding: 4 },
  progress: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { height: 8, borderRadius: 4 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 24 },
  creditorList: { gap: 14 },
  creditorCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  dollarInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
  },
  dollar: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginRight: 4 },
  dollarField: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", height: 46 },
  preview: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginTop: 16,
  },
  addText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  tip: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 12 },
  footer: { padding: 20, paddingTop: 12, borderTopWidth: 1, gap: 12 },
  savingsBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 12,
  },
  savingsIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  savingsText: { flex: 1 },
  savingsLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  savingsValue: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 1 },
});
