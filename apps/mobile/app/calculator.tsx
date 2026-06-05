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

import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";
import { formatCurrency, formatPct } from "@/utils/calculations";

const PERCENTAGES = [0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7];

export default function CalculatorScreen() {
  const colors = useColors();
  const [balance, setBalance] = useState("");
  const [monthly, setMonthly] = useState("");
  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 20;

  const bal = Number(balance);
  const mo = Number(monthly);

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
            Enter your balance and monthly savings to see settlement options at every percentage.
          </Text>

          {/* Inputs */}
          <Card style={styles.inputCard}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Balance Owed</Text>
              <View style={[styles.dollarInput, { borderColor: colors.border }]}>
                <Text style={[styles.dollar, { color: colors.mutedForeground }]}>$</Text>
                <TextInput
                  value={balance}
                  onChangeText={setBalance}
                  placeholder="10,000"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  style={[styles.textInput, { color: colors.foreground }]}
                />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Monthly Savings</Text>
              <View style={[styles.dollarInput, { borderColor: colors.border }]}>
                <Text style={[styles.dollar, { color: colors.mutedForeground }]}>$</Text>
                <TextInput
                  value={monthly}
                  onChangeText={setMonthly}
                  placeholder="500"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  style={[styles.textInput, { color: colors.foreground }]}
                />
                <Text style={[styles.perMo, { color: colors.mutedForeground }]}>/mo</Text>
              </View>
            </View>
          </Card>

          {bal > 0 && (
            <>
              {/* Results table */}
              <View style={[styles.tableHeader, { borderColor: colors.border }]}>
                <Text style={[styles.th, { color: colors.mutedForeground }]}>Settlement %</Text>
                <Text style={[styles.th, { color: colors.mutedForeground }]}>You Pay</Text>
                <Text style={[styles.th, { color: colors.mutedForeground }]}>You Save</Text>
                <Text style={[styles.th, { color: colors.mutedForeground }]}>Months</Text>
              </View>

              {PERCENTAGES.map((pct) => {
                const settledAmt = bal * pct;
                const savings = bal - settledAmt;
                const months = mo > 0 ? Math.ceil(settledAmt / mo) : null;
                const isTarget = pct === 0.5;

                return (
                  <Pressable key={pct}>
                    <View
                      style={[
                        styles.row,
                        {
                          backgroundColor: isTarget ? colors.secondary : colors.card,
                          borderColor: isTarget ? colors.primary : colors.border,
                          borderWidth: isTarget ? 1.5 : 1,
                        },
                      ]}
                    >
                      <View style={styles.cell}>
                        <Text style={[styles.pctLabel, { color: colors.primary }]}>
                          {formatPct(pct)}
                        </Text>
                        {isTarget && (
                          <Text style={[styles.popularTag, { color: colors.primary }]}>
                            Common
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.cellText, { color: colors.foreground }]}>
                        {formatCurrency(settledAmt)}
                      </Text>
                      <Text style={[styles.cellText, { color: "#22C55E" }]}>
                        {formatCurrency(savings)}
                      </Text>
                      <Text style={[styles.cellText, { color: colors.foreground }]}>
                        {months != null ? `${months} mo` : "—"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}

              <Text style={[styles.note, { color: colors.mutedForeground }]}>
                Months to save is based on your monthly savings of {mo > 0 ? formatCurrency(mo) : "—"}.
                These are estimates only.
              </Text>
            </>
          )}

          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            SLICE does not guarantee any creditor will accept a settlement at any percentage.
            Consult a financial professional for personalized guidance.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 10 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  inputCard: { gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  dollarInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
  },
  dollar: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginRight: 4 },
  textInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", height: 50 },
  perMo: { fontSize: 13, fontFamily: "Inter_400Regular" },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  th: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  cell: { flex: 1, alignItems: "center" },
  pctLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  popularTag: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  cellText: { flex: 1, textAlign: "center", fontSize: 13, fontFamily: "Inter_500Medium" },
  note: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
  },
});
