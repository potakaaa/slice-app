import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
import { formatCurrency, calcSettledAmount, calcProgramLength } from "@/utils/calculations";

const SETTLEMENT_OPTIONS = [0.3, 0.4, 0.5, 0.6, 0.7];

export default function EditCreditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const creditors = useAppStore((s) => s.creditors);
  const updateCreditor = useAppStore((s) => s.updateCreditor);
  const deleteCreditor = useAppStore((s) => s.deleteCreditor);

  const creditor = creditors.find((c) => c.id === id);
  const topPad = Platform.OS === "web" ? 67 : 0;

  const [name, setName] = useState(creditor?.name ?? "");
  const [phone, setPhone] = useState(creditor?.phone ?? "");
  const [balance, setBalance] = useState(creditor ? String(creditor.balance) : "");
  const [settlementPct, setSettlementPct] = useState(creditor?.settlementPercentage ?? 0.5);
  const [monthlySavings, setMonthlySavings] = useState(
    creditor ? String(creditor.monthlySavings) : "500"
  );

  if (!creditor) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Text style={{ padding: 20, color: colors.foreground }}>Creditor not found.</Text>
      </SafeAreaView>
    );
  }

  const canSave = name.trim().length > 0 && Number(balance) > 0;
  const settled = calcSettledAmount(Number(balance), settlementPct);
  const months = calcProgramLength(settled, Number(monthlySavings));

  const handleSave = () => {
    updateCreditor(creditor.id, {
      name: name.trim(),
      phone: phone.trim(),
      balance: Number(balance),
      settlementPercentage: settlementPct,
      monthlySavings: Number(monthlySavings),
    });
    router.back();
  };

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
            router.dismissAll();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Creditor Name *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Bank of America"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Phone Number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="800-000-0000"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Amount Owed *</Text>
              <View style={[styles.dollarInput, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.dollar, { color: colors.mutedForeground }]}>$</Text>
                <TextInput
                  value={balance}
                  onChangeText={setBalance}
                  placeholder="10,000"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  style={[styles.dollarField, { color: colors.foreground }]}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Settlement Target %</Text>
              <View style={styles.pctRow}>
                {SETTLEMENT_OPTIONS.map((pct) => (
                  <Pressable
                    key={pct}
                    onPress={() => setSettlementPct(pct)}
                    style={[
                      styles.pctBtn,
                      {
                        backgroundColor: settlementPct === pct ? colors.primary : colors.muted,
                        borderColor: settlementPct === pct ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pctText,
                        { color: settlementPct === pct ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {Math.round(pct * 100)}%
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Monthly Savings</Text>
              <View style={[styles.dollarInput, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.dollar, { color: colors.mutedForeground }]}>$</Text>
                <TextInput
                  value={monthlySavings}
                  onChangeText={setMonthlySavings}
                  placeholder="500"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  style={[styles.dollarField, { color: colors.foreground }]}
                />
                <Text style={[styles.perMo, { color: colors.mutedForeground }]}>/mo</Text>
              </View>
            </View>

            {/* Preview */}
            {Number(balance) > 0 && (
              <View style={[styles.preview, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
                <Text style={[styles.previewTitle, { color: colors.primary }]}>Updated Preview</Text>
                <View style={styles.previewRow}>
                  <View style={styles.previewItem}>
                    <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Owed</Text>
                    <Text style={[styles.previewValue, { color: colors.foreground }]}>
                      {formatCurrency(Number(balance))}
                    </Text>
                  </View>
                  <View style={styles.previewItem}>
                    <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Target</Text>
                    <Text style={[styles.previewValue, { color: colors.primary }]}>
                      {formatCurrency(settled)}
                    </Text>
                  </View>
                  <View style={styles.previewItem}>
                    <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Length</Text>
                    <Text style={[styles.previewValue, { color: colors.foreground }]}>
                      {months > 0 ? `${months} mo` : "—"}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: Platform.OS === "web" ? 34 : 16 }]}>
          <Button label="Save Changes" onPress={handleSave} disabled={!canSave} fullWidth />
          <Button label="Delete Creditor" variant="destructive" onPress={handleDelete} fullWidth />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 8 },
  form: { gap: 18 },
  field: { gap: 8 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: {
    borderWidth: 1, borderRadius: 10, padding: 14,
    fontSize: 15, fontFamily: "Inter_400Regular",
  },
  dollarInput: {
    flexDirection: "row", alignItems: "center", borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 14, height: 50,
  },
  dollar: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginRight: 4 },
  dollarField: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", height: 50 },
  perMo: { fontSize: 13, fontFamily: "Inter_400Regular" },
  pctRow: { flexDirection: "row", gap: 8 },
  pctBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  pctText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  preview: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  previewTitle: { fontSize: 13, fontFamily: "Inter_700Bold" },
  previewRow: { flexDirection: "row", justifyContent: "space-around" },
  previewItem: { alignItems: "center", gap: 4 },
  previewLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  previewValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  footer: { padding: 20, paddingTop: 12, borderTopWidth: 1, gap: 10 },
});
