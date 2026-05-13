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
import { SHOP_ITEMS, type ItemCategory } from "@/constants/shopItems";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

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

export default function ShopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gameData, purchaseItem, equipItem } = useGame();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [justBought, setJustBought] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered =
    filter === "all"
      ? SHOP_ITEMS
      : SHOP_ITEMS.filter((i) => i.category === filter);

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
          <Text style={[styles.title, { color: colors.foreground }]}>Shop</Text>
          <View
            style={[
              styles.balanceBadge,
              { backgroundColor: colors.gold + "22" },
            ]}
          >
            <Text style={[styles.balanceText, { color: colors.gold }]}>
              ⭐ {gameData.points.toLocaleString()}
            </Text>
          </View>
        </View>

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
                  {
                    color:
                      filter === tab.id ? "#fff" : colors.mutedForeground,
                  },
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
            const equipped = gameData.equippedItems[item.slot] === item.id;
            const canAfford = gameData.points >= item.price;
            const isBought = justBought === item.id;

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
                  },
                ]}
              >
                {/* Equipped indicator */}
                {equipped && (
                  <View
                    style={[
                      styles.equippedBadge,
                      { backgroundColor: colors.accent },
                    ]}
                  >
                    <Text style={styles.equippedText}>ON</Text>
                  </View>
                )}

                {/* Emoji */}
                <Text style={styles.itemEmoji}>{item.emoji}</Text>

                {/* Info */}
                <Text
                  style={[styles.itemName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text
                  style={[styles.itemSlot, { color: colors.mutedForeground }]}
                >
                  {SLOT_LABELS[item.slot]}
                </Text>
                <Text
                  style={[styles.itemDesc, { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>

                {/* Action button */}
                {!owned ? (
                  <TouchableOpacity
                    style={[
                      styles.buyBtn,
                      {
                        backgroundColor: canAfford
                          ? colors.primary
                          : colors.muted,
                      },
                    ]}
                    onPress={() => handleBuy(item.id)}
                    disabled={!canAfford}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.buyBtnText,
                        { color: canAfford ? "#fff" : colors.mutedForeground },
                      ]}
                    >
                      {canAfford ? `⭐ ${item.price}` : `⭐ ${item.price}`}
                    </Text>
                  </TouchableOpacity>
                ) : isBought ? (
                  <View
                    style={[
                      styles.ownedBtn,
                      { backgroundColor: colors.success + "22" },
                    ]}
                  >
                    <Text
                      style={[styles.ownedText, { color: colors.success }]}
                    >
                      ✓ Bought!
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.equipBtn,
                      {
                        backgroundColor: equipped
                          ? colors.accent + "22"
                          : colors.secondary,
                        borderColor: equipped ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => handleEquip(item.slot, item.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.equipText,
                        {
                          color: equipped ? colors.accent : colors.foreground,
                        },
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
          style={[
            styles.classroomHint,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => router.push("/classroom")}
          activeOpacity={0.85}
        >
          <Text style={styles.classroomEmoji}>🏫</Text>
          <Text style={[styles.classroomHintText, { color: colors.foreground }]}>
            View & arrange items in your classroom
          </Text>
          <Feather name="arrow-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
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
  balanceBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  balanceText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  tabRow: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    gap: 4,
  },
  tab: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  itemCard: {
    width: "47%",
    borderRadius: 16,
    padding: 14,
    gap: 6,
    alignItems: "center",
    position: "relative",
  },
  equippedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  equippedText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#000",
  },
  itemEmoji: { fontSize: 38 },
  itemName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  itemSlot: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 15,
    minHeight: 30,
  },
  buyBtn: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    width: "100%",
  },
  buyBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  ownedBtn: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    width: "100%",
  },
  ownedText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  equipBtn: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
  },
  equipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  classroomHint: {
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
  },
  classroomEmoji: { fontSize: 24 },
  classroomHintText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
