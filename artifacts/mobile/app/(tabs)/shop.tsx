import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  type ImageSourcePropType,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CLASSROOM_ITEM_ASSETS,
  getClassroomItemAsset,
  getClassroomStudentAsset,
} from "@/constants/classroomAssets";
import { SHOP_ITEMS, type ItemCategory } from "@/constants/shopItems";
import { START_DRILL_ASSETS } from "@/constants/startDrillAssets";
import {
  getItemUpgradeCost,
  getStoredItemLevel,
  MAX_ITEM_LEVEL,
  useGame,
} from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { PinnedHeader, usePinnedHeaderHeight } from "@/components/PinnedHeader";

type FilterTab = "all" | ItemCategory;

const TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "classroom", label: "Classroom" },
  { id: "student", label: "Student" },
];

const SLOT_LABELS: Record<string, string> = {
  wall: "Wall",
  floor_left: "Floor Left",
  floor_right: "Floor Right",
  desk: "Desk",
  ceiling: "Ceiling",
  outfit: "Outfit",
  hat: "Hat",
  accessory: "Accessory",
};

function getShopItemAsset(item: { id: string; category: ItemCategory }): ImageSourcePropType | undefined {
  return item.category === "student"
    ? getClassroomStudentAsset(item.id)
    : getClassroomItemAsset(item.id);
}

