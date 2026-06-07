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
import { useAppStore } from "@/store/useAppStore";
import {
  formatCurrency,
  formatMoneyInput,
  parseMoneyInput,
} from "@/utils/calculations";

const SETTLEMENT_OPTIONS = [0.3, 0.4, 0.5, 0.6, 0.7];

export default function OnboardingStep1() {
  const colors = useColors();
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [monthlySavings, setMonthlySavings] = useState(
    formatMoneyInput(profile.defaultMonthlySavings)
  );
  const [settlementPct, setSettlementPct] = useState(
    profile.defaultSettlementPercentage
  );
  const topPad = Platform.OS === "web" ? 67 : 0;

  const canContinue =
    name.trim().length > 0 && parseMoneyInput(monthlySavings) > 0;

  const handleNext = () => {
    updateProfile({
      name: name.trim(),
      email: email.trim(),
      defaultMonthlySavings: parseMoneyInput(monthlySavings),
      defaultSettlementPercentage: settlementPct,
    });
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
                    width: step === 1 ? 24 : 8,
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
            Step 1 of 3 — Your basic info and savings ability
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
                Email{" "}
                <Text style={{ color: colors.mutedForeground }}>(optional)</Text>
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                keyboardType="email-address"
                autoCapitalize="none"
              />
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
                Default Settlement Target
              </Text>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                What percentage of each debt do you aim to settle for?
              </Text>
              <View style={styles.pctRow}>
                {SETTLEMENT_OPTIONS.map((pct) => (
                  <Pressable
                    key={pct}
                    onPress={() => setSettlementPct(pct)}
                    style={[
                      styles.pctBtn,
                      {
                        backgroundColor:
                          settlementPct === pct ? colors.primary : colors.muted,
                        borderColor:
                          settlementPct === pct ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pctText,
                        {
                          color:
                            settlementPct === pct
                              ? colors.primaryForeground
                              : colors.foreground,
                        },
                      ]}
                    >
                      {Math.round(pct * 100)}%
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.example, { color: colors.mutedForeground }]}>
                Example: $10,000 debt at {Math.round(settlementPct * 100)}% ={" "}
                {formatCurrency(10000 * settlementPct)} settlement target
              </Text>
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
  dot: { height: 8, borderRadius: 4 },
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
  pctRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pctBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  pctText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  example: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
