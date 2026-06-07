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
import type { PrimaryGoal } from "@/types";

const GOALS: { value: PrimaryGoal; label: string; desc: string; icon: string }[] = [
  { value: "settle", label: "Settle My Debt", desc: "Negotiate with creditors for less than I owe", icon: "check-circle" },
  { value: "repair", label: "Repair My Credit", desc: "Improve my credit score after settling", icon: "trending-up" },
  { value: "prepare", label: "Prepare for Calls", desc: "Know what to say when creditors call me", icon: "phone" },
  { value: "payoff", label: "Build a Payoff Plan", desc: "Create a structured plan to become debt-free", icon: "calendar" },
];

export default function OnboardingStep3() {
  const colors = useColors();
  const updateProfile = useAppStore((s) => s.updateProfile);
  const markOnboardingReady = useAppStore((s) => s.markOnboardingReady);

  const [creditScore, setCreditScore] = useState("");
  const [goal, setGoal] = useState<PrimaryGoal>("settle");
  const topPad = Platform.OS === "web" ? 67 : 0;

  const handleNext = () => {
    updateProfile({
      creditScore: Number(creditScore) || 0,
      primaryGoal: goal,
    });
    markOnboardingReady();
    router.replace("/auth");
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
                    backgroundColor: step <= 3 ? colors.primary : colors.muted,
                    width: step === 3 ? 24 : 8,
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
            Almost there!
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Step 3 of 3 — Credit score and your main goal
          </Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Current Credit Score{" "}
              <Text style={{ color: colors.mutedForeground }}>(optional)</Text>
            </Text>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              We use this to track your progress over time. You can update it anytime.
            </Text>
            <View style={[styles.scoreInput, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <TextInput
                value={creditScore}
                onChangeText={setCreditScore}
                placeholder="e.g., 580"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                style={[styles.scoreField, { color: colors.foreground }]}
                maxLength={3}
              />
              <Text style={[styles.scoreRange, { color: colors.mutedForeground }]}>
                / 850
              </Text>
            </View>
            {Number(creditScore) > 0 && (
              <Text style={[styles.scoreDesc, { color: colors.mutedForeground }]}>
                {Number(creditScore) < 580
                  ? "Poor — Settlement may be your best option"
                  : Number(creditScore) < 670
                    ? "Fair — Good time to start negotiating"
                    : "Good — You have some leverage with creditors"}
              </Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              What is your main goal?
            </Text>
            <View style={styles.goalList}>
              {GOALS.map((g) => (
                <Pressable
                  key={g.value}
                  onPress={() => setGoal(g.value)}
                  style={[
                    styles.goalCard,
                    {
                      borderColor:
                        goal === g.value ? colors.primary : colors.border,
                      backgroundColor:
                        goal === g.value ? colors.secondary : colors.card,
                    },
                  ]}
                >
                  <View style={[styles.goalIcon, { backgroundColor: goal === g.value ? colors.primary : colors.muted }]}>
                    <Feather
                      name={g.icon as any}
                      size={18}
                      color={goal === g.value ? "#FFFFFF" : colors.mutedForeground}
                    />
                  </View>
                  <View style={styles.goalText}>
                    <Text style={[styles.goalLabel, { color: goal === g.value ? colors.primary : colors.foreground }]}>
                      {g.label}
                    </Text>
                    <Text style={[styles.goalDesc, { color: colors.mutedForeground }]}>
                      {g.desc}
                    </Text>
                  </View>
                  {goal === g.value && (
                    <Feather name="check-circle" size={20} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: Platform.OS === "web" ? 34 : 16 }]}>
          <Button
            label="Build My Debt Program"
            onPress={handleNext}
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
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, gap: 24 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4 },
  field: { gap: 8 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  scoreInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 54,
  },
  scoreField: { flex: 1, fontSize: 24, fontFamily: "Inter_700Bold" },
  scoreRange: { fontSize: 16, fontFamily: "Inter_400Regular" },
  scoreDesc: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  goalList: { gap: 10 },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  goalText: { flex: 1 },
  goalLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  goalDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  footer: { padding: 20, paddingTop: 12, borderTopWidth: 1 },
});