export default function ShopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gameData, purchaseItem, upgradeItem, equipItem, getLevel } = useGame();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [justBought, setJustBought] = useState<string | null>(null);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const headerHeight = usePinnedHeaderHeight();

  const playerLevel = getLevel(gameData.points);

  const filtered =
    filter === "all"
      ? SHOP_ITEMS.filter((i) => i.slot !== "outfit")
      : SHOP_ITEMS.filter((i) => i.category === filter && i.slot !== "outfit");

  const handleBuy = (itemId: string) => {
    const success = purchaseItem(itemId);
    if (success) {
      setJustBought(itemId);
      setTimeout(() => setJustBought(null), 1500);
    }
  };

  const handleEquip = (slot: string, itemId: string) => {
    const isEquipped = gameData.equippedItems[slot] === itemId;
    equipItem(slot, isEquipped ? null : itemId);
  };

  const handleUpgrade = (itemId: string) => {
    upgradeItem(itemId);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PinnedHeader title="Shop" />
      <View
        style={[
          styles.pinnedBalanceWrap,
          {
            top: headerHeight,
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={[styles.balanceBadge, { backgroundColor: colors.gold + "22", borderColor: colors.gold + "55" }]}>
          <Image source={CLASSROOM_ITEM_ASSETS.shop_bag} style={styles.balanceAsset} resizeMode="contain" />
          <View style={styles.balanceCopy}>
            <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Points available</Text>
            <Text style={[styles.balanceText, { color: colors.gold }]}>
              {gameData.points.toLocaleString()} Points
            </Text>
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
        {/* Filter tabs */}
        <View
          style={[
            styles.tabRow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                filter === tab.id && { backgroundColor: colors.primary },
              ]}
              onPress={() => setFilter(tab.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: filter === tab.id ? "#fff" : colors.mutedForeground },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Items grid */}
        <View style={styles.grid}>
          {filtered.map((item) => {
            const owned = gameData.ownedItems.includes(item.id);
            const equipped =
              item.category === "student" && gameData.equippedItems[item.slot] === item.id;
            const canAfford = gameData.points >= item.price;
            const isBought = justBought === item.id;
            const isLocked = playerLevel < item.levelRequired;
            const asset = getShopItemAsset(item);
            const itemLevel = getStoredItemLevel(gameData.itemLevels, item.id);
            const upgradedRate = item.starCoinsPerHour
              ? item.starCoinsPerHour * itemLevel
              : 0;
            const canUpgrade = owned && !!item.starCoinsPerHour && itemLevel < MAX_ITEM_LEVEL;
            const upgradeCost = getItemUpgradeCost(item.price, itemLevel);
            const canAffordUpgrade = gameData.points >= upgradeCost;

            return (
              <View
                key={item.id}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: owned ? colors.card : colors.secondary,
                    borderColor: equipped
                      ? colors.accent
                      : owned
                      ? colors.border
                      : colors.border,
                    borderWidth: equipped ? 2 : 1,
                    opacity: isLocked && !owned ? 0.65 : 1,
                  },
                ]}
              >
                {/* Equipped indicator */}
                {equipped && (
                  <View style={[styles.equippedBadge, { backgroundColor: colors.accent }]}>
                    <Text style={styles.equippedText}>ON</Text>
                  </View>
                )}

                {/* Level lock badge */}
                {isLocked && !owned && (
                  <View style={[styles.lockBadge, { backgroundColor: "#FF475722" }]}>
                    <Text style={[styles.lockText, { color: "#FF6B7A" }]}>Lv {item.levelRequired}</Text>
                  </View>
                )}

                <View style={[styles.itemAssetWell, { backgroundColor: item.category === "student" ? "#251A44" : "#102437" }]}>
                  {asset && <Image source={asset} style={styles.itemAsset} resizeMode="contain" />}
                </View>
                <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.itemSlot, { color: colors.mutedForeground }]}>
                  {SLOT_LABELS[item.slot]}
                </Text>
                <Text
                  style={[styles.itemDesc, { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
                {item.starCoinsPerHour ? (
                  <View style={[styles.coinRateTag, { backgroundColor: "#00B4D8" + "22" }]}>
                    <Image source={CLASSROOM_ITEM_ASSETS.neon} style={styles.rateIcon} resizeMode="contain" />
                    <Text style={[styles.coinRateTagText, { color: "#00B4D8" }]}>
                      Lv {itemLevel} · +{upgradedRate} Star Coins/min
                    </Text>
                  </View>
                ) : null}

                {/* Action button */}
                {!owned ? (
                  <TouchableOpacity
                    style={[
                      styles.buyBtn,
                      {
                        backgroundColor:
                          isLocked ? colors.muted
                          : canAfford ? colors.primary
                          : colors.muted,
                      },
                    ]}
                    onPress={() => handleBuy(item.id)}
                    disabled={!canAfford || isLocked}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.buyBtnText,
                        { color: (canAfford && !isLocked) ? "#fff" : colors.mutedForeground },
                      ]}
                    >
                      {isLocked ? `Lv ${item.levelRequired}` : `${item.price} Points`}
                    </Text>
                  </TouchableOpacity>
                ) : isBought ? (
                  <View style={[styles.ownedBtn, { backgroundColor: colors.success + "22" }]}>
                    <Text style={[styles.ownedText, { color: colors.success }]}>✓ Bought!</Text>
                  </View>
                ) : item.category === "classroom" ? (
                  <>
                    <View style={[styles.ownedBtn, { backgroundColor: "#00B4D8" + "18" }]}>
                      <Text style={[styles.ownedText, { color: "#00B4D8" }]}>Placed</Text>
                    </View>
                    {item.starCoinsPerHour ? (
                      <TouchableOpacity
                        style={[
                          styles.upgradeBtn,
                          {
                            backgroundColor: canUpgrade && canAffordUpgrade ? colors.gold + "22" : colors.muted,
                            borderColor: canUpgrade && canAffordUpgrade ? colors.gold : colors.border,
                          },
                        ]}
                        onPress={() => handleUpgrade(item.id)}
                        disabled={!canUpgrade || !canAffordUpgrade}
                        activeOpacity={0.82}
                      >
                        <Text
                          style={[
                            styles.upgradeText,
                            { color: canUpgrade && canAffordUpgrade ? colors.gold : colors.mutedForeground },
                          ]}
                        >
                          {itemLevel >= MAX_ITEM_LEVEL ? "Max Lv" : `Upgrade ${upgradeCost} Points`}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.equipBtn,
                      {
                        backgroundColor: equipped ? colors.accent + "22" : colors.secondary,
                        borderColor: equipped ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => handleEquip(item.slot, item.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.equipText,
                        { color: equipped ? colors.accent : colors.foreground },
                      ]}
                    >
                      {equipped ? "Unequip" : "Equip"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Go to classroom hint */}
        <TouchableOpacity
          style={[styles.classroomHint, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/classroom")}
          activeOpacity={0.85}
        >
          <Image source={CLASSROOM_ITEM_ASSETS.bookshelf} style={styles.classroomHintAsset} resizeMode="contain" />
          <Text style={[styles.classroomHintText, { color: colors.foreground }]}>
            View & arrange items in your classroom
          </Text>
          <Text style={[styles.classroomHintArrow, { color: colors.mutedForeground }]}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 10 },
  backBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  backAsset: { width: 54, height: 54 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  pinnedBalanceWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 90,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  balanceBadge: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
    overflow: "visible",
    borderWidth: 1,
  },
  balanceAsset: { width: 30, height: 30 },
  balanceCopy: { flex: 1 },
  balanceLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0 },
  balanceText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  tabRow: { flexDirection: "row", borderRadius: 18, padding: 5, borderWidth: 1, gap: 5 },
  tab: { flex: 1, borderRadius: 13, paddingVertical: 10, alignItems: "center" },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  itemCard: { width: "48.5%", minHeight: 322, borderRadius: 20, padding: 12, gap: 6, alignItems: "center", position: "relative" },
  equippedBadge: { position: "absolute", top: 8, right: 8, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, zIndex: 2 },
  equippedText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#000" },
  lockBadge: { position: "absolute", top: 8, left: 8, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, zIndex: 2 },
  lockText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  itemAssetWell: { width: 94, height: 86, borderRadius: 22, alignItems: "center", justifyContent: "center", marginTop: 4, overflow: "hidden" },
  itemAsset: { width: 86, height: 78 },
  itemName: { fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "center", minHeight: 18 },
  itemSlot: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0 },
  itemDesc: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 15, minHeight: 32 },
  buyBtn: { borderRadius: 13, paddingVertical: 9, paddingHorizontal: 12, alignItems: "center", width: "100%", marginTop: "auto" },
  buyBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  ownedBtn: { borderRadius: 13, paddingVertical: 9, paddingHorizontal: 12, alignItems: "center", width: "100%", marginTop: "auto" },
  ownedText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  upgradeBtn: { borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, alignItems: "center", width: "100%", borderWidth: 1 },
  upgradeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  equipBtn: { borderRadius: 13, paddingVertical: 9, paddingHorizontal: 12, alignItems: "center", width: "100%", borderWidth: 1, marginTop: "auto" },
  equipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  classroomHint: { borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1 },
  classroomHintAsset: { width: 36, height: 36 },
  classroomHintText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  classroomHintArrow: { fontSize: 28, fontFamily: "Inter_600SemiBold", lineHeight: 28 },
  coinRateTag: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 4 },
  rateIcon: { width: 18, height: 18 },
  coinRateTagText: { fontSize: 11, fontFamily: "Inter_700Bold" },
});
