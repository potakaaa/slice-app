import { Feather } from "@expo/vector-icons";
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

import { Card } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/useAppStore";

const CATEGORIES = ["All", "Report", "Dispute", "Settlement", "Documentation", "Monitoring", "Planning"];

export default function CreditRepairScreen() {
  const colors = useColors();
  const creditRepairTasks = useAppStore((s) => s.creditRepairTasks);
  const toggleRepairTask = useAppStore((s) => s.toggleRepairTask);
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [selectedCat, setSelectedCat] = useState("All");
  const [scoreInput, setScoreInput] = useState(
    profile.creditScore > 0 ? String(profile.creditScore) : ""
  );

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 20;

  const filtered =
    selectedCat === "All"
      ? creditRepairTasks
      : creditRepairTasks.filter((t) => t.category === selectedCat);

  const completed = creditRepairTasks.filter((t) => t.completed).length;
  const progress = creditRepairTasks.length > 0 ? completed / creditRepairTasks.length : 0;

  const handleScoreUpdate = () => {
    const score = Number(scoreInput);
    if (score > 0 && score <= 850) {
      updateProfile({ creditScore: score });
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Credit score tracker */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Credit Score Tracker
          </Text>
          <View style={styles.scoreRow}>
            <View style={[styles.scoreDisplay, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.scoreNum, { color: colors.primary }]}>
                {profile.creditScore > 0 ? profile.creditScore : "—"}
              </Text>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>/ 850</Text>
            </View>
            <View style={styles.scoreInput}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Update Score</Text>
              <View style={[styles.inputRow, { borderColor: colors.border }]}>
                <TextInput
                  value={scoreInput}
                  onChangeText={setScoreInput}
                  placeholder="Enter score"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  maxLength={3}
                  style={[styles.input, { color: colors.foreground }]}
                />
                <Pressable
                  onPress={handleScoreUpdate}
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.saveBtnText}>Save</Text>
                </Pressable>
              </View>
              {profile.creditScore > 0 && (
                <Text style={[styles.scoreRange, { color: colors.mutedForeground }]}>
                  {profile.creditScore < 580
                    ? "Poor (300-579)"
                    : profile.creditScore < 670
                      ? "Fair (580-669)"
                      : profile.creditScore < 740
                        ? "Good (670-739)"
                        : "Very Good (740+)"}
                </Text>
              )}
            </View>
          </View>
        </Card>

        {/* Checklist progress */}
        <Card>
          <View style={styles.progressHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Credit Repair Checklist
            </Text>
            <Text style={[styles.progressCount, { color: colors.primary }]}>
              {completed}/{creditRepairTasks.length}
            </Text>
          </View>
          <ProgressBar progress={progress} height={8} />
          <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
            {Math.round(progress * 100)}% complete
          </Text>
        </Card>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setSelectedCat(cat)}
              style={[
                styles.catBtn,
                {
                  backgroundColor: selectedCat === cat ? colors.primary : colors.muted,
                },
              ]}
            >
              <Text
                style={[
                  styles.catText,
                  { color: selectedCat === cat ? "#FFFFFF" : colors.foreground },
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Tasks */}
        {filtered.map((task) => (
          <Pressable key={task.id} onPress={() => toggleRepairTask(task.id)}>
            <View
              style={[
                styles.taskCard,
                {
                  backgroundColor: colors.card,
                  borderColor: task.completed ? colors.success : colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: task.completed ? colors.success : "transparent",
                    borderColor: task.completed ? colors.success : colors.border,
                  },
                ]}
              >
                {task.completed && (
                  <Feather name="check" size={14} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.taskContent}>
                <Text
                  style={[
                    styles.taskText,
                    {
                      color: task.completed ? colors.mutedForeground : colors.foreground,
                      textDecorationLine: task.completed ? "line-through" : "none",
                    },
                  ]}
                >
                  {task.task}
                </Text>
                <View style={[styles.catTag, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.catTagText, { color: colors.primary }]}>{task.category}</Text>
                </View>
              </View>
            </View>
          </Pressable>
        ))}

        {/* Education section */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Rebuilding Credit After Settlement
          </Text>
          {[
            { icon: "clock", text: "Negative items typically remain on credit reports for 7 years, but their impact decreases over time." },
            { icon: "credit-card", text: "A secured credit card can help rebuild credit — use it for small purchases and pay in full each month." },
            { icon: "check-circle", text: "Becoming an authorized user on a family member's account can boost your score." },
            { icon: "trending-up", text: "On-time payments are the single most important factor — even one late payment can set you back significantly." },
            { icon: "file-text", text: "Monitor your credit report monthly for errors or accounts that should have been updated after settlement." },
          ].map((item, i) => (
            <View key={i} style={styles.educationItem}>
              <Feather name={item.icon as any} size={16} color={colors.primary} />
              <Text style={[styles.educationText, { color: colors.foreground }]}>{item.text}</Text>
            </View>
          ))}
        </Card>

        {/* Dispute letter placeholder */}
        <Card style={[styles.comingSoon, { borderColor: colors.primary }]}>
          <View style={styles.comingSoonHeader}>
            <Feather name="edit" size={20} color={colors.primary} />
            <Text style={[styles.comingSoonTitle, { color: colors.foreground }]}>
              AI Dispute Letter Generator
            </Text>
            <View style={[styles.comingSoonTag, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.comingSoonTagText, { color: colors.primary }]}>COMING SOON</Text>
            </View>
          </View>
          <Text style={[styles.comingSoonDesc, { color: colors.mutedForeground }]}>
            Generate personalized credit dispute letters for each bureau. Available in a future
            update for Gold and Platinum members.
          </Text>
        </Card>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          SLICE does not provide legal credit repair services or guarantee credit score
          improvement. Consult a licensed credit counselor or attorney for professional advice.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 10 },
  scoreRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  scoreDisplay: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNum: { fontSize: 28, fontFamily: "Inter_700Bold" },
  scoreLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  scoreInput: { flex: 1, gap: 8 },
  inputLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  inputRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    height: 44,
  },
  input: { flex: 1, paddingHorizontal: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  saveBtn: {
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: "#FFFFFF", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  scoreRange: { fontSize: 12, fontFamily: "Inter_400Regular" },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
  },
  progressCount: { fontSize: 16, fontFamily: "Inter_700Bold" },
  progressLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 6 },
  catRow: { gap: 8 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  catText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  taskCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  taskContent: { flex: 1, gap: 6 },
  taskText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  catTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catTagText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  educationItem: { flexDirection: "row", gap: 10, marginBottom: 12, alignItems: "flex-start" },
  educationText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  comingSoon: { borderWidth: 1.5, gap: 8 },
  comingSoonHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  comingSoonTitle: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  comingSoonTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  comingSoonTagText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  comingSoonDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  disclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16 },
});
