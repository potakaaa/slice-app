import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { SubscriptionTier } from "@/types";
import { Button } from "./Button";
import { Card } from "./Card";

interface UpgradePromptProps {
  requiredTier: SubscriptionTier;
  feature: string;
  description?: string;
}

const tierLabels: Record<SubscriptionTier, string> = {
  free: "Free",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

export function UpgradePrompt({ requiredTier, feature, description }: UpgradePromptProps) {
  const colors = useColors();
  return (
    <Card style={[styles.card, { borderColor: colors.primary, borderWidth: 1.5 }]}>
      <View style={styles.icon}>
        <Feather name="lock" size={28} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{feature}</Text>
      <Text style={[styles.desc, { color: colors.mutedForeground }]}>
        {description ??
          `This feature is available on the ${tierLabels[requiredTier]} plan and above.`}
      </Text>
      <Button
        label={`Upgrade to ${tierLabels[requiredTier]}`}
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
});
