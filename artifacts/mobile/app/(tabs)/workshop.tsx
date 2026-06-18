import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { INVENTIONS } from "@/constants/inventions";
import { SOLAR_SYSTEM } from "@/constants/planets";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

type FilterTab = "all" | "t1" | "t2" | "t3" | "t4" | "crafted";

const GEM_PLANETS = SOLAR_SYSTEM.filter((b) => b.gem);

const TIER_COLORS: Record<number, string> = {
  1: "#4CAF50",
  2: "#2196F3",
  3: "#9C27B0",
  4: "#FF9800",
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "t1", label: "Tier 1" },
  { key: "t2", label: "Tier 2" },
  { key: "t3", label: "Tier 3" },
  { key: "t4", label: "Tier 4" },
  { key: "crafted", label: "✓ Crafted" },
];

function effectLabel(effect: { starCoinsPerHour?: number; multiplier?: number; coinsPerAnswer?: number }): string {
  const parts: string[] = [];
  if (effect.starCoinsPerHour) parts.push(`+${effect.starCoinsPerHour} 🪙/hr`);
  if (effect.multiplier) parts.push(`×${effect.multiplier.toFixed(2)} pts`);
  if (effect.coinsPerAnswer) parts.push(`+${effect.coinsPerAnswer} 🪙/answer`);
  return parts.join("  ·  ");
}

