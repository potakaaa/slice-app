import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useColors } from "@/hooks/useColors";
import { celebrate } from "@/lib/celebrate";
import { integrationMessage } from "@/lib/integrationErrors";
import { useCreditors, useProfile, useRequestCoaching } from "@/lib/sliceData";
import {
  formatCurrency,
  getTotalDebt,
  getTotalSettlementTarget,
} from "@/utils/calculations";

const TOPICS = [
  "Debt settlement strategy",
  "What to say to creditors",
  "Reviewing my creditor list",
  "Understanding settlement timelines",
  "Budget and savings planning",
  "Preparing for negotiation calls",
  "Credit repair guidance",
  "General debt resolution guidance",
];

export default function CoachingScreen() {
  const colors = useColors();
  const { profile } = useProfile();
  const { creditors } = useCreditors();
  const requestCoaching = useRequestCoaching();

  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [schedulingUrl, setSchedulingUrl] = useState<string | null>(null);
  const [schedulingAvailable, setSchedulingAvailable] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const isGold = profile.tier === "gold" || profile.tier === "platinum";
  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 20;

  const totalDebt = getTotalDebt(creditors);
  const totalTarget = getTotalSettlementTarget(creditors);

  const handleSubmit = async () => {
    setSubmitError("");
    try {
      const result = await requestCoaching.mutateAsync({
        topic: selectedTopic,
        notes,
      });
      setSchedulingUrl(result.scheduling_url);
      setSchedulingAvailable(result.scheduling_available);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
      if (result.scheduling_url) {
        await WebBrowser.openBrowserAsync(result.scheduling_url);
      }
      // M24: a human is now in the loop — the highest-touch engagement. Warm
      // welcome voice (gratitude, not pride; never triggers a review ask), once.
      // Fired AFTER the Calendly browser closes so the confetti lands on the
      // success card the user returns to, not hidden behind the browser.
      celebrate("coaching_booked", { once: true });
    } catch (error) {
      setSubmitError(integrationMessage(error, "The coaching request could not be submitted."));
    }
  };

  const reopenScheduling = async () => {
    if (!schedulingUrl) return;
    try {
      await WebBrowser.openBrowserAsync(schedulingUrl);
    } catch (error) {
      setSubmitError(integrationMessage(error, "The scheduling page could not be opened."));
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Marc Feinberg card */}
        <View style={[styles.marcCard, { backgroundColor: colors.primary }]}>
          <View style={[styles.marcAvatar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Feather name="user" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.marcName}>Marc Feinberg</Text>
          <Text style={styles.marcTitle}>Founder · Debt Coach · Author</Text>
          <Text style={styles.marcBio}>
            Marc has spent over a decade helping Americans navigate debt resolution without paying
            big settlement companies. He is the founder of SLICE, author of "The Debt Freedom
            Blueprint," and a passionate advocate for financial empowerment.
          </Text>
        </View>

        {!isGold ? (
          <UpgradePrompt
            requiredTier="gold"
            feature="1-on-1 Coaching with Marc Feinberg"
            description="Book a private coaching session to walk through your creditor list, discuss your negotiation strategy, and get personalized guidance from Marc himself. Available on Gold and Platinum plans."
          />
        ) : submitted ? (
          <Card style={styles.successCard}>
            <View style={[styles.successIcon, { backgroundColor: "#DCFCE7" }]}>
              <Feather name="check-circle" size={40} color="#16A34A" />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>
              Request Submitted!
            </Text>
            <Text style={[styles.successDesc, { color: colors.mutedForeground }]}>
              {schedulingAvailable
                ? "Your request is saved. Choose a time in Calendly to complete scheduling."
                : "Your request is saved. Marc's team will follow up by email because online scheduling is currently unavailable."}
            </Text>
            <Text style={[styles.successTopic, { color: colors.primary }]}>
              Topic: {selectedTopic}
            </Text>
            {schedulingUrl && (
              <Button label="Open Calendly Scheduling" onPress={reopenScheduling} fullWidth />
            )}
            {submitError ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{submitError}</Text>
            ) : null}
          </Card>
        ) : (
          <>
            {/* Debt summary prefill */}
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Your Debt Summary (Pre-filled)
              </Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                    Total Debt
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                    {formatCurrency(totalDebt)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                    Settlement Target
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.primary }]}>
                    {formatCurrency(totalTarget)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                    Creditors
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                    {creditors.length}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Topic selector */}
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Session Topic
              </Text>
              {TOPICS.map((topic) => (
                <Pressable
                  key={topic}
                  onPress={() => setSelectedTopic(topic)}
                  style={[
                    styles.topicBtn,
                    {
                      borderColor:
                        selectedTopic === topic ? colors.primary : colors.border,
                      backgroundColor:
                        selectedTopic === topic ? colors.secondary : colors.card,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.topicText,
                      {
                        color:
                          selectedTopic === topic ? colors.primary : colors.foreground,
                      },
                    ]}
                  >
                    {topic}
                  </Text>
                  {selectedTopic === topic && (
                    <Feather name="check" size={16} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </Card>

            {/* Notes */}
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Questions / Notes for Marc
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="What would you like to discuss or ask? Any specific creditors you want to review?"
                placeholderTextColor={colors.mutedForeground}
                multiline
                style={[
                  styles.notesInput,
                  { color: colors.foreground, borderColor: colors.border },
                ]}
              />
            </Card>

            <Button
              label="Request Coaching Session"
              onPress={handleSubmit}
              loading={requestCoaching.isPending}
              fullWidth
            />
            {submitError ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{submitError}</Text>
            ) : null}
          </>
        )}

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Coaching sessions are for educational guidance only and do not constitute legal, tax,
          credit, or financial advice from a licensed professional. Results are not guaranteed.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  marcCard: { borderRadius: 16, padding: 24, alignItems: "center", gap: 8 },
  marcAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  marcName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  marcTitle: { fontSize: 13, color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  marcBio: {
    fontSize: 13,
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-around" },
  summaryItem: { alignItems: "center", gap: 4 },
  summaryLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  summaryValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  topicBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  topicText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    minHeight: 100,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
  },
  successCard: { alignItems: "center", gap: 12, padding: 24 },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  successDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  successTopic: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  errorText: { fontSize: 12, fontFamily: "Inter_500Medium", textAlign: "center", lineHeight: 18 },
  disclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16 },
});
