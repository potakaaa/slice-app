import { Feather } from "@expo/vector-icons";
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
import * as Haptics from "expo-haptics";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/useAppStore";
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
  const { profile, creditors, addBooking } = useAppStore((s) => ({
    profile: s.profile,
    creditors: s.creditors,
    addBooking: s.addBooking,
  }));

  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isGold = profile.tier === "gold" || profile.tier === "platinum";
  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 20;

  const totalDebt = getTotalDebt(creditors);
  const totalTarget = getTotalSettlementTarget(creditors);

  const handleSubmit = () => {
    addBooking({
      topic: selectedTopic,
      notes,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
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
              Marc's team will reach out within 1-2 business days to confirm your session.
              Watch your email for a calendar invite.
            </Text>
            <Text style={[styles.successTopic, { color: colors.primary }]}>
              Topic: {selectedTopic}
            </Text>
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
              fullWidth
            />
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
  marcTitle: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_500Medium" },
  marcBio: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_400Regular",
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
  disclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16 },
});
