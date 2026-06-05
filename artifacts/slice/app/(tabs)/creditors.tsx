import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CreditorCard } from "@/components/CreditorCard";
import { EmptyState } from "@/components/EmptyState";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/useAppStore";
import { getSortedBySnowball, getTotalDebt, formatCurrency } from "@/utils/calculations";

export default function CreditorsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const creditors = useAppStore((s) => s.creditors);
  const [search, setSearch] = useState("");

  const sorted = getSortedBySnowball(creditors);
  const filtered = sorted.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const total = getTotalDebt(creditors);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : 84;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Creditors</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {creditors.length} creditor{creditors.length !== 1 ? "s" : ""} ·{" "}
              {formatCurrency(total)} total
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/creditor/add")}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={[styles.searchBar, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search creditors..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {creditors.length === 0 ? (
        <EmptyState
          icon="credit-card"
          title="No creditors yet"
          description="Add creditors to start building your debt settlement program."
          actionLabel="Add First Creditor"
          onAction={() => router.push("/creditor/add")}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="search"
          title="No results"
          description={`No creditor matches "${search}"`}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <CreditorCard
              creditor={item}
              rank={index + 1}
              showProgress
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.listHeader, { color: colors.mutedForeground }]}>
              Sorted by snowball priority (lowest balance first)
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    height: 42,
  },
  list: { padding: 16 },
  listHeader: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
    textAlign: "center",
  },
});
