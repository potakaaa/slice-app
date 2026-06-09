import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { TIER_BENEFITS, TIER_META } from "@/lib/tierBenefits";
import type { SubscriptionTier } from "@/types";
import { Button } from "./Button";
import { Card } from "./Card";

interface UpgradePromptProps {
  requiredTier: SubscriptionTier;
  feature: string;
  description?: string;
}

export function UpgradePrompt({ requiredTier, feature, description }: UpgradePromptProps) {
  const colors = useColors();
  const tierLabel = TIER_META[requiredTier].label;
  const benefits = TIER_BENEFITS[requiredTier]?.headline ?? [];

  return (
    <Card style={[styles.card, { borderColor: colors.primary, borderWidth: 1.5 }]}>
      <View style={styles.icon}>
        <Feather name="lock" size={28} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{feature}</Text>
      <Text style={[styles.desc, { color: colors.mutedForeground }]}>
        {description ?? `This feature is available on the ${tierLabel} plan and above.`}
      </Text>

      {benefits.length > 0 && (
        <View style={styles.benefits}>
          {benefits.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Feather name="check" size={14} color={colors.primary} />
              <Text style={[styles.benefitText, { color: colors.foreground }]}>{benefit}</Text>
            </View>
          ))}
        </View>
      )}

      <Button
        label={`Upgrade to ${tierLabel}`}
        onPress={() => router.push("/pricing")}
        style={{ marginTop: 4 }}
        fullWidth
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: 8,
    padding: 24,
  },
  icon: {
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  desc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  benefits: {
    alignSelf: "stretch",
    gap: 8,
    marginTop: 4,
  },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
});
