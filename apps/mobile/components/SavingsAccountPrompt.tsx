import { Feather } from "@expo/vector-icons";
import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { celebrate } from "@/lib/celebrate";
import { useAppStore } from "@/store/useAppStore";

/**
 * Post-onboarding nudge to open a dedicated settlement savings account. Renders
 * on the dashboard every launch (it's a non-blocking card, not a modal) until
 * the user confirms they've opened the account — at which point we fire a
 * confetti celebration and the card is gone for good.
 *
 * Visibility is decided by the dashboard; this component only renders the card.
 */
export function SavingsAccountPrompt() {
  const colors = useColors();
  const markSavingsAccountCreated = useAppStore(
    (s) => s.markSavingsAccountCreated
  );

  const confirmDone = () => {
    Alert.alert(
      "Account opened?",
      "Have you opened a dedicated savings account for your settlement fund?",
      [
        { text: "Not yet", style: "cancel" },
        {
          text: "Yes, it's open",
          onPress: () => {
            markSavingsAccountCreated();
            // Full-tier confetti to reward the step (see celebrationCopy).
            celebrate("savings_account_opened", { once: true });
          },
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.secondary, borderColor: colors.primary },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: "#FFFFFF" }]}>
          <Feather name="dollar-sign" size={20} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>NEXT STEP</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Open your settlement savings account
          </Text>
        </View>
      </View>

      <Text style={[styles.desc, { color: colors.mutedForeground }]}>
        Keep your settlement money separate so it's ready when you negotiate. Go
        online or visit your local bank to open a new savings account just for
        this.
      </Text>

      <Button
        label="I've opened my account"
        onPress={confirmDone}
        fullWidth
        style={styles.cta}
      />
      <Pressable
        onPress={confirmDone}
        hitSlop={8}
        accessibilityRole="button"
        style={styles.checkRow}
      >
        <Feather name="check-circle" size={15} color={colors.mutedForeground} />
        <Text style={[styles.checkText, { color: colors.mutedForeground }]}>
          Already have one? Tap to check it off.
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, gap: 2 },
  eyebrow: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: { fontSize: 16, fontFamily: "Inter_700Bold", lineHeight: 21 },
  desc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  cta: { marginTop: 2 },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  checkText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
