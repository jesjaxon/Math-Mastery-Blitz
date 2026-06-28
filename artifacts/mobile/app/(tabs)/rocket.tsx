import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
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
import { ROCKET_ASSETS, ROCKET_PARTS, ROCKET_PARTS_TOTAL_COST } from "@/constants/rocketParts";
import { getClassroomItemAsset, getClassroomStudentAsset } from "@/constants/classroomAssets";
import { SHOP_ITEMS } from "@/constants/shopItems";
import { AQUARIUM_ANIMALS } from "@/constants/aquariumAnimals";
import { ZOO_ANIMALS } from "@/constants/zooAnimals";
import { getAnimalLevelKey, getStoredItemLevel, useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import type { ImageSourcePropType } from "react-native";
import { PinnedHeader, usePinnedHeaderHeight } from "@/components/PinnedHeader";

export default function RocketScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gameData, buyRocketPart, getPassiveRate, getLevel } = useGame();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const headerHeight = usePinnedHeaderHeight();

  const ownedCount = gameData.rocketPartsOwned.length;
  const totalParts = ROCKET_PARTS.length;
  const allPartsOwned = ownedCount === totalParts;
  const progressPct = ownedCount / totalParts;
  const passiveRate = getPassiveRate();
  const playerLevel = getLevel(gameData.points);

  const earningItems: Array<{
    asset?: ImageSourcePropType;
    name: string;
    rate: number;
  }> = [];
  const classroomItemIds = [
    ...gameData.ownedItems,
    ...Object.values(gameData.equippedItems),
  ];
  const countedItemIds = new Set<string>();
  for (const itemId of classroomItemIds) {
    if (countedItemIds.has(itemId)) continue;
    countedItemIds.add(itemId);
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (item?.starCoinsPerHour) {
      const level = getStoredItemLevel(gameData.itemLevels, itemId);
      const asset =
        item.category === "student"
          ? getClassroomStudentAsset(item.id)
          : getClassroomItemAsset(item.id);
      earningItems.push({ asset, name: `${item.name} Lv ${level}`, rate: item.starCoinsPerHour * level });
    }
  }
  for (const id of gameData.aquariumAnimals) {
    const a = AQUARIUM_ANIMALS.find((x) => x.id === id);
    if (a) {
      const level = getStoredItemLevel(gameData.itemLevels, getAnimalLevelKey("aquarium", id));
      earningItems.push({ asset: a.asset, name: `${a.name} Lv ${level}`, rate: a.starCoinsPerHour * level });
    }
  }
  for (const id of gameData.zooAnimals) {
    const a = ZOO_ANIMALS.find((x) => x.id === id);
    if (a) {
      const level = getStoredItemLevel(gameData.itemLevels, getAnimalLevelKey("zoo", id));
      earningItems.push({ asset: a.asset, name: `${a.name} Lv ${level}`, rate: a.starCoinsPerHour * level });
    }
  }

  const handleBuy = (partId: string) => {
    buyRocketPart(partId);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PinnedHeader title="Rocket Assembly" />
      <View style={[styles.pinnedBankroll, { top: headerHeight, backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={[styles.balanceCard, styles.pinnedBalanceCard, { backgroundColor: "#03030F", borderColor: "#00B4D8" + "55" }]}>
          <View style={styles.balanceRow}>
            <Image source={ROCKET_PARTS[0].asset} style={styles.pinnedBalanceAsset} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bankrollLabel, { color: colors.mutedForeground }]}>Star Coins available</Text>
              <Text style={[styles.pinnedBalanceAmount, { color: "#00B4D8" }]}>
                {gameData.starCoins.toLocaleString()}
              </Text>
            </View>
            {passiveRate > 0 && (
              <View style={[styles.ratePill, { backgroundColor: "#00B4D8" + "22" }]}>
                <Text style={[styles.rateText, { color: "#00B4D8" }]}>+{passiveRate} Star Coins/min</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <ScrollView
        bounces={false}
        alwaysBounceVertical={false}
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight + 78, paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Star coins balance */}
        <View style={[styles.balanceCard, { backgroundColor: "#03030F", borderColor: "#00B4D8" + "55" }]}>
          <Text style={[styles.totalCost, { color: colors.mutedForeground }]}>
            Star Coins needed: {ROCKET_PARTS_TOTAL_COST.toLocaleString()} · Remaining: {Math.max(0, ROCKET_PARTS.filter(p => !gameData.rocketPartsOwned.includes(p.id)).reduce((s, p) => s + p.cost, 0)).toLocaleString()} Star Coins
          </Text>
        </View>

        <ImageBackground
          source={ROCKET_ASSETS.assemblyBay}
          style={styles.assemblyHero}
          imageStyle={styles.assemblyHeroImage}
          resizeMode="cover"
        >
          <View style={styles.heroShade} />
          <Image
            source={ROCKET_ASSETS.assembledRocket}
            style={[
              styles.assembledRocket,
              { opacity: ownedCount > 0 ? 0.55 + progressPct * 0.45 : 0.28 },
            ]}
            resizeMode="contain"
          />
          <View style={styles.heroPartsRail}>
            {ROCKET_PARTS.sort((a, b) => a.order - b.order).map((part) => {
              const owned = gameData.rocketPartsOwned.includes(part.id);
              return (
                <View
                  key={part.id}
                  style={[
                    styles.heroPartDot,
                    { backgroundColor: owned ? "#00D9A3" : "rgba(255,255,255,0.18)" },
                  ]}
                >
                  <Image source={part.asset} style={[styles.heroPartAsset, !owned && styles.lockedPartAsset]} resizeMode="contain" />
                </View>
              );
            })}
          </View>
        </ImageBackground>

        {/* Assembly progress */}
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: colors.foreground }]}>Assembly Progress</Text>
            <Text style={[styles.progressFraction, { color: allPartsOwned ? "#00D9A3" : colors.primary }]}>
              {ownedCount}/{totalParts}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, {
              width: `${progressPct * 100}%` as any,
              backgroundColor: allPartsOwned ? "#00D9A3" : "#00B4D8",
            }]} />
          </View>
          <Text style={[styles.progressSub, { color: colors.mutedForeground }]}>
            {allPartsOwned
              ? "All parts assembled! Ready for launch!"
              : `Collect all ${totalParts} parts to unlock the launch.`}
          </Text>
        </View>

        {/* Launch button */}
        {allPartsOwned && (
          <TouchableOpacity
            style={[styles.launchBtn, { backgroundColor: "#00D9A3" }]}
            onPress={() => router.push("/launch")}
            activeOpacity={0.85}
          >
            <Image source={ROCKET_ASSETS.assembledRocket} style={styles.launchAsset} resizeMode="contain" />
            <Text style={styles.launchBtnText}>LAUNCH ROCKET</Text>
          </TouchableOpacity>
        )}

        {/* Rocket parts grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rocket Parts</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Buy with Star Coins earned from drills</Text>
          <View style={styles.partsGrid}>
            {ROCKET_PARTS.sort((a, b) => a.order - b.order).map((part) => {
              const owned = gameData.rocketPartsOwned.includes(part.id);
              const canAfford = gameData.starCoins >= part.cost;
              const isLocked = playerLevel < part.levelRequired;
              return (
                <View key={part.id} style={[styles.partCard, {
                  backgroundColor: owned ? "#051525" : colors.secondary,
                  borderColor: owned ? "#00B4D8" : colors.border,
                  borderWidth: owned ? 2 : 1,
                  opacity: isLocked && !owned ? 0.65 : 1,
                }]}>
                  {owned && (
                    <View style={[styles.ownedBadge, { backgroundColor: "#00B4D8" }]}>
                      <Text style={styles.ownedBadgeText}>✓</Text>
                    </View>
                  )}
                  {isLocked && !owned && (
                    <View style={[styles.lockBadge, { backgroundColor: "#FF475722" }]}>
                      <Text style={[styles.lockText, { color: "#FF4757" }]}>Lv {part.levelRequired}</Text>
                    </View>
                  )}
                  <View style={styles.partAssetWell}>
                    <Image source={part.asset} style={[styles.partAsset, isLocked && !owned && styles.lockedPartAsset]} resizeMode="contain" />
                  </View>
                  <Text style={[styles.partName, { color: colors.foreground }]}>{part.name}</Text>
                  <Text style={[styles.partDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{part.description}</Text>
                  {!owned ? (
                    <TouchableOpacity
                      style={[styles.buyBtn, { backgroundColor: (canAfford && !isLocked) ? "#00B4D8" : colors.muted }]}
                      onPress={() => handleBuy(part.id)}
                      disabled={!canAfford || isLocked}
                      activeOpacity={0.82}
                    >
                      <Text style={[styles.buyBtnText, { color: (canAfford && !isLocked) ? "#fff" : colors.mutedForeground }]}>
                        {isLocked ? `Lv ${part.levelRequired}` : `${part.cost} Star Coins`}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.buyBtn, { backgroundColor: "#00B4D8" + "22" }]}>
                      <Text style={[styles.buyBtnText, { color: "#00B4D8" }]}>Installed ✓</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Earnings breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {passiveRate > 0 ? `Earning ${passiveRate} Star Coins/min in drills from:` : "How to earn Star Coins"}
          </Text>
          {passiveRate === 0 ? (
            <View style={[styles.earningsEmpty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Image source={ROCKET_ASSETS.assembledRocket} style={styles.emptyRocketAsset} resizeMode="contain" />
              <Text style={[styles.earningsEmptyText, { color: colors.mutedForeground }]}>
                Equip classroom items, aquarium animals, and zoo animals to start earning Star Coins when you complete drills.
              </Text>
              <View style={styles.earningsTips}>
                <TouchableOpacity onPress={() => router.push("/shop")}>
                  <Text style={[styles.tipLink, { color: colors.primary }]}>→ Visit Shop for classroom items</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/aquarium")}>
                  <Text style={[styles.tipLink, { color: "#00B4D8" }]}>→ Get Aquarium animals</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/zoo")}>
                  <Text style={[styles.tipLink, { color: "#4CAF50" }]}>→ Adopt Zoo animals</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[styles.earningsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {earningItems.map((item, i) => (
                <View key={i} style={[styles.earningRow, i < earningItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  {item.asset ? (
                    <Image source={item.asset} style={styles.earningAsset} resizeMode="contain" />
                  ) : (
                    <Feather name="star" size={18} color="#00B4D8" />
                  )}
                  <Text style={[styles.earningName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.earningRate, { color: "#00B4D8" }]}>+{item.rate} Star Coins/min</Text>
                </View>
              ))}
              <View style={[styles.earningTotal, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text style={[styles.earningTotalLabel, { color: colors.mutedForeground }]}>Total</Text>
                <Text style={[styles.earningTotalVal, { color: "#00B4D8" }]}>{passiveRate} Star Coins/min</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 18 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  pinnedBankroll: { position: "absolute", left: 0, right: 0, zIndex: 90, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10, borderBottomWidth: 1 },
  balanceCard: { borderRadius: 20, padding: 18, gap: 8, borderWidth: 1.5 },
  pinnedBalanceCard: { paddingVertical: 10, paddingHorizontal: 14 },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  balanceAsset: { width: 40, height: 40 },
  pinnedBalanceAsset: { width: 32, height: 32 },
  balanceAmount: { fontSize: 36, fontFamily: "Inter_700Bold" },
  pinnedBalanceAmount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  balanceLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  bankrollLabel: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0 },
  ratePill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  rateText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  totalCost: { fontSize: 12, fontFamily: "Inter_400Regular" },
  assemblyHero: {
    height: 238,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(0,180,216,0.36)",
    alignItems: "center",
    justifyContent: "center",
  },
  assemblyHeroImage: { borderRadius: 22 },
  heroShade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(3,3,15,0.16)",
  },
  assembledRocket: { width: 116, height: 178, marginTop: -14 },
  heroPartsRail: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroPartDot: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  heroPartAsset: { width: 34, height: 34 },
  progressCard: { borderRadius: 16, padding: 16, gap: 10, borderWidth: 1 },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  progressFraction: { fontSize: 18, fontFamily: "Inter_700Bold" },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  launchBtn: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  launchAsset: { width: 34, height: 44 },
  launchBtnText: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#000" },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -6 },
  partsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  partCard: { width: "47%", borderRadius: 16, padding: 12, gap: 6, alignItems: "center", position: "relative" },
  ownedBadge: { position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  ownedBadgeText: { color: "#000", fontSize: 11, fontFamily: "Inter_700Bold" },
  lockBadge: { position: "absolute", top: 8, left: 8, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  lockText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  partAssetWell: {
    width: 88,
    height: 76,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,180,216,0.10)",
    marginTop: 10,
  },
  partAsset: { width: 74, height: 66 },
  lockedPartAsset: { opacity: 0.38 },
  partName: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  partDesc: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 15, minHeight: 30 },
  buyBtn: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignItems: "center", width: "100%" },
  buyBtnText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  earningsEmpty: { borderRadius: 16, padding: 20, alignItems: "center", gap: 12, borderWidth: 1 },
  emptyRocketAsset: { width: 56, height: 74 },
  earningsEmptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  earningsTips: { gap: 6, width: "100%" },
  tipLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  earningsList: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  earningRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  earningAsset: { width: 24, height: 24 },
  earningName: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  earningRate: { fontSize: 13, fontFamily: "Inter_700Bold" },
  earningTotal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12 },
  earningTotalLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  earningTotalVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
