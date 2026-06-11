import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
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
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";
import { celebrate } from "@/lib/celebrate";
import { useAppStore } from "@/store/useAppStore";
import {
  formatCurrency,
  formatMoneyInput,
  generateId,
  parseMoneyInput,
} from "@/utils/calculations";

const COMMON_EXPENSES = [
  "Rent / Mortgage",
  "Groceries",
  "Utilities",
  "Transportation",
  "Insurance",
  "Subscriptions",
];

type ExpenseRow = { id: string; label: string; amount: string };

export default function OnboardingStep3() {
  const colors = useColors();
  const { session } = useAuth();
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const markOnboardingReady = useAppStore((s) => s.markOnboardingReady);

  const [income, setIncome] = useState(formatMoneyInput(profile.monthlyIncome));
  const [expenses, setExpenses] = useState<ExpenseRow[]>(
    profile.monthlyExpenses.length > 0
      ? profile.monthlyExpenses.map((e) => ({
          id: e.id,
          label: e.label,
          amount: formatMoneyInput(e.amount),
        }))
      : [{ id: generateId(), label: "", amount: "" }]
  );
  const topPad = Platform.OS === "web" ? 67 : 0;

  const incomeAmount = parseMoneyInput(income);
  const totalExpenses = expenses.reduce(
    (sum, e) => sum + parseMoneyInput(e.amount),
    0
  );
  const remaining = incomeAmount - totalExpenses;
  const isSurplus = remaining >= 0;
  const hasBudget = incomeAmount > 0 && totalExpenses > 0;

  const canContinue = incomeAmount > 0;

  const updateExpense = (id: string, field: "label" | "amount", value: string) =>
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              [field]: field === "amount" ? formatMoneyInput(value) : value,
            }
          : e
      )
    );

  const addExpense = (label = "") =>
    setExpenses((prev) => [...prev, { id: generateId(), label, amount: "" }]);

  const removeExpense = (id: string) =>
    setExpenses((prev) =>
      prev.length > 1 ? prev.filter((e) => e.id !== id) : prev
    );

  const handleFinish = () => {
    const cleaned = expenses
      .filter((e) => e.label.trim() && parseMoneyInput(e.amount) > 0)
      .map((e) => ({
        id: e.id,
        label: e.label.trim(),
        amount: parseMoneyInput(e.amount),
      }));

    updateProfile({
      monthlyIncome: incomeAmount,
      monthlyExpenses: cleaned,
    });
    markOnboardingReady();
    // Budget complete — a full, confetti-grade "you did it again" moment
    // (first time only). If this leads straight into "Program Ready", that
    // milestone outranks and replaces it.
    celebrate("m4c_budget", { once: true });
    router.replace(session ? "/onboarding/complete" : "/auth");
  };

  // Categories the user hasn't already started a row for — keeps quick-add tidy.
  const usedLabels = new Set(
    expenses.map((e) => e.label.trim().toLowerCase())
  );
  const suggestions = COMMON_EXPENSES.filter(
    (label) => !usedLabels.has(label.toLowerCase())
  );

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
                    backgroundColor: colors.primary,
                    width: step === 3 ? 24 : 8,
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
          <Text style={[styles.title, { color: colors.foreground }]}>
            Your monthly budget
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Step 3 of 3 — See what's left each month to put toward your debt
          </Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Total Monthly Income
            </Text>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Your take-home pay each month, after taxes.
            </Text>
            <View style={[styles.dollarInput, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.dollar, { color: colors.mutedForeground }]}>$</Text>
              <TextInput
                value={income}
                onChangeText={(value) => setIncome(formatMoneyInput(value))}
                keyboardType="numeric"
                placeholder="3,500"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.dollarTextInput, { color: colors.foreground }]}
              />
              <Text style={[styles.perMonth, { color: colors.mutedForeground }]}>/mo</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Monthly Expenses
            </Text>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Add your recurring costs. The more honest, the more accurate your plan.
            </Text>

            <View style={styles.expenseList}>
              {expenses.map((e) => (
                <View key={e.id} style={styles.expenseRow}>
                  <TextInput
                    value={e.label}
                    onChangeText={(v) => updateExpense(e.id, "label", v)}
                    placeholder="Expense name"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.expenseLabel, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                  />
                  <View style={[styles.expenseAmount, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <Text style={[styles.dollar, { color: colors.mutedForeground }]}>$</Text>
                    <TextInput
                      value={e.amount}
                      onChangeText={(v) => updateExpense(e.id, "amount", v)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.mutedForeground}
                      style={[styles.expenseAmountField, { color: colors.foreground }]}
                    />
                  </View>
                  <Pressable
                    onPress={() => removeExpense(e.id)}
                    disabled={expenses.length === 1}
                    style={styles.removeBtn}
                    hitSlop={8}
                  >
                    <Feather
                      name="trash-2"
                      size={18}
                      color={expenses.length === 1 ? colors.muted : colors.destructive}
                    />
                  </Pressable>
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => addExpense()}
              style={[styles.addBtn, { borderColor: colors.border }]}
            >
              <Feather name="plus" size={16} color={colors.primary} />
              <Text style={[styles.addBtnText, { color: colors.primary }]}>
                Add expense
              </Text>
            </Pressable>

            {suggestions.length > 0 && (
              <View style={styles.chipRow}>
                {suggestions.map((label) => (
                  <Pressable
                    key={label}
                    onPress={() => addExpense(label)}
                    style={[styles.chip, { backgroundColor: colors.muted, borderColor: colors.border }]}
                  >
                    <Feather name="plus" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.chipText, { color: colors.foreground }]}>
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {hasBudget && (
            <View
              style={[
                styles.summary,
                {
                  backgroundColor: isSurplus ? colors.secondary : colors.muted,
                  borderColor: isSurplus ? colors.success : colors.warning,
                },
              ]}
            >
              <View style={styles.summaryLine}>
                <Text style={[styles.summaryKey, { color: colors.mutedForeground }]}>
                  Income
                </Text>
                <Text style={[styles.summaryVal, { color: colors.foreground }]}>
                  {formatCurrency(incomeAmount)}
                </Text>
              </View>
              <View style={styles.summaryLine}>
                <Text style={[styles.summaryKey, { color: colors.mutedForeground }]}>
                  Expenses
                </Text>
                <Text style={[styles.summaryVal, { color: colors.foreground }]}>
                  −{formatCurrency(totalExpenses)}
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryLine}>
                <Text style={[styles.summaryResultLabel, { color: colors.foreground }]}>
                  {isSurplus ? "Left over each month" : "Short each month"}
                </Text>
                <Text
                  style={[
                    styles.summaryResultVal,
                    { color: isSurplus ? colors.success : colors.warning },
                  ]}
                >
                  {isSurplus ? "" : "−"}
                  {formatCurrency(Math.abs(remaining))}
                </Text>
              </View>
              <Text style={[styles.summaryNote, { color: colors.mutedForeground }]}>
                {isSurplus
                  ? "That's what you can realistically put toward settling your debt."
                  : "Your expenses outpace your income. We'll help you find room as you go — every bit counts."}
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: Platform.OS === "web" ? 34 : 16 }]}>
          <Button
            label="Finish — Build My Program"
            onPress={handleFinish}
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
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, gap: 24 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4 },
  field: { gap: 8 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  dollarInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
  },
  dollar: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginRight: 4 },
  dollarTextInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    height: 50,
  },
  perMonth: { fontSize: 13, fontFamily: "Inter_400Regular" },
  expenseList: { gap: 10 },
  expenseRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  expenseLabel: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  expenseAmount: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    width: 110,
  },
  expenseAmountField: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    height: 46,
  },
  removeBtn: { padding: 4 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 10,
    height: 44,
    marginTop: 2,
  },
  addBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  summary: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  summaryLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryKey: { fontSize: 13, fontFamily: "Inter_400Regular" },
  summaryVal: { fontSize: 14, fontFamily: "Inter_500Medium" },
  summaryDivider: { height: 1, marginVertical: 2 },
  summaryResultLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  summaryResultVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
  summaryNote: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  footer: { padding: 20, paddingTop: 12, borderTopWidth: 1 },
});
