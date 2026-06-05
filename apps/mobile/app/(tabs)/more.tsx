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

import { TierBadge } from "@/components/TierBadge";
import { useColors } from "@/hooks/useColors";
import { useProfile } from "@/lib/sliceData";

interface MenuItem {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  route: string;
  desc?: string;
  premium?: boolean;
}

const MENU_GROUPS: { title: string; items: MenuItem[] }[] = [
  {
    title: "Resources",
    items: [
      { icon: "shield", label: "Credit Repair", route: "/credit-repair", desc: "Checklist, dispute letters, score tracking" },
      { icon: "calendar", label: "Coaching with Marc", route: "/coaching", desc: "1-on-1 debt resolution sessions", premium: true },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: "zap", label: "Upgrade Plan", route: "/pricing", desc: "Silver, Gold, and Platinum plans" },
      { icon: "user", label: "Profile & Settings", route: "/profile", desc: "Edit your info and preferences" },
    ],
  },
  {
    title: "Legal",
    items: [
      { icon: "file-text", label: "Legal Disclaimer", route: "/legal", desc: "Important disclosures about SLICE" },
      { icon: "lock", label: "Privacy Policy", route: "/privacy-policy", desc: "How we collect and protect your data" },
      { icon: "clipboard", label: "Terms and Conditions", route: "/terms", desc: "Your rights and responsibilities" },
    ],
  },
];

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = 84;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>More</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile row */}
        <Pressable
          onPress={() => router.push("/profile")}
          style={({ pressed }) => [
            styles.profileRow,
            { borderBottomColor: colors.border, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {profile.name ? profile.name.charAt(0).toUpperCase() : "S"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>
              {profile.name || "SLICE User"}
            </Text>
            <TierBadge tier={profile.tier} />
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>

        {/* Menu groups */}
        {MENU_GROUPS.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>
              {group.title.toUpperCase()}
            </Text>
            <View style={[styles.groupCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
              {group.items.map((item, i) => (
                <React.Fragment key={item.route}>
                  <Pressable
                    onPress={() => router.push(item.route as any)}
                    style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Feather name={item.icon} size={18} color={colors.primary} style={styles.menuIcon} />
                    <View style={styles.menuContent}>
                      <View style={styles.menuLabelRow}>
                        <Text style={[styles.menuLabel, { color: colors.foreground }]}>
                          {item.label}
                        </Text>
                        {item.premium && (
                          <View style={[styles.premiumTag, { backgroundColor: colors.secondary }]}>
                            <Text style={[styles.premiumText, { color: colors.primary }]}>SILVER+</Text>
                          </View>
                        )}
                      </View>
                      {item.desc && (
                        <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>
                          {item.desc}
                        </Text>
                      )}
                    </View>
                    <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                  </Pressable>
                  {i < group.items.length - 1 && (
                    <View style={[styles.separator, { backgroundColor: colors.border }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          SLICE v1.0.0
        </Text>
      </ScrollView>
    </View>
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
  scroll: { gap: 20 },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 18, fontFamily: "Inter_700Bold" },
  profileInfo: { flex: 1, gap: 5 },
  profileName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  group: { gap: 8, paddingHorizontal: 16 },
  groupTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  groupCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    gap: 14,
  },
  menuIcon: { width: 20 },
  menuContent: { flex: 1, gap: 2 },
  menuLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  menuLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  premiumTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  premiumText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  menuDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 48 },
  version: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", paddingBottom: 8 },
});
