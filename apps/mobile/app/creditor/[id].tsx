import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Badge, StatusBadge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { ProgressBar } from "@/components/ProgressBar";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useColors } from "@/hooks/useColors";
import { hapticSelection } from "@/lib/haptics";
import { maybeRequestReview } from "@/lib/reviewPrompt";
import {
  useContactLogs,
  useCreditors,
  useDeleteCreditor,
  useNegotiationScripts,
  useProfile,
  useUpdateCreditor,
} from "@/lib/sliceData";
import { useAppStore } from "@/store/useAppStore";
import {
  calcProgramLength,
  calcSettledAmount,
  calcTargetDate,
  formatCurrency,
  formatPct,
  getAISuggestedOffer,
  OUTCOME_LABELS,
} from "@/utils/calculations";
import type { CreditorStatus } from "@/types";

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const SETTLEMENT_OPTIONS = [0.3, 0.4, 0.5, 0.6, 0.7];
const STATUS_OPTIONS: { value: CreditorStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "negotiating", label: "Negotiating" },
  { value: "settled", label: "Settled" },
];

export default function CreditorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { creditors } = useCreditors();
  const { profile } = useProfile();
  const { contactLogs } = useContactLogs(id);
  const { scripts } = useNegotiationScripts(id);
  const updateCreditor = useUpdateCreditor();
  const deleteCreditor = useDeleteCreditor();

  const recordHappyMoment = useAppStore((s) => s.recordHappyMoment);
  const creditor = creditors.find((c) => c.id === id);
  const [notes, setNotes] = useState(creditor?.notes ?? "");
  const [celebrate, setCelebrate] = useState(false);
  const [expandedScript, setExpandedScript] = useState<string | null>(null);
  const topPad = Platform.OS === "web" ? 67 : 0;
  const isSilver = profile.tier !== "free";

  if (!creditor) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.foreground }]}>
          Creditor not found
        </Text>
      </SafeAreaView>
    );
  }

  const settled = calcSettledAmount(creditor.balance, creditor.settlementPercentage);
  const months = calcProgramLength(settled, creditor.monthlySavings);
  const targetDate = calcTargetDate(months);
  const aiOffer = getAISuggestedOffer(creditor.balance);
  const aiOfferAmt = creditor.balance * aiOffer;
  const offerProgress = settled > 0 ? Math.min(1, profile.currentSavedCash / settled) : 1;
  const lastLog = contactLogs[0];

  const handleDelete = () => {
    Alert.alert(
      "Delete Creditor",
      `Remove ${creditor.name} from your program?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteCreditor.mutateAsync(creditor.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleNotesChange = (text: string) => {
    setNotes(text);
    updateCreditor.mutate({ id: creditor.id, updates: { notes: text } });
  };

  // Pillar 3 (Emotional Connection): settling a creditor is a real
  // accomplishment — celebrate it, then ask happy users for a review.
  const handleStatusChange = (status: CreditorStatus) => {
    if (status === creditor.status) return;
    const becameSettled = status === "settled" && creditor.status !== "settled";
    updateCreditor.mutate({ id: creditor.id, updates: { status } });
    if (becameSettled) {
      recordHappyMoment();
      setCelebrate(true);
    } else {
      hapticSelection();
    }
  };

  const handleCelebrationDone = () => {
    setCelebrate(false);
    // Fire at peak positive emotion; all gating lives in maybeRequestReview.
    void maybeRequestReview();
  };

  const bottomPad = Platform.OS === "web" ? 34 : 16;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={styles.heroHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{creditor.name}</Text>
              {creditor.phone ? (
                <Text style={styles.heroPhone}>{creditor.phone}</Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => router.push(`/creditor/edit/${creditor.id}`)}
              style={styles.editBtn}
              hitSlop={8}
            >
              <Feather name="edit-2" size={14} color="#FF5A00" />
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          </View>
          <Text style={styles.heroAmount}>{formatCurrency(creditor.balance)}</Text>
          <Text style={styles.heroLabel}>Total Balance Owed</Text>
        </View>

        {/* Status selector */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            STATUS
          </Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((s) => (
              <Pressable
                key={s.value}
                onPress={() => handleStatusChange(s.value)}
                style={[
                  styles.statusBtn,
                  {
                    backgroundColor:
                      creditor.status === s.value ? colors.primary : colors.muted,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        creditor.status === s.value ? "#FFFFFF" : colors.foreground,
                    },
                  ]}
                >
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Program card */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            YOUR PROGRAM
          </Text>
          <View style={styles.programGrid}>
            <View style={styles.programItem}>
              <Text style={[styles.programLabel, { color: colors.mutedForeground }]}>Balance</Text>
              <Text style={[styles.programValue, { color: colors.foreground }]}>
                {formatCurrency(creditor.balance)}
              </Text>
            </View>
            <View style={styles.programItem}>
              <Text style={[styles.programLabel, { color: colors.mutedForeground }]}>Target ({formatPct(creditor.settlementPercentage)})</Text>
              <Text style={[styles.programValue, { color: colors.primary }]}>
                {formatCurrency(settled)}
              </Text>
            </View>
            <View style={styles.programItem}>
              <Text style={[styles.programLabel, { color: colors.mutedForeground }]}>Monthly Savings</Text>
              <Text style={[styles.programValue, { color: colors.foreground }]}>
                {formatCurrency(creditor.monthlySavings)}
              </Text>
            </View>
            <View style={styles.programItem}>
              <Text style={[styles.programLabel, { color: colors.mutedForeground }]}>Program Length</Text>
              <Text style={[styles.programValue, { color: colors.foreground }]}>
                {months} months
              </Text>
            </View>
          </View>
          <View style={styles.targetDate}>
            <Feather name="calendar" size={14} color={colors.mutedForeground} />
            <Text style={[styles.targetDateText, { color: colors.mutedForeground }]}>
              Estimated target: {targetDate}
            </Text>
          </View>

          {/* Settlement % */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 12 }]}>
            SETTLEMENT TARGET
          </Text>
          <View style={styles.pctRow}>
            {SETTLEMENT_OPTIONS.map((pct) => (
              <Pressable
                key={pct}
                onPress={() => updateCreditor.mutate({ id: creditor.id, updates: { settlementPercentage: pct } })}
                style={[
                  styles.pctBtn,
                  {
                    backgroundColor:
                      creditor.settlementPercentage === pct ? colors.primary : colors.muted,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pctText,
                    {
                      color:
                        creditor.settlementPercentage === pct ? "#FFFFFF" : colors.foreground,
                    },
                  ]}
                >
                  {formatPct(pct)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* AI hint */}
        <Card style={[styles.aiCard, { backgroundColor: "#F5F3FF", borderColor: "#8B5CF6" }]}>
          <View style={styles.aiHeader}>
            <Feather name="cpu" size={18} color="#8B5CF6" />
            <Text style={[styles.aiTitle, { color: "#7C3AED" }]}>AI Suggested First Offer</Text>
          </View>
          <Text style={[styles.aiOffer, { color: "#7C3AED" }]}>
            {formatCurrency(aiOfferAmt)} ({formatPct(aiOffer)})
          </Text>
          <Text style={[styles.aiDesc, { color: "#6D28D9" }]}>
            Based on your balance of {formatCurrency(creditor.balance)}, starting with a{" "}
            {formatPct(aiOffer)} offer gives you negotiating room to settle around{" "}
            {formatPct(creditor.settlementPercentage)}.
          </Text>
          <Button
            label="Get Full AI Strategy"
            onPress={() => router.push(`/ai/strategy/${creditor.id}`)}
            style={styles.aiBtn}
          />
        </Card>

        {/* Progress toward this offer */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            PROGRESS TOWARD THIS OFFER
          </Text>
          <ProgressBar progress={offerProgress} />
          <View style={styles.progressRow}>
            <Text style={[styles.progressCaption, { color: colors.mutedForeground }]}>
              Saved {formatCurrency(profile.currentSavedCash)} of {formatCurrency(settled)}
            </Text>
            <Pressable onPress={() => router.push("/add-to-fund" as any)} hitSlop={8}>
              <Text style={[styles.link, { color: colors.primary }]}>+ Add to fund</Text>
            </Pressable>
          </View>
        </Card>

        {/* Contact log */}
        <Card>
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginBottom: 0 }]}>
              LAST CONTACT
            </Text>
            <Pressable
              onPress={() => router.push(`/creditor/log-call/${creditor.id}` as any)}
              hitSlop={8}
            >
              <Text style={[styles.link, { color: colors.primary }]}>Log call</Text>
            </Pressable>
          </View>

          {lastLog ? (
            <View style={styles.logBlock}>
              <Text style={[styles.logOutcome, { color: colors.foreground }]}>
                {OUTCOME_LABELS[lastLog.outcome]}
              </Text>
              <Text style={[styles.logMeta, { color: colors.mutedForeground }]}>
                {formatShortDate(lastLog.contactDate)}
                {lastLog.amountOffered ? ` · offered ${formatCurrency(lastLog.amountOffered)}` : ""}
              </Text>
              {lastLog.notes ? (
                <Text style={[styles.logNotes, { color: colors.foreground }]}>{lastLog.notes}</Text>
              ) : null}
              {lastLog.followUpDate ? (
                <Text style={[styles.logFollowUp, { color: colors.primary }]}>
                  Follow up by {formatShortDate(lastLog.followUpDate)}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
              No calls logged yet. Tap “Log call” after your next creditor call.
            </Text>
          )}
        </Card>

        {/* Full call history (Silver) */}
        {contactLogs.length > 1 &&
          (isSilver ? (
            <Card>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                CALL HISTORY
              </Text>
              {contactLogs.slice(1).map((log) => (
                <View key={log.id} style={[styles.historyRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.logOutcome, { color: colors.foreground }]}>
                    {OUTCOME_LABELS[log.outcome]}
                  </Text>
                  <Text style={[styles.logMeta, { color: colors.mutedForeground }]}>
                    {formatShortDate(log.contactDate)}
                    {log.amountOffered ? ` · offered ${formatCurrency(log.amountOffered)}` : ""}
                  </Text>
                  {log.notes ? (
                    <Text style={[styles.logNotes, { color: colors.foreground }]}>{log.notes}</Text>
                  ) : null}
                </View>
              ))}
            </Card>
          ) : (
            <UpgradePrompt
              requiredTier="silver"
              feature="Full call history"
              description="See every logged call with this creditor. Available on the Silver plan."
            />
          ))}

        {/* Script history (Silver) */}
        {!isSilver ? (
          <UpgradePrompt
            requiredTier="silver"
            feature="Script history"
            description="Save and revisit every AI call script you generate. Available on the Silver plan."
          />
        ) : (
          <Card>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              SCRIPT HISTORY
            </Text>
            {scripts.length === 0 ? (
              <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
                No saved scripts yet. Generate one from “AI Negotiation Script” below.
              </Text>
            ) : (
              scripts.map((script) => {
                const open = expandedScript === script.id;
                return (
                  <View key={script.id} style={[styles.historyRow, { borderTopColor: colors.border }]}>
                    <Pressable
                      onPress={() => setExpandedScript(open ? null : script.id)}
                      style={styles.scriptHeader}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.logOutcome, { color: colors.foreground }]}>
                          {script.tone.charAt(0).toUpperCase() + script.tone.slice(1)} script
                        </Text>
                        <Text style={[styles.logMeta, { color: colors.mutedForeground }]}>
                          {formatShortDate(script.createdAt)}
                        </Text>
                      </View>
                      <Feather
                        name={open ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={colors.mutedForeground}
                      />
                    </Pressable>
                    {open &&
                      Object.entries(script.sections).map(([key, value]) => (
                        <View key={key} style={styles.scriptSection}>
                          <Text style={[styles.scriptSectionTitle, { color: colors.primary }]}>
                            {key.replaceAll("_", " ")}
                          </Text>
                          <Text style={[styles.scriptSectionText, { color: colors.foreground }]}>
                            {value}
                          </Text>
                        </View>
                      ))}
                  </View>
                );
              })
            )}
          </Card>
        )}

        {/* Notes */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            NOTES
          </Text>
          <TextInput
            value={notes}
            onChangeText={handleNotesChange}
            placeholder="Add call notes, next steps, or reminders..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[styles.notesInput, { color: colors.foreground, borderColor: colors.border }]}
          />
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label="AI Negotiation Strategy"
            onPress={() => router.push(`/ai/strategy/${creditor.id}`)}
            fullWidth
          />
          <Button
            label="AI Negotiation Script"
            variant="secondary"
            onPress={() => router.push(`/ai/script/${creditor.id}`)}
            fullWidth
          />
          <Button
            label="Delete Creditor"
            variant="destructive"
            onPress={handleDelete}
            fullWidth
          />
        </View>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          SLICE does not guarantee that any creditor will accept a settlement offer.
          Always get agreements in writing before making any payment.
        </Text>
      </ScrollView>

      <CelebrationOverlay
        visible={celebrate}
        title="Debt Settled!"
        message={`${creditor.name} is marked settled — you're one step closer to debt-free.`}
        onDone={handleCelebrationDone}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { gap: 12, padding: 16 },
  notFound: { padding: 20, fontSize: 16, fontFamily: "Inter_400Regular" },
  hero: {
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  heroName: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  heroPhone: { fontSize: 13, color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  heroAmount: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  heroLabel: { fontSize: 12, color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  statusRow: { flexDirection: "row", gap: 8 },
  statusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  statusText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  programGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  programItem: { width: "47%", gap: 3 },
  programLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  programValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  targetDate: { flexDirection: "row", gap: 6, alignItems: "center" },
  targetDateText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  pctRow: { flexDirection: "row", gap: 8 },
  pctBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
  },
  pctText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  aiCard: { borderWidth: 1.5, gap: 8 },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  aiOffer: { fontSize: 26, fontFamily: "Inter_700Bold" },
  aiDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  aiBtn: { backgroundColor: "#8B5CF6", marginTop: 4 },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
  },
  actions: { gap: 10 },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    gap: 12,
  },
  progressCaption: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  link: { fontSize: 13, fontFamily: "Inter_700Bold" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  logBlock: { gap: 3 },
  logOutcome: { fontSize: 15, fontFamily: "Inter_700Bold" },
  logMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  logNotes: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginTop: 2 },
  logFollowUp: { fontSize: 12, fontFamily: "Inter_700Bold", marginTop: 2 },
  emptyHint: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  historyRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 10,
    gap: 3,
  },
  scriptHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  scriptSection: { marginTop: 8, gap: 3 },
  scriptSectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "capitalize",
    letterSpacing: 0.3,
  },
  scriptSectionText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FF5A00" },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
  },
});