export default function WorkshopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gameData, craftInvention, getLevel } = useGame();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [justCrafted, setJustCrafted] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const playerLevel = getLevel(gameData.points);

  const craftedInventions = gameData.craftedInventions ?? [];

  const filteredInventions = INVENTIONS.filter((inv) => {
    if (filter === "crafted") return craftedInventions.includes(inv.id);
    if (filter === "t1") return inv.tier === 1;
    if (filter === "t2") return inv.tier === 2;
    if (filter === "t3") return inv.tier === 3;
    if (filter === "t4") return inv.tier === 4;
    return true;
  });

  const handleCraft = (id: string) => {
    const success = craftInvention(id);
    if (success) {
      setJustCrafted(id);
      setTimeout(() => setJustCrafted(null), 1500);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 12, paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.card }]}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Workshop</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {craftedInventions.length}/{INVENTIONS.length} crafted
            </Text>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: colors.primary + "22" }]}>
            <Text style={[styles.levelBadgeText, { color: colors.primary }]}>Lv {playerLevel}</Text>
          </View>
        </View>

        {/* Stone Inventory */}
        <View style={[styles.stonePanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.stonePanelTitle, { color: colors.mutedForeground }]}>YOUR STONES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stoneRow}>
            {GEM_PLANETS.map((planet) => {
              const count = gameData.planetGems[planet.id] ?? 0;
              return (
                <View
                  key={planet.id}
                  style={[
                    styles.stoneChip,
                    {
                      backgroundColor: count > 0 ? colors.background : colors.secondary,
                      borderColor: count > 0 ? colors.primary + "55" : colors.border,
                      opacity: count > 0 ? 1 : 0.4,
                    },
                  ]}
                >
                  <Text style={styles.stoneEmoji}>{planet.gem}</Text>
                  <Text style={[styles.stoneCount, { color: count > 0 ? colors.foreground : colors.mutedForeground }]}>
                    ×{count}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                {
                  backgroundColor: filter === tab.key ? colors.primary : colors.card,
                  borderColor: filter === tab.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFilter(tab.key)}
            >
              <Text style={[styles.tabText, { color: filter === tab.key ? "#fff" : colors.mutedForeground }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Invention Cards */}
        <View style={styles.cardList}>
          {filteredInventions.length === 0 && (
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {filter === "crafted" ? "No inventions crafted yet." : "No inventions here."}
              </Text>
            </View>
          )}

          {filteredInventions.map((inv) => {
            const isCrafted = craftedInventions.includes(inv.id);
            const isLocked = playerLevel < inv.levelRequired;
            const tierColor = TIER_COLORS[inv.tier];

            const canCraft =
              !isLocked &&
              !isCrafted &&
              Object.entries(inv.recipe).every(
                ([planetId, needed]) => (gameData.planetGems[planetId] ?? 0) >= needed
              );

            return (
              <View
                key={inv.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: isCrafted ? tierColor + "99" : colors.border,
                    borderWidth: isCrafted ? 1.5 : 1,
                    opacity: isLocked ? 0.65 : 1,
                  },
                ]}
              >
                {/* Card top: emoji + name/desc */}
                <View style={styles.cardTop}>
                  <Text style={styles.cardEmoji}>{inv.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardNameRow}>
                      <Text style={[styles.cardName, { color: colors.foreground }]}>{inv.name}</Text>
                      <View style={[styles.tierBadge, { backgroundColor: tierColor + "22" }]}>
                        <Text style={[styles.tierText, { color: tierColor }]}>T{inv.tier}</Text>
                      </View>
                    </View>
                    <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
                      {inv.description}
                    </Text>
                  </View>
                </View>

                {/* Recipe */}
                <View style={styles.recipeRow}>
                  <Text style={[styles.recipeLabel, { color: colors.mutedForeground }]}>Recipe:</Text>
                  {Object.entries(inv.recipe).map(([planetId, needed]) => {
                    const planet = SOLAR_SYSTEM.find((p) => p.id === planetId);
                    const have = gameData.planetGems[planetId] ?? 0;
                    const sufficient = have >= needed;
                    return (
                      <View
                        key={planetId}
                        style={[
                          styles.ingredientChip,
                          {
                            backgroundColor: sufficient ? "#00C17322" : "#FF475722",
                            borderColor: sufficient ? "#00C173" : "#FF4757",
                          },
                        ]}
                      >
                        <Text style={styles.ingredientEmoji}>{planet?.gem ?? "🪨"}</Text>
                        <Text style={[styles.ingredientText, { color: sufficient ? "#00C173" : "#FF4757" }]}>
                          ×{needed}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Effect */}
                <View style={[styles.effectRow, { backgroundColor: "#00B4D811" }]}>
                  <Text style={[styles.effectText, { color: "#00B4D8" }]}>
                    ✦ {effectLabel(inv.effect)}
                  </Text>
                </View>

                {/* Action button */}
                {isCrafted ? (
                  <View style={[styles.craftBtn, { backgroundColor: tierColor + "22" }]}>
                    <Text style={[styles.craftBtnText, { color: tierColor }]}>✓ Crafted</Text>
                  </View>
                ) : isLocked ? (
                  <View style={[styles.craftBtn, { backgroundColor: "#FF475722" }]}>
                    <Text style={[styles.craftBtnText, { color: "#FF4757" }]}>
                      🔒 Level {inv.levelRequired} required
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.craftBtn, { backgroundColor: canCraft ? colors.primary : colors.muted }]}
                    onPress={() => handleCraft(inv.id)}
                    disabled={!canCraft}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.craftBtnText, { color: canCraft ? "#fff" : colors.mutedForeground }]}>
                      {justCrafted === inv.id ? "✓ Done!" : canCraft ? "Craft" : "Not enough stones"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  levelBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  levelBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  stonePanel: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  stonePanelTitle: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  stoneRow: { flexDirection: "row", gap: 8 },
  stoneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  stoneEmoji: { fontSize: 16 },
  stoneCount: { fontSize: 13, fontFamily: "Inter_700Bold" },
  tabRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  cardList: { gap: 12 },
  emptyState: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 32,
    alignItems: "center",
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  card: { borderRadius: 16, padding: 14, gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardEmoji: { fontSize: 34, marginTop: 2 },
  cardNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  cardName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  tierBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  tierText: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "uppercase" },
  cardDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 17 },
  recipeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  recipeLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  ingredientChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  ingredientEmoji: { fontSize: 14 },
  ingredientText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  effectRow: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  effectText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  craftBtn: { borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  craftBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
