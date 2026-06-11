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
import { useCreateCreditor, useCreditors, useProfile } from "@/lib/sliceData";
import {
  formatCurrency,
  formatMoneyInput,
  formatPhoneInput,
  parseMoneyInput,
} from "@/utils/calculations";

export default function AddCreditorScreen() {
  const colors = useColors();
  const createCreditor = useCreateCreditor();
  const { creditors } = useCreditors();
  const { profile } = useProfile();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [balance, setBalance] = useState("");
  // Settlement target is a single program-wide setting (Settings > Program),
  // applied to every creditor — not chosen per creditor.
  const settlementPct = profile.defaultSettlementPercentage;
  const [monthlySavings, setMonthlySavings] = useState(
    formatMoneyInput(profile.defaultMonthlySavings)
  );

  const balanceValue = parseMoneyInput(balance);
  const monthlySavingsValue = parseMoneyInput(monthlySavings);
  const canSave = name.trim().length > 0 && balanceValue > 0;
  const settled = balanceValue * settlementPct;
  const months =
    monthlySavingsValue > 0
      ? Math.ceil(settled / monthlySavingsValue)
      : 0;

  const topPad = Platform.OS === "web" ? 67 : 0;

  const handleSave = async () => {
    await createCreditor.mutateAsync({
      name: name.trim(),
      phone: phone.trim(),
      balance: balanceValue,
      settlementPercentage: settlementPct,
      monthlySavings: monthlySavingsValue,
      priority: creditors.length + 1,
    });
    router.back();
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
        >
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Creditor Name *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Bank of America"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                autoCapitalize="words"
                autoFocus
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Phone Number
              </Text>
              <TextInput
                value={phone}
                onChangeText={(value) => setPhone(formatPhoneInput(value))}
                placeholder="800-000-0000"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Amount Owed *
              </Text>
              <View style={[styles.dollarInput, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.dollar, { color: colors.mutedForeground }]}>$</Text>
                <TextInput
                  value={balance}
                  onChangeText={(value) => setBalance(formatMoneyInput(value))}
                  placeholder="10,000"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  style={[styles.dollarField, { color: colors.foreground }]}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Settlement Target
              </Text>
              <Text style={[styles.targetCaption, { color: colors.mutedForeground }]}>
                Program-wide target — applies to every creditor.
              </Text>
              <Pressable
                onPress={() => router.push("/profile")}
                style={[styles.targetRow, { borderColor: colors.border, backgroundColor: colors.card }]}
              >
                <Text style={[styles.targetValue, { color: colors.foreground }]}>
                  {Math.round(settlementPct * 100)}% of balance
                </Text>
                <Text style={[styles.targetHint, { color: colors.primary }]}>Change in Settings</Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Monthly Savings
              </Text>
              <View style={[styles.dollarInput, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.dollar, { color: colors.mutedForeground }]}>$</Text>
                <TextInput
                  value={monthlySavings}
                  onChangeText={(value) =>
                    setMonthlySavings(formatMoneyInput(value))
                  }
                  placeholder="500"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  style={[styles.dollarField, { color: colors.foreground }]}
                />
                <Text style={[styles.perMo, { color: colors.mutedForeground }]}>/mo</Text>
              </View>
            </View>

            {/* Preview */}
            {balanceValue > 0 && (
              <View style={[styles.preview, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
                <Text style={[styles.previewTitle, { color: colors.primary }]}>
                  Program Preview
                </Text>
                <View style={styles.previewRow}>
                  <View style={styles.previewItem}>
                    <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Owed</Text>
                    <Text style={[styles.previewValue, { color: colors.foreground }]}>
                      {formatCurrency(balanceValue)}
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
          {!canSave && (
            <Text style={[styles.footerHint, { color: colors.mutedForeground }]}>
              Add a creditor name and amount owed to continue.
            </Text>
          )}
          <Button
            label="Save Creditor"
            onPress={handleSave}
            disabled={!canSave}
            loading={createCreditor.isPending}
            fullWidth
          />
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
  dollarField: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", height: 50 },
  perMo: { fontSize: 13, fontFamily: "Inter_400Regular" },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
  },
  targetCaption: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
  targetValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  targetHint: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  preview: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  previewTitle: { fontSize: 13, fontFamily: "Inter_700Bold" },
  previewRow: { flexDirection: "row", justifyContent: "space-around" },
  previewItem: { alignItems: "center", gap: 4 },
  previewLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  previewValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  footer: { padding: 20, paddingTop: 12, borderTopWidth: 1 },
  footerHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 10,
  },
});
