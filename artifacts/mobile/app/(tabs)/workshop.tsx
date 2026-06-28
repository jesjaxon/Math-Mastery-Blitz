import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
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
import {
  GEM_ASSETS,
  INVENTION_ASSETS,
  WORKSHOP_ASSETS,
} from "@/constants/workshopAssets";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { PinnedHeader, usePinnedHeaderHeight } from "@/components/PinnedHeader";

type FilterTab = "all" | "t1" | "t2" | "t3" | "t4" | "crafted";

const GEM_PLANETS = SOLAR_SYSTEM.filter((body) => body.gem);

const TIER_COLORS: Record<number, string> = {
  1: "#00D9A3",
  2: "#35A7FF",
  3: "#B56CFF",
  4: "#FFD05A",
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "t1", label: "T1" },
  { key: "t2", label: "T2" },
  { key: "t3", label: "T3" },
  { key: "t4", label: "T4" },
  { key: "crafted", label: "Crafted" },
];

function effectLabel(effect: { starCoinsPerHour?: number; multiplier?: number; coinsPerAnswer?: number }): string {
  const parts: string[] = [];
  if (effect.starCoinsPerHour) parts.push(`+${effect.starCoinsPerHour} Star Coins/min`);
  if (effect.multiplier) parts.push(`x${effect.multiplier.toFixed(2)} Points`);
  if (effect.coinsPerAnswer) parts.push(`+${effect.coinsPerAnswer} Star Coins/answer`);
  return parts.join("  |  ");
}

