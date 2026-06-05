import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Card } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import { useColors } from "@/hooks/useColors";
import { formatCurrency, calcSettledAmount } from "@/utils/calculations";

export default function SavingsPlannerScreen() {
  const colors = useColors();
  const [balance, setBalance] = useState("10000");
  const [pct, setPct] = useState("50");
  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 20;

  const bal = Number(balance);
  const settlePct = Number(pct) / 100;
  const settlementTarget = bal * settlePct;

  const MONTHLY_OPTIONS = [100, 200, 300, 400, 500, 600, 750, 1000, 1500, 2000];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            See how different monthly savings amounts affect your timeline.
          </Text>

          <Card style={styles.inputCard}>
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={[styles.label, { color: colors.foreground }]}>Balance Owed</Text>
                <View style={[styles.inputWrap, { borderColor: colors.border }]}>
                  <Text style={[styles.prefix, { color: colors.mutedForeground }]}>$</Text>
                  <TextInput
                    value={balance}
                    onChangeText={setBalance}
                    keyboardType="numeric"
                    style={[styles.input, { color: colors.foreground }]}
                  />
                </View>
              </View>
              <View style={styles.half}>
                <Text style={[styles.label, { color: colors.foreground }]}>Settlement %</Text>
                <View style={[styles.inputWrap, { borderColor: colors.border }]}>
                  <TextInput
                    value={pct}
                    onChangeText={setPct}
                    keyboardType="numeric"
                    style={[styles.input, { color: colors.foreground }]}
                    maxLength={2}
                  />
                  <Text style={[styles.suffix, { color: colors.mutedForeground }]}>%</Text>
                </View>
              </View>
            </View>
            {bal > 0 && (
              <Text style={[styles.target, { color: colors.primary }]}>
                Settlement target: {formatCurrency(settlementTarget)}
              </Text>
            )}
          </Card>

          {bal > 0 && settlementTarget > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Monthly Savings Scenarios
              </Text>
              {MONTHLY_OPTIONS.map((mo) => {
                const months = Math.ceil(settlementTarget / mo);
                const years = (months / 12).toFixed(1);
                const progress = Math.min(1, mo / settlementTarget);

                return (
                  <Card key={mo} style={styles.scenarioCard}>
                    <View style={styles.scenarioHeader}>
                      <Text style={[styles.moAmount, { color: colors.primary }]}>
                        {formatCurrency(mo)}/mo
                      </Text>
                      <View style={styles.timeline}>
                        <Text style={[styles.months, { color: colors.foreground }]}>
                          {months} months
                        </Text>
                        <Text style={[styles.years, { color: colors.mutedForeground }]}>
                          ({years} yrs)
                        </Text>
                      </View>
                    </View>
                    <ProgressBar progress={progress} height={6} />
                    <Text style={[styles.scenarioNote, { color: colors.mutedForeground }]}>
                      {months <= 6
                        ? "Excellent — aggressive savings plan"
                        : months <= 12
                          ? "Good — achievable within a year"
                          : months <= 24
                            ? "Moderate — solid 1-2 year plan"
                            : "Long-term — consider a higher monthly amount"}
                    </Text>
                  </Card>
                );
              })}
            </>
          )}

          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            SLICE estimates are for planning purposes only. Actual settlement terms depend on
            negotiation with each creditor.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  inputCard: { gap: 12 },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1, gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  prefix: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginRight: 4 },
  suffix: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginLeft: 4 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  target: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  scenarioCard: { gap: 8 },
  scenarioHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  moAmount: { fontSize: 16, fontFamily: "Inter_700Bold" },
  timeline: { alignItems: "flex-end" },
  months: { fontSize: 15, fontFamily: "Inter_700Bold" },
  years: { fontSize: 12, fontFamily: "Inter_400Regular" },
  scenarioNote: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  disclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16 },
});
