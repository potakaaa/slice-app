import { router } from "expo-router";
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

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";
import { useProfile, useUpsertProfile } from "@/lib/sliceData";
import { formatCurrency, formatMoneyInput, parseMoneyInput } from "@/utils/calculations";

export default function AddToFundScreen() {
  const colors = useColors();
  const { profile } = useProfile();
  const upsertProfile = useUpsertProfile();

  const [amount, setAmount] = useState("");
  const added = parseMoneyInput(amount);
  const newTotal = profile.currentSavedCash + added;

  const topPad = Platform.OS === "web" ? 67 : 0;

  const handleAdd = async () => {
    await upsertProfile.mutateAsync({ currentSavedCash: newTotal });
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.foreground }]}>Add to your fund</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Every bit you set aside moves your first offer closer.
          </Text>

          <Card>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>CURRENT FUND</Text>
            <Text style={[styles.current, { color: colors.foreground }]}>
              {formatCurrency(profile.currentSavedCash)}
            </Text>
          </Card>

          <Card>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>AMOUNT TO ADD</Text>
            <View style={[styles.dollarInput, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.dollar, { color: colors.mutedForeground }]}>$</Text>
              <TextInput
                value={amount}
                onChangeText={(v) => setAmount(formatMoneyInput(v))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.dollarTextInput, { color: colors.foreground }]}
                autoFocus
              />
            </View>
            {added > 0 && (
              <Text style={[styles.preview, { color: colors.primary }]}>
                New fund total: {formatCurrency(newTotal)}
              </Text>
            )}
          </Card>

          <Button
            label="Add to fund"
            onPress={handleAdd}
            loading={upsertProfile.isPending}
            disabled={added <= 0}
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
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 4 },
  label: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8, marginBottom: 8 },
  current: { fontSize: 26, fontFamily: "Inter_700Bold" },
  dollarInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 56,
  },
  dollar: { fontSize: 20, fontFamily: "Inter_600SemiBold", marginRight: 4 },
  dollarTextInput: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold", height: 56 },
  preview: { fontSize: 14, fontFamily: "Inter_700Bold", marginTop: 12 },
  disclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16 },
});
