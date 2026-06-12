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
import { SegmentedPercent } from "@/components/SegmentedPercent";
import { useColors } from "@/hooks/useColors";
import { celebrate } from "@/lib/celebrate";
import { useAppStore } from "@/store/useAppStore";
import {
  calcDebtFreeDate,
  calcProgramLength,
  formatCurrency,
  formatMoneyInput,
  formatProgramLength,
  parseMoneyInput,
} from "@/utils/calculations";

const SETTLEMENT_OPTIONS = [0.3, 0.4, 0.5, 0.6, 0.7];

export default function OnboardingStep1() {
  const colors = useColors();
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [name, setName] = useState(profile.name);
  const [totalDebt, setTotalDebt] = useState(
    formatMoneyInput(profile.estimatedTotalDebt)
  );
  const [monthlySavings, setMonthlySavings] = useState(
    formatMoneyInput(profile.defaultMonthlySavings)
  );
  const [settlementPct, setSettlementPct] = useState(
    profile.defaultSettlementPercentage
  );
  const topPad = Platform.OS === "web" ? 67 : 0;

  const debtAmount = parseMoneyInput(totalDebt);
  // Gross "needed to settle": the full settlement target on the total debt.
  const settlementTarget = debtAmount * settlementPct;
  const monthlySavingsAmount = parseMoneyInput(monthlySavings);
  // Program length (automated): months to fund the target at their savings rate.
  const programMonths = calcProgramLength(settlementTarget, monthlySavingsAmount);
  // Friendly finish date with the full month + year, e.g. "November 2029", so a
  // first-timer reads a real calendar moment rather than a raw month count.
  const targetDateLabel =
    monthlySavingsAmount > 0 && programMonths > 0
      ? calcDebtFreeDate(programMonths)
      : "";
  // Total debt savings (automated): what they keep vs. paying the full balance.
  const totalSaved = Math.max(0, debtAmount - settlementTarget);

  const canContinue =
    name.trim().length > 0 && debtAmount > 0 && monthlySavingsAmount > 0;

  const handleNext = () => {
    updateProfile({
      name: name.trim(),
      estimatedTotalDebt: debtAmount,
      defaultMonthlySavings: parseMoneyInput(monthlySavings),
      defaultSettlementPercentage: settlementPct,
    });
    // M2: settlement fund set up — a light, encouraging nudge (first time only).
    celebrate("m2_fund_setup", { once: true });
    router.push("/onboarding/step2");
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
                    backgroundColor:
                      step === 1 ? colors.primary : colors.muted,
                    width: step === 1 ? 28 : 10,
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
            Tell us about yourself
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Step 1 of 3 — Build your custom debt program
          </Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Your Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Alex Johnson"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Total Debt Amount
              </Text>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                Roughly how much do you owe across all your debts? You'll add
                each creditor next.
              </Text>
              <View style={[styles.dollarInput, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.dollar, { color: colors.mutedForeground }]}>$</Text>
                <TextInput
                  value={totalDebt}
                  onChangeText={(value) => setTotalDebt(formatMoneyInput(value))}
                  keyboardType="numeric"
                  placeholder="10,000"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.dollarTextInput, { color: colors.foreground }]}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Desired Settlement Target
              </Text>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                What percentage of each debt do you aim to settle for?
              </Text>
              <SegmentedPercent
                options={SETTLEMENT_OPTIONS}
                value={settlementPct}
                onChange={setSettlementPct}
              />
              {debtAmount > 0 && (
                <View style={[styles.estimate, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Text style={[styles.estimateLabel, { color: colors.mutedForeground }]}>
                    Amount needed to settle
                  </Text>
                  <Text style={[styles.estimateValue, { color: colors.primary }]}>
                    {formatCurrency(settlementTarget)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Monthly Saving Commitment
              </Text>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                How much can you save per month toward debt settlement?
              </Text>
              <View style={[styles.dollarInput, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.dollar, { color: colors.mutedForeground }]}>$</Text>
                <TextInput
                  value={monthlySavings}
                  onChangeText={(value) =>
                    setMonthlySavings(formatMoneyInput(value))
                  }
                  keyboardType="numeric"
                  placeholder="500"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.dollarTextInput, { color: colors.foreground }]}
                />
                <Text style={[styles.perMonth, { color: colors.mutedForeground }]}>/mo</Text>
              </View>
            </View>

            {debtAmount > 0 && (
              <View style={[styles.estimate, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                {monthlySavingsAmount > 0 && programMonths > 0 && (
                  <>
                    <Text style={[styles.timelineHeading, { color: colors.mutedForeground }]}>
                      Your program length
                    </Text>
                    <Text style={[styles.timelineBig, { color: colors.primary }]}>
                      {formatProgramLength(programMonths)}
                    </Text>
                    <Text style={[styles.timelineFinish, { color: colors.foreground }]}>
                      You'll be debt-free by{" "}
                      <Text style={[styles.timelineFinishStrong, { color: colors.primary }]}>
                        {targetDateLabel}
                      </Text>
                    </Text>
                    <Text style={[styles.timelineNote, { color: colors.mutedForeground }]}>
                      Saving {formatCurrency(monthlySavingsAmount)}/month
                    </Text>
                    <View style={[styles.estimateDivider, { backgroundColor: colors.border }]} />
                  </>
                )}

                <Text style={[styles.estimateLabel, { color: colors.mutedForeground }]}>
                  Total debt savings
                </Text>
                <Text style={[styles.heroValue, { color: colors.success }]}>
                  {formatCurrency(totalSaved)}
                </Text>
                <Text style={[styles.estimateSub, { color: colors.mutedForeground }]}>
                  SAVED vs. paying the full {formatCurrency(debtAmount)}.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: Platform.OS === "web" ? 34 : 16 }]}>
          <Button
            label="Continue — Add Creditors"
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
  dot: { height: 10, borderRadius: 5 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 28 },
  form: { gap: 20 },
  field: { gap: 6 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
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
  estimate: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    gap: 2,
  },
  estimateLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  estimateValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  heroValue: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  estimateSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  estimateDivider: { height: 1, marginVertical: 8 },
  timelineHeading: { fontSize: 12, fontFamily: "Inter_500Medium" },
  timelineBig: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  timelineFinish: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 2 },
  timelineFinishStrong: { fontSize: 14, fontFamily: "Inter_700Bold" },
  timelineNote: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 3 },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
