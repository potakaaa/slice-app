import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/useAppStore";

interface ToolItem {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  route: string;
  premium?: boolean;
  color: string;
}

const TOOLS: ToolItem[] = [
  {
    icon: "percent",
    title: "Settlement Calculator",
    description: "Calculate exactly what you'd owe at any settlement percentage",
    route: "/calculator",
    color: "#FF6B35",
  },
  {
    icon: "trending-up",
    title: "Monthly Savings Planner",
    description: "Find the right monthly savings to hit your timeline goals",
    route: "/savings-planner",
    color: "#22C55E",
  },
  {
    icon: "bar-chart-2",
    title: "Snowball Timeline",
    description: "See your full payoff schedule sorted smallest to largest",
    route: "/snowball",
    color: "#3B82F6",
  },
  {
    icon: "cpu",
    title: "AI Negotiation Strategy",
    description: "Get AI-powered guidance on how to approach each creditor",
    route: "/ai/strategy/first",
    premium: true,
    color: "#8B5CF6",
  },
  {
    icon: "file-text",
    title: "AI Negotiation Script",
    description: "Get a customized call script for your next creditor call",
    route: "/ai/script/first",
    premium: true,
    color: "#F59E0B",
  },
];

export default function ToolsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tier = useAppStore((s) => s.profile.tier);
  const creditors = useAppStore((s) => s.creditors);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : 84;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Tools</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Calculators, planners, and AI tools
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.section, { color: colors.mutedForeground }]}>FREE TOOLS</Text>
        {TOOLS.filter((t) => !t.premium).map((tool) => (
          <ToolCard
            key={tool.route}
            tool={tool}
            colors={colors}
            creditors={creditors}
          />
        ))}

        <Text style={[styles.section, { color: colors.mutedForeground }]}>AI TOOLS — SILVER+</Text>
        {TOOLS.filter((t) => t.premium).map((tool) => (
          <ToolCard
            key={tool.route}
            tool={tool}
            colors={colors}
            creditors={creditors}
            locked={tier === "free"}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function ToolCard({
  tool,
  colors,
  creditors,
  locked = false,
}: {
  tool: ToolItem;
  colors: ReturnType<typeof useColors>;
  creditors: any[];
  locked?: boolean;
}) {
  const handlePress = () => {
    if (locked) {
      router.push("/pricing");
      return;
    }
    if (creditors.length > 0) {
      if (tool.route.endsWith("first")) {
        router.push(tool.route.replace("first", creditors[0].id) as any);
      } else {
        router.push(tool.route as any);
      }
    } else {
      router.push(tool.route as any);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.toolCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.toolIcon, { backgroundColor: tool.color + "20" }]}>
        <Feather name={tool.icon} size={24} color={tool.color} />
      </View>
      <View style={styles.toolContent}>
        <View style={styles.toolTitleRow}>
          <Text style={[styles.toolTitle, { color: colors.foreground }]}>
            {tool.title}
          </Text>
          {locked && (
            <Feather name="lock" size={14} color={colors.mutedForeground} />
          )}
        </View>
        <Text style={[styles.toolDesc, { color: colors.mutedForeground }]}>
          {tool.description}
        </Text>
        {locked && (
          <Text style={[styles.upgradeHint, { color: colors.primary }]}>
            Upgrade to Silver to unlock
          </Text>
        )}
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  scroll: { padding: 16, gap: 10 },
  section: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 2,
  },
  toolCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  toolContent: { flex: 1, gap: 4 },
  toolTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  toolTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  toolDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  upgradeHint: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 2 },
});
