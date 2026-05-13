import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ROCKET_PARTS, ROCKET_PARTS_TOTAL_COST } from "@/constants/rocketParts";
import { SHOP_ITEMS } from "@/constants/shopItems";
import { AQUARIUM_ANIMALS } from "@/constants/aquariumAnimals";
import { ZOO_ANIMALS } from "@/constants/zooAnimals";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

export default function RocketScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gameData, buyRocketPart, getPassiveRate } = useGame();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const ownedCount = gameData.rocketPartsOwned.length;
  const totalParts = ROCKET_PARTS.length;
  const allPartsOwned = ownedCount === totalParts;
  const progressPct = ownedCount / totalParts;
  const passiveRate = getPassiveRate();

  // Build earnings breakdown
  const earningItems: Array<{ emoji: string; name: string; rate: number }> = [];
  for (const [slot, itemId] of Object.entries(gameData.equippedItems)) {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (item?.starCoinsPerHour) {
      earningItems.push({ emoji: item.emoji, name: item.name, rate: item.starCoinsPerHour });
    }
  }
  for (const id of gameData.displayedAquariumAnimals) {
    const a = AQUARIUM_ANIMALS.find((x) => x.id === id);
    if (a) earningItems.push({ emoji: a.emoji, name: a.name, rate: a.starCoinsPerHour });
  }
  for (const id of gameData.displayedZooAnimals) {
    const a = ZOO_ANIMALS.find((x) => x.id === id);
    if (a) earningItems.push({ emoji: a.emoji, name: a.name, rate: a.starCoinsPerHour });
  }

  const handleBuy = (partId: string) => {
    buyRocketPart(partId);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 12, paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.card }]} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Rocket Assembly</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Star coins balance */}
        <View style={[styles.balanceCard, { backgroundColor: "#03030F", borderColor: "#00B4D8" + "55" }]}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceEmoji}>🪙</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.balanceAmount, { color: "#00B4D8" }]}>
                {gameData.starCoins.toLocaleString()}
              </Text>
              <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Star Coins</Text>
            </View>
            {passiveRate > 0 && (
              <View style={[styles.ratePill, { backgroundColor: "#00B4D8" + "22" }]}>
                <Text style={[styles.rateText, { color: "#00B4D8" }]}>+{passiveRate}/hr</Text>
              </View>
            )}
          </View>
          <Text style={[styles.totalCost, { color: colors.mutedForeground }]}>
            Total needed: 🪙 {ROCKET_PARTS_TOTAL_COST.toLocaleString()} · Remaining: 🪙 {Math.max(0, ROCKET_PARTS.filter(p => !gameData.rocketPartsOwned.includes(p.id)).reduce((s, p) => s + p.cost, 0)).toLocaleString()}
          </Text>
        </View>

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
              ? "🚀 All parts assembled! Ready for launch!"
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
            <Text style={styles.launchBtnText}>🚀 LAUNCH ROCKET</Text>
          </TouchableOpacity>
        )}

        {/* Rocket parts grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rocket Parts</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Buy with Star Coins earned from classroom upgrades</Text>
          <View style={styles.partsGrid}>
            {ROCKET_PARTS.sort((a, b) => a.order - b.order).map((part) => {
              const owned = gameData.rocketPartsOwned.includes(part.id);
              const canAfford = gameData.starCoins >= part.cost;
              return (
                <View key={part.id} style={[styles.partCard, {
                  backgroundColor: owned ? "#051525" : colors.secondary,
                  borderColor: owned ? "#00B4D8" : colors.border,
                  borderWidth: owned ? 2 : 1,
                }]}>
                  {owned && (
                    <View style={[styles.ownedBadge, { backgroundColor: "#00B4D8" }]}>
                      <Text style={styles.ownedBadgeText}>✓</Text>
                    </View>
                  )}
                  <Text style={styles.partEmoji}>{part.emoji}</Text>
                  <Text style={[styles.partName, { color: colors.foreground }]}>{part.name}</Text>
                  <Text style={[styles.partDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{part.description}</Text>
                  {!owned ? (
                    <TouchableOpacity
                      style={[styles.buyBtn, { backgroundColor: canAfford ? "#00B4D8" : colors.muted }]}
                      onPress={() => handleBuy(part.id)}
                      disabled={!canAfford}
                      activeOpacity={0.82}
                    >
                      <Text style={[styles.buyBtnText, { color: canAfford ? "#fff" : colors.mutedForeground }]}>
                        🪙 {part.cost}
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
            {passiveRate > 0 ? `Earning 🪙 ${passiveRate}/hr from:` : "How to earn Star Coins"}
          </Text>
          {passiveRate === 0 ? (
            <View style={[styles.earningsEmpty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ fontSize: 24 }}>🏫</Text>
              <Text style={[styles.earningsEmptyText, { color: colors.mutedForeground }]}>
                Equip classroom items, aquarium animals, and zoo animals to start earning Star Coins passively.
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
                  <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
                  <Text style={[styles.earningName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.earningRate, { color: "#00B4D8" }]}>+{item.rate}/hr</Text>
                </View>
              ))}
              <View style={[styles.earningTotal, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text style={[styles.earningTotalLabel, { color: colors.mutedForeground }]}>Total</Text>
                <Text style={[styles.earningTotalVal, { color: "#00B4D8" }]}>🪙 {passiveRate}/hr</Text>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  balanceCard: { borderRadius: 20, padding: 18, gap: 8, borderWidth: 1.5 },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  balanceEmoji: { fontSize: 32 },
  balanceAmount: { fontSize: 36, fontFamily: "Inter_700Bold" },
  balanceLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  ratePill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  rateText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  totalCost: { fontSize: 12, fontFamily: "Inter_400Regular" },
  progressCard: { borderRadius: 16, padding: 16, gap: 10, borderWidth: 1 },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  progressFraction: { fontSize: 18, fontFamily: "Inter_700Bold" },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  launchBtn: { borderRadius: 18, paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  launchBtnText: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#000" },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -6 },
  partsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  partCard: { width: "47%", borderRadius: 16, padding: 12, gap: 6, alignItems: "center", position: "relative" },
  ownedBadge: { position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  ownedBadgeText: { color: "#000", fontSize: 11, fontFamily: "Inter_700Bold" },
  partEmoji: { fontSize: 38, marginVertical: 2 },
  partName: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  partDesc: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 15, minHeight: 30 },
  buyBtn: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignItems: "center", width: "100%" },
  buyBtnText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  earningsEmpty: { borderRadius: 16, padding: 20, alignItems: "center", gap: 12, borderWidth: 1 },
  earningsEmptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  earningsTips: { gap: 6, width: "100%" },
  tipLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  earningsList: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  earningRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  earningName: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  earningRate: { fontSize: 13, fontFamily: "Inter_700Bold" },
  earningTotal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12 },
  earningTotalLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  earningTotalVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
