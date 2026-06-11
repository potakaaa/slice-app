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
  calcProgramLength,
  calcTargetDate,
  formatCurrency,
  formatMoneyInput,
  parseMoneyInput,
} from "@/utils/calculations";

const SETTLEMENT_OPTIONS = [0.3, 0.4, 0.5, 0.6, 0.7];

/** Horizon used to suggest an "approximate" monthly savings rate before the
 *  user commits to their own number. ~2 years is a typical settlement program. */
const SUGGESTED_HORIZON_MONTHS = 24;

/** Months → "1 yr 2 mo" / "8 mo" so a count reads as a plan, not a raw number. */
function formatMonths(months: number): string {
  if (months < 1) return "under a month";
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0 ? `${years} yr` : `${years} yr ${rem} mo`;
}

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
  const [savedSoFar, setSavedSoFar] = useState(
    formatMoneyInput(profile.currentSavedCash)
  );
  const [settlementPct, setSettlementPct] = useState(
    profile.defaultSettlementPercentage
  );
  const topPad = Platform.OS === "web" ? 67 : 0;

  const debtAmount = parseMoneyInput(totalDebt);
  const settlementTarget = debtAmount * settlementPct;
  const savedAmount = parseMoneyInput(savedSoFar);
  const monthlySavingsAmount = parseMoneyInput(monthlySavings);
  // Still to save after crediting what they've already put aside.
  const remainingNeeded = Math.max(0, settlementTarget - savedAmount);
  // Approximate monthly savings (automated): what it takes to finish in ~2 yrs.
  const suggestedMonthlySavings =
    remainingNeeded > 0
      ? Math.ceil(remainingNeeded / SUGGESTED_HORIZON_MONTHS)
      : 0;
  // Approximate program length (automated): months at their chosen savings rate.
  const programMonths = calcProgramLength(remainingNeeded, monthlySavingsAmount);

  const canContinue =
    name.trim().length > 0 && debtAmount > 0 && monthlySavingsAmount > 0;

  const handleNext = () => {
    updateProfile({
      name: name.trim(),
      estimatedTotalDebt: debtAmount,
      defaultMonthlySavings: parseMoneyInput(monthlySavings),
      currentSavedCash: parseMoneyInput(savedSoFar),
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
            Step 1 of 3 — Your debt and savings ability
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
                Monthly Savings Amount
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

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                How much have you saved so far?
              </Text>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                This is your starting settlement fund. $0 is fine — you can add to it anytime.
              </Text>
              <View style={[styles.dollarInput, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.dollar, { color: colors.mutedForeground }]}>$</Text>
                <TextInput
                  value={savedSoFar}
                  onChangeText={(value) => setSavedSoFar(formatMoneyInput(value))}
                  keyboardType="numeric"
                  placeholder="0"
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
                    Estimated amount needed to settle
                  </Text>
                  <Text style={[styles.estimateValue, { color: colors.primary }]}>
                    {formatCurrency(settlementTarget)}
                  </Text>

                  <View style={[styles.estimateDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.planRow}>
                    <Text style={[styles.planLabel, { color: colors.mutedForeground }]}>
                      Total amount saved
                    </Text>
                    <Text style={[styles.planValue, { color: colors.success }]}>
                      {formatCurrency(debtAmount - settlementTarget)}
                    </Text>
                  </View>
                  <Text style={[styles.estimateSub, { color: colors.mutedForeground }]}>
                    vs. paying the full {formatCurrency(debtAmount)}.
                  </Text>

                  {remainingNeeded > 0 && (
                    <>
                      <View style={[styles.estimateDivider, { backgroundColor: colors.border }]} />
                      <View style={styles.planRow}>
                        <Text style={[styles.planLabel, { color: colors.mutedForeground }]}>
                          Suggested monthly savings
                        </Text>
                        <Text style={[styles.planValue, { color: colors.foreground }]}>
                          ~{formatCurrency(suggestedMonthlySavings)}/mo
                        </Text>
                      </View>
                      <Text style={[styles.estimateSub, { color: colors.mutedForeground }]}>
                        To reach your target in about {formatMonths(SUGGESTED_HORIZON_MONTHS)}.
                      </Text>

                      {monthlySavingsAmount > 0 && programMonths > 0 && (
                        <>
                          <View style={[styles.estimateDivider, { backgroundColor: colors.border }]} />
                          <View style={styles.planRow}>
                            <Text style={[styles.planLabel, { color: colors.mutedForeground }]}>
                              At {formatCurrency(monthlySavingsAmount)}/mo, you'll be ready in
                            </Text>
                            <Text style={[styles.planValue, { color: colors.foreground }]}>
                              {formatMonths(programMonths)}
                            </Text>
                          </View>
                          <Text style={[styles.estimateSub, { color: colors.mutedForeground }]}>
                            Around {calcTargetDate(programMonths)}.
                          </Text>
                        </>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>
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
  estimateSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  estimateDivider: { height: 1, marginVertical: 8 },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  planLabel: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  planValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
