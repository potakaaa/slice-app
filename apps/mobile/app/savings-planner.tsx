import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ProgressBar } from "@/components/ProgressBar";
import { useColors } from "@/hooks/useColors";
import {
  useAggregateProgram,
  useCreditors,
  useProfile,
  useSyncAggregateProgram,
  useToggleSavingsTrackerMonth,
} from "@/lib/sliceData";
import {
  buildSimpleDebtProgram,
  formatCurrency,
  getTotalDebt,
} from "@/utils/calculations";

const DISCLOSURE_COPY =
  "This monthly savings tracker is for planning only. SLICE does not guarantee settlement results, and you should get any settlement agreement in writing before making payment.";

function getPersonalProgramName(name: string) {
  const firstName = name.trim().split(/\s+/)[0];
  if (!firstName) return "Your Customized Debt Program";
  return `${firstName}${firstName.endsWith("s") ? "'" : "'s"} Customized Debt Program`;
}

export default function SavingsPlannerScreen() {
  const colors = useColors();
  const { creditors, isLoading: creditorsLoading } = useCreditors();
  const { profile, isLoading: profileLoading } = useProfile();
  const { debtProgram, trackerMonths, isLoading: programLoading } = useAggregateProgram();
  const syncProgram = useSyncAggregateProgram();
  const toggleMonth = useToggleSavingsTrackerMonth();

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 20;
  const [localDisclosureAccepted, setLocalDisclosureAccepted] = useState(false);
  const lastSyncKeyRef = useRef<string | null>(null);

  const totalDebt = getTotalDebt(creditors);
  const monthlySavings = profile.defaultMonthlySavings;
  const programName = getPersonalProgramName(profile.name);
  const previewProgram = useMemo(
    () => buildSimpleDebtProgram(totalDebt, monthlySavings),
    [monthlySavings, totalDebt],
  );

  const syncKey = useMemo(
    () =>
      JSON.stringify({
        totalDebt,
        monthlySavings,
        creditors: creditors.map((creditor) => ({
          id: creditor.id,
          balance: creditor.balance,
        })),
      }),
    [creditors, monthlySavings, totalDebt],
  );

  useEffect(() => {
    if (debtProgram?.disclosureAccepted) {
      setLocalDisclosureAccepted(true);
    }
  }, [debtProgram?.disclosureAccepted]);

  useEffect(() => {
    if (creditorsLoading || profileLoading || creditors.length === 0 || syncProgram.isPending) return;
    if (lastSyncKeyRef.current === syncKey) return;
    lastSyncKeyRef.current = syncKey;
    syncProgram.mutate({}, {
      onError: () => {
        lastSyncKeyRef.current = null;
      },
    });
  }, [creditors.length, creditorsLoading, profileLoading, syncKey, syncProgram]);

  const program = debtProgram ?? {
    id: "preview",
    ...previewProgram,
    disclosureAccepted: false,
    disclosureAcceptedAt: null,
  };

  const trackerEnabled =
    localDisclosureAccepted || debtProgram?.disclosureAccepted || false;
  const completedMonths = trackerMonths.filter((month) => month.status === "saved").length;
  const trackerProgress =
    trackerMonths.length > 0 ? completedMonths / trackerMonths.length : 0;
  const showLoadingState =
    (programLoading && !debtProgram) ||
    (syncProgram.isPending && !debtProgram && creditors.length > 0);

  const handleAcceptDisclosure = () => {
    if (trackerEnabled) return;
    setLocalDisclosureAccepted(true);
    syncProgram.mutate({ acceptDisclosure: true });
  };

  const handleToggleMonth = (monthId: string, saved: boolean) => {
    toggleMonth.mutate({ monthId, saved });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
      {creditorsLoading || profileLoading || showLoadingState ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : creditors.length === 0 ? (
        <EmptyState
          icon="trending-up"
          title="No savings tracker yet"
          description="Add at least one creditor to build your customized debt program and monthly savings tracker."
          actionLabel="Add Creditor"
          onAction={() => router.push("/creditor/add")}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Track one simple savings plan for your total debt using SLICE&apos;s default 50%
            settlement estimate.
          </Text>

          <Card style={styles.summaryCard}>
            <View>
              <Text style={[styles.programTitle, { color: colors.foreground }]}>
                {programName}
              </Text>
              <Text style={[styles.summaryHint, { color: colors.mutedForeground }]}>
                Aggregate plan based on your current creditors
              </Text>
            </View>

            <View style={styles.programMetaRow}>
              <View style={[styles.rateBadge, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.rateBadgeText, { color: colors.primary }]}>50% target</Text>
              </View>
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                Estimated settlement target
              </Text>
            </View>

            <View style={styles.statGrid}>
              <View style={[styles.statTile, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Debt</Text>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {formatCurrency(program.totalDebt)}
                </Text>
              </View>
              <View style={[styles.statTile, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Estimated Settlement
                </Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {formatCurrency(program.estimatedSettlementAmount)}
                </Text>
              </View>
              <View style={[styles.statTile, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Suggested/mo
                </Text>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {formatCurrency(program.monthlySavingsAmount)}
                </Text>
              </View>
              <View style={[styles.statTile, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Program Length
                </Text>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {program.programLengthMonths > 0 ? `${program.programLengthMonths} months` : "—"}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push("/profile")}
              style={({ pressed }) => [
                styles.inlineLink,
                { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={[styles.inlineLinkText, { color: colors.foreground }]}>
                Need to change your monthly savings amount?
              </Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
          </Card>

          <Card style={styles.disclosureCard}>
            <View style={styles.disclosureHeader}>
              <Feather name="shield" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Savings Disclosure
              </Text>
            </View>
            <Text style={[styles.disclosureText, { color: colors.foreground }]}>
              {DISCLOSURE_COPY}
            </Text>
            <Pressable
              onPress={handleAcceptDisclosure}
              style={({ pressed }) => [
                styles.checkboxRow,
                { opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: trackerEnabled ? colors.success : "transparent",
                    borderColor: trackerEnabled ? colors.success : colors.border,
                  },
                ]}
              >
                {trackerEnabled && <Feather name="check" size={14} color={colors.successForeground} />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.foreground }]}>
                I have read and understand the savings disclosure.
              </Text>
            </Pressable>
          </Card>

          {program.monthlySavingsAmount <= 0 ? (
            <Card style={styles.noticeCard}>
              <Text style={[styles.noticeTitle, { color: colors.foreground }]}>
                Add a suggested monthly amount
              </Text>
              <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
                Set a suggested monthly savings amount in your profile and we'll map out your tracker timeline. You can change it anytime.
              </Text>
            </Card>
          ) : !trackerEnabled ? (
            <Card style={styles.noticeCard}>
              <Text style={[styles.noticeTitle, { color: colors.foreground }]}>
                Tracker locked until disclosure is accepted
              </Text>
              <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
                Check the disclosure above to start tracking Month 1 through Month{" "}
                {program.programLengthMonths}.
              </Text>
            </Card>
          ) : (
            <>
              <Card>
                <View style={styles.progressHeader}>
                  <View>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                      Monthly Savings Tracker
                    </Text>
                    <Text style={[styles.progressSubtext, { color: colors.mutedForeground }]}>
                      Mark each month after you&apos;ve completed that month&apos;s savings goal.
                    </Text>
                  </View>
                </View>
                <Text style={[styles.progressCount, { color: colors.primary }]}>
                  {completedMonths}/{trackerMonths.length} months saved
                </Text>
                <ProgressBar progress={trackerProgress} height={8} />
              </Card>

              {trackerMonths.map((month) => {
                const saved = month.status === "saved";
                return (
                  <Pressable
                    key={month.id}
                    onPress={() => handleToggleMonth(month.id, !saved)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                  >
                    <Card style={styles.monthCard}>
                      <View
                        style={[
                          styles.monthCheckbox,
                          {
                            backgroundColor: saved ? colors.success : "transparent",
                            borderColor: saved ? colors.success : colors.border,
                          },
                        ]}
                      >
                        {saved && (
                          <Feather name="check" size={16} color={colors.successForeground} />
                        )}
                      </View>

                      <View style={styles.monthContent}>
                        <Text style={[styles.monthTitle, { color: colors.foreground }]}>
                          Month {month.monthIndex}
                        </Text>
                        <Text style={[styles.monthAmount, { color: colors.mutedForeground }]}>
                          Save {formatCurrency(month.monthlyAmount)}
                        </Text>
                      </View>

                      <View style={styles.monthStatus}>
                        <Text
                          style={[
                            styles.monthStatusText,
                            { color: saved ? colors.success : colors.mutedForeground },
                          ]}
                        >
                          {saved ? "Saved" : "Pending"}
                        </Text>
                        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 16, gap: 12 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  summaryCard: { gap: 14 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  programTitle: { fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 26 },
  summaryHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  programMetaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  rateBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  rateBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statGrid: { gap: 10 },
  statTile: { borderRadius: 12, padding: 14, gap: 4 },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  inlineLink: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineLinkText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  disclosureCard: { gap: 12 },
  disclosureHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  disclosureText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  noticeCard: { gap: 6 },
  noticeTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  noticeText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  progressHeader: { marginBottom: 8 },
  progressSubtext: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  progressCount: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 10 },
  monthCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  monthCheckbox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  monthContent: { flex: 1, gap: 2 },
  monthTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  monthAmount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  monthStatus: { flexDirection: "row", alignItems: "center", gap: 4 },
  monthStatusText: { fontSize: 12, fontFamily: "Inter_700Bold" },
});
