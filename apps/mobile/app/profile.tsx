import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TierBadge } from "@/components/TierBadge";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";
import { integrationMessage } from "@/lib/integrationErrors";
import { useRevenueCat } from "@/lib/revenueCat";
import { useCreditors, useDeleteAccount, useProfile, useUpsertProfile } from "@/lib/sliceData";
import { supabase } from "@/lib/supabase";
import {
  formatCurrency,
  getTotalDebt,
  getTotalSettlementTarget,
  getMaxProgramLength,
} from "@/utils/calculations";
import type { PrimaryGoal } from "@/types";

const GOAL_LABELS: Record<PrimaryGoal, string> = {
  settle: "Settle My Debt",
  repair: "Repair My Credit",
  prepare: "Prepare for Calls",
  payoff: "Build a Payoff Plan",
};

export default function ProfileScreen() {
  const colors = useColors();
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { creditors } = useCreditors();
  const updateProfile = useUpsertProfile();
  const deleteAccount = useDeleteAccount();
  const revenueCat = useRevenueCat();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [hasChanges, setHasChanges] = useState(false);
  const [subscriptionBusy, setSubscriptionBusy] = useState<"restore" | "manage" | null>(null);

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 20;

  const totalDebt = getTotalDebt(creditors);
  const totalTarget = getTotalSettlementTarget(creditors);
  const months = getMaxProgramLength(creditors);

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
    setHasChanges(false);
  }, [profile.email, profile.name]);

  const handleSave = async () => {
    if (email.trim() && email.trim() !== profile.email) {
      const { error } = await supabase.auth.updateUser({ email: email.trim() });
      if (error) throw error;
    }
    await updateProfile.mutateAsync({ name: name.trim() });
    setHasChanges(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will delete your SLICE account and all Supabase-backed program data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            await deleteAccount.mutateAsync();
            await signOut();
          },
        },
      ]
    );
  };

  const handleSubscriptionAction = async (action: "restore" | "manage") => {
    setSubscriptionBusy(action);
    try {
      if (action === "restore") {
        await revenueCat.restore();
        Alert.alert("Purchases Restored", "Your subscription access has been refreshed.");
      } else {
        await revenueCat.manage();
      }
    } catch (error) {
      Alert.alert("Subscription", integrationMessage(error, "The subscription action could not be completed."));
    } finally {
      setSubscriptionBusy(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile header */}
          <View style={[styles.profileHeader, { backgroundColor: colors.primary }]}>
            <View style={[styles.avatar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Text style={styles.avatarText}>
                {profile.name ? profile.name.charAt(0).toUpperCase() : "S"}
              </Text>
            </View>
            <Text style={styles.profileName}>{profile.name || "SLICE User"}</Text>
            <TierBadge tier={profile.tier} />
          </View>

          {/* Debt stats */}
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Program Summary
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {formatCurrency(totalDebt)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Debt</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {formatCurrency(totalTarget)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Settlement Target</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {months > 0 ? `${months} mo` : "—"}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Program Length</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {creditors.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Creditors</Text>
              </View>
            </View>
          </Card>

          {/* Edit info */}
          <Card style={styles.form}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Personal Info
            </Text>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Name</Text>
              <TextInput
                value={name}
                onChangeText={(v) => { setName(v); setHasChanges(true); }}
                placeholder="Your name"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Email</Text>
              <TextInput
                value={email}
                onChangeText={(v) => { setEmail(v); setHasChanges(true); }}
                placeholder="your@email.com"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {hasChanges && (
              <Button label="Save Changes" onPress={handleSave} loading={updateProfile.isPending} fullWidth />
            )}
          </Card>

          {/* Program settings */}
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Program Settings
            </Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Primary Goal</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {GOAL_LABELS[profile.primaryGoal]}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Default Settlement %</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {Math.round(profile.defaultSettlementPercentage * 100)}%
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Monthly Savings</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {formatCurrency(profile.defaultMonthlySavings)}/mo
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Credit Score</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {profile.creditScore > 0 ? profile.creditScore : "Not set"}
              </Text>
            </View>
          </Card>

          {/* Subscription */}
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Subscription</Text>
            <View style={styles.tierRow}>
              <TierBadge tier={profile.tier} />
              <Pressable onPress={() => router.push("/pricing")}>
                <Text style={[styles.upgradeLink, { color: colors.primary }]}>
                  {profile.tier === "platinum" ? "Manage Plan" : "Upgrade Plan"}
                </Text>
              </Pressable>
            </View>
            <View style={styles.subscriptionLinks}>
              <Pressable
                onPress={() => handleSubscriptionAction("restore")}
                disabled={subscriptionBusy !== null || !revenueCat.available}
              >
                <Text style={[styles.upgradeLink, { color: colors.primary }]}>
                  {subscriptionBusy === "restore" ? "Restoring..." : "Restore Purchases"}
                </Text>
              </Pressable>
              {profile.tier !== "free" && (
                <Pressable
                  onPress={() => handleSubscriptionAction("manage")}
                  disabled={subscriptionBusy !== null || !revenueCat.available}
                >
                  <Text style={[styles.upgradeLink, { color: colors.primary }]}>
                    {subscriptionBusy === "manage" ? "Opening..." : "Manage Subscription"}
                  </Text>
                </Pressable>
              )}
            </View>
          </Card>

          {/* Links */}
          <Card style={styles.links}>
            {[
              { label: "Legal Disclaimer", route: "/legal", icon: "file-text" },
              { label: "Privacy Policy", route: "/privacy-policy", icon: "shield" },
            ].map((item) => (
              <Pressable
                key={item.route + item.label}
                onPress={() => router.push(item.route as any)}
                style={[styles.linkRow, { borderBottomColor: colors.border }]}
              >
                <Feather name={item.icon as any} size={16} color={colors.primary} />
                <Text style={[styles.linkText, { color: colors.foreground }]}>{item.label}</Text>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </Card>

          {/* Danger zone */}
          <Button
            label="Sign Out"
            variant="secondary"
            onPress={signOut}
            fullWidth
          />
          <Button
            label="Delete Account"
            variant="destructive"
            onPress={handleDeleteAccount}
            loading={deleteAccount.isPending}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { gap: 12, padding: 16 },
  profileHeader: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: { color: "#FFFFFF", fontSize: 28, fontFamily: "Inter_700Bold" },
  profileName: { color: "#FFFFFF", fontSize: 20, fontFamily: "Inter_700Bold" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statItem: { width: "47%", gap: 3 },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  form: { gap: 14 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 13,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  infoLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tierRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  subscriptionLinks: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 14 },
  upgradeLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  links: { padding: 0, overflow: "hidden" },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  linkText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
});
