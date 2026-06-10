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
import { useCreditors, useProfile } from "@/lib/sliceData";

interface ToolItem {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  route: string;
  premium?: boolean;
}

const TOOLS: ToolItem[] = [
  {
    icon: "percent",
    title: "Settlement Calculator",
    description: "Calculate what you'd owe at any settlement percentage",
    route: "/calculator",
  },
  {
    icon: "sliders",
    title: "What-If Simulator",
    description: "See how changing your monthly savings moves your settlement date",
    route: "/what-if",
  },
  {
    icon: "trending-up",
    title: "Savings Planner",
    description: "Find the monthly savings amount to hit your timeline",
    route: "/savings-planner",
  },
  {
    icon: "bar-chart-2",
    title: "Snowball Timeline",
    description: "Full payoff schedule sorted smallest balance first",
    route: "/snowball",
  },
  {
    icon: "cpu",
    title: "AI Negotiation Strategy",
    description: "AI-powered guidance tailored to each creditor",
    route: "/ai/strategy/first",
    premium: true,
  },
  {
    icon: "file-text",
    title: "AI Call Script",
    description: "Customized call script for your next creditor call",
    route: "/ai/script/first",
    premium: true,
  },
];

export default function ToolsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { creditors } = useCreditors();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = 84;
  const isLocked = profile.tier === "free";

  const handlePress = (tool: ToolItem) => {
    if (tool.premium && isLocked) {
      router.push("/pricing");
      return;
    }
    if (tool.route.endsWith("first") && creditors.length > 0) {
      router.push(tool.route.replace("first", creditors[0].id) as any);
    } else {
      router.push(tool.route as any);
    }
  };

  const freeTools = TOOLS.filter((t) => !t.premium);
  const premiumTools = TOOLS.filter((t) => t.premium);

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
        <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>FREE</Text>
        {freeTools.map((tool) => (
          <ToolRow
            key={tool.route}
            tool={tool}
            colors={colors}
            onPress={() => handlePress(tool)}
          />
        ))}

        <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>AI TOOLS · SILVER+</Text>
        {premiumTools.map((tool) => (
          <ToolRow
            key={tool.route}
            tool={tool}
            colors={colors}
            locked={isLocked}
            onPress={() => handlePress(tool)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function ToolRow({
  tool,
  colors,
  locked = false,
  onPress,
}: {
  tool: ToolItem;
  colors: ReturnType<typeof useColors>;
  locked?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
        <Feather
          name={tool.icon}
          size={20}
          color={locked ? colors.mutedForeground : colors.primary}
        />
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowTitleLine}>
          <Text style={[styles.rowTitle, { color: locked ? colors.mutedForeground : colors.foreground }]}>
            {tool.title}
          </Text>
          {locked && <Feather name="lock" size={13} color={colors.mutedForeground} />}
        </View>
        <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
          {tool.description}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  scroll: { paddingTop: 8 },
  groupLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1, gap: 3 },
  rowTitleLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  rowDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
});