export default function WorkshopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gameData, craftInvention, getLevel, getPassiveRate, getDrillMultiplier, getDrillCoinBonus } =
    useGame();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [justCrafted, setJustCrafted] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const headerHeight = usePinnedHeaderHeight();
  const playerLevel = getLevel(gameData.points);
  const craftedInventions = gameData.craftedInventions ?? [];

  const filteredInventions = useMemo(
    () =>
      INVENTIONS.filter((inv) => {
        if (filter === "crafted") return craftedInventions.includes(inv.id);
        if (filter === "t1") return inv.tier === 1;
        if (filter === "t2") return inv.tier === 2;
        if (filter === "t3") return inv.tier === 3;
        if (filter === "t4") return inv.tier === 4;
        return true;
      }),
    [craftedInventions, filter]
  );

  const totalStones = GEM_PLANETS.reduce(
    (sum, planet) => sum + (gameData.planetGems[planet.id] ?? 0),
    0
  );

  const handleCraft = (id: string) => {
    const success = craftInvention(id);
    if (!success) return;
    setJustCrafted(id);
    setTimeout(() => setJustCrafted(null), 1200);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PinnedHeader title="Workshop" subtitle="Craft drill boosts from space stones" />
      <View style={[styles.pinnedBankroll, { top: headerHeight, backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={[styles.stoneBankroll, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="tool" size={18} color="#B56CFF" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bankrollLabel, { color: colors.mutedForeground }]}>Space Stones available</Text>
            <Text style={[styles.bankrollValue, { color: "#D8C6FF" }]}>{totalStones.toLocaleString()} stones</Text>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: "#17153A", borderColor: colors.border }]}>
            <Text style={[styles.levelBadgeText, { color: colors.primary }]}>Lv {playerLevel}</Text>
          </View>
        </View>
      </View>
      <ScrollView
        bounces={false}
        alwaysBounceVertical={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: headerHeight + 78, paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={WORKSHOP_ASSETS.background}
          resizeMode="cover"
          imageStyle={styles.heroImage}
          style={[styles.hero, { borderColor: colors.border }]}
        >
          <View style={styles.heroShade} />
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{craftedInventions.length}/{INVENTIONS.length}</Text>
              <Text style={styles.heroStatLabel}>crafted</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{totalStones}</Text>
              <Text style={styles.heroStatLabel}>stones</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{getPassiveRate().toFixed(1)}</Text>
              <Text style={styles.heroStatLabel}>Star Coins/min</Text>
            </View>
          </View>
        </ImageBackground>

        <View style={[styles.boostPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.boostItem}>
            <Feather name="trending-up" size={18} color="#FFD05A" />
            <Text style={[styles.boostText, { color: colors.foreground }]}>
              x{getDrillMultiplier().toFixed(2)} Points
            </Text>
          </View>
          <View style={styles.boostItem}>
            <Feather name="star" size={18} color="#00B4D8" />
            <Text style={[styles.boostText, { color: colors.foreground }]}>
              +{getDrillCoinBonus()} Star Coins/answer
            </Text>
          </View>
        </View>

        <View style={[styles.stonePanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Space Stones</Text>
            <TouchableOpacity
              style={[styles.smallRouteBtn, { backgroundColor: "#00B4D822" }]}
              onPress={() => router.push("/launch")}
              activeOpacity={0.85}
            >
              <Feather name="send" size={14} color="#00B4D8" />
              <Text style={styles.smallRouteText}>Launch</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stoneRow}>
            {GEM_PLANETS.map((planet) => {
              const count = gameData.planetGems[planet.id] ?? 0;
              return (
                <View
                  key={planet.id}
                  style={[
                    styles.stoneChip,
                    {
                      backgroundColor: count > 0 ? "#0F1835" : "#151429",
                      borderColor: count > 0 ? planet.color + "AA" : colors.border,
                      opacity: count > 0 ? 1 : 0.5,
                    },
                  ]}
                >
                  <Image source={GEM_ASSETS[planet.id]} style={styles.stoneIcon} resizeMode="contain" />
                  <Text style={[styles.stoneCount, { color: colors.foreground }]}>x{count}</Text>
                  <Text style={[styles.stoneName, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {planet.name}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
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
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, { color: filter === tab.key ? "#fff" : colors.mutedForeground }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.cardList}>
          {filteredInventions.length === 0 && (
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No crafted inventions yet.
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
                    borderColor: isCrafted ? tierColor : colors.border,
                  },
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.iconWell, { backgroundColor: tierColor + "18" }]}>
                    <Image source={INVENTION_ASSETS[inv.id]} style={styles.cardAsset} resizeMode="contain" />
                  </View>
                  <View style={styles.cardCopy}>
                    <View style={styles.cardNameRow}>
                      <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
                        {inv.name}
                      </Text>
                      <View style={[styles.tierBadge, { backgroundColor: tierColor + "22" }]}>
                        <Text style={[styles.tierText, { color: tierColor }]}>T{inv.tier}</Text>
                      </View>
                    </View>
                    <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {inv.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.recipeRow}>
                  {Object.entries(inv.recipe).map(([planetId, needed]) => {
                    const planet = SOLAR_SYSTEM.find((p) => p.id === planetId);
                    const have = gameData.planetGems[planetId] ?? 0;
                    const enough = have >= needed;
                    return (
                      <View
                        key={planetId}
                        style={[
                          styles.ingredientChip,
                          {
                            backgroundColor: enough ? "#00D9A322" : "#FF475722",
                            borderColor: enough ? "#00D9A3" : "#FF6B6B",
                          },
                        ]}
                      >
                        <Image source={GEM_ASSETS[planetId]} style={styles.ingredientIcon} resizeMode="contain" />
                        <Text style={[styles.ingredientText, { color: enough ? "#00D9A3" : "#FF6B6B" }]}>
                          {have}/{needed}
                        </Text>
                        <Text style={[styles.ingredientName, { color: colors.mutedForeground }]} numberOfLines={1}>
                          {planet?.name}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <View style={[styles.effectRow, { backgroundColor: "#00B4D814" }]}>
                  <Feather name="zap" size={15} color="#00B4D8" />
                  <Text style={[styles.effectText, { color: "#64DFFF" }]}>{effectLabel(inv.effect)}</Text>
                </View>

                {isCrafted ? (
                  <View style={[styles.craftBtn, { backgroundColor: tierColor + "22" }]}>
                    <Feather name="check" size={16} color={tierColor} />
                    <Text style={[styles.craftBtnText, { color: tierColor }]}>Crafted</Text>
                  </View>
                ) : isLocked ? (
                  <View style={[styles.craftBtn, { backgroundColor: "#FF475722" }]}>
                    <Feather name="lock" size={15} color="#FF6B6B" />
                    <Text style={[styles.craftBtnText, { color: "#FF6B6B" }]}>Level {inv.levelRequired}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.craftBtn, { backgroundColor: canCraft ? colors.primary : "#2A2845" }]}
                    onPress={() => handleCraft(inv.id)}
                    disabled={!canCraft}
                    activeOpacity={0.85}
                  >
                    <Feather name="tool" size={15} color={canCraft ? "#fff" : colors.mutedForeground} />
                    <Text style={[styles.craftBtnText, { color: canCraft ? "#fff" : colors.mutedForeground }]}>
                      {justCrafted === inv.id ? "Done" : canCraft ? "Craft" : "Need stones"}
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
    gap: 12,
    zIndex: 10,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1, alignItems: "center" },
  title: { fontSize: 31, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 2, textAlign: "center" },
  pinnedBankroll: { position: "absolute", left: 0, right: 0, zIndex: 90, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10, borderBottomWidth: 1 },
  stoneBankroll: { minHeight: 58, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  bankrollLabel: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0 },
  bankrollValue: { fontSize: 17, fontFamily: "Inter_700Bold" },
  levelBadge: {
    minWidth: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  levelBadgeText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  hero: {
    height: 188,
    borderRadius: 28,
    borderWidth: 1.5,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroImage: { borderRadius: 28 },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 6, 20, 0.22)",
  },
  heroStats: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  heroStat: {
    flex: 1,
    minHeight: 58,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7, 10, 30, 0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroStatValue: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  heroStatLabel: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    marginTop: 2,
  },
  boostPanel: {
    flexDirection: "row",
    borderRadius: 18,
    borderWidth: 1,
    padding: 10,
    gap: 10,
  },
  boostItem: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#0E1831",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  boostText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  stonePanel: { borderRadius: 22, borderWidth: 1, padding: 12, gap: 10 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  smallRouteBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  smallRouteText: { color: "#00B4D8", fontSize: 12, fontFamily: "Inter_700Bold" },
  stoneRow: { gap: 10 },
  stoneChip: {
    width: 88,
    height: 92,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  stoneIcon: { width: 38, height: 38, marginBottom: 4 },
  stoneCount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  stoneName: { fontSize: 10, fontFamily: "Inter_600SemiBold", marginTop: 2, maxWidth: 74 },
  tabRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  tab: {
    minWidth: 66,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  tabText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  cardList: { gap: 12 },
  emptyState: {
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 28,
    alignItems: "center",
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  card: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 12,
    gap: 10,
  },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "center" },
  iconWell: {
    width: 74,
    height: 74,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cardAsset: { width: 64, height: 64 },
  cardCopy: { flex: 1, minWidth: 0 },
  cardNameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  cardName: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold" },
  tierBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tierText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  cardDesc: { fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 17, marginTop: 4 },
  recipeRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  ingredientChip: {
    minWidth: 96,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 7,
  },
  ingredientIcon: { width: 22, height: 22 },
  ingredientText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  ingredientName: { flex: 1, fontSize: 10, fontFamily: "Inter_600SemiBold" },
  effectRow: {
    minHeight: 38,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  effectText: { flex: 1, fontSize: 13, fontFamily: "Inter_700Bold" },
  craftBtn: {
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  craftBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
