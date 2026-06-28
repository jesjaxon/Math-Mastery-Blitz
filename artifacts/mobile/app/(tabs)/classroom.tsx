import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClassroomScene } from "@/components/ClassroomScene";
import {
  CLASSROOM_ITEM_ASSETS,
  getClassroomItemAsset,
  getClassroomStudentAsset,
} from "@/constants/classroomAssets";
import { START_DRILL_ASSETS } from "@/constants/startDrillAssets";
import { SHOP_ITEMS, type ShopItem } from "@/constants/shopItems";
import { useGame } from "@/context/GameContext";
import { useProfiles } from "@/context/ProfileContext";
import { useColors } from "@/hooks/useColors";
import { PinnedHeader, usePinnedHeaderHeight } from "@/components/PinnedHeader";

function getInventoryAsset(item: ShopItem) {
  return item.category === "student"
    ? getClassroomStudentAsset(item.id)
    : getClassroomItemAsset(item.id);
}

const SLOT_SECTIONS = [
  { label: "Hat", slot: "hat", category: "student" as const },
  { label: "Accessory", slot: "accessory", category: "student" as const },
];

export default function ClassroomScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gameData, equipItem, getPassiveRate, updateClassroomLayout } = useGame();
  const { activeProfile } = useProfiles();
  const passiveRate = getPassiveRate();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const headerHeight = usePinnedHeaderHeight();

  const ownedBySlot = useMemo(() => {
    const map: Record<string, ShopItem[]> = {};
    for (const item of SHOP_ITEMS) {
      if (gameData.ownedItems.includes(item.id) && item.slot !== "outfit") {
        if (!map[item.slot]) map[item.slot] = [];
        map[item.slot].push(item);
      }
    }
    return map;
  }, [gameData.ownedItems]);

  const ownedClassroomItems = useMemo(
    () =>
      SHOP_ITEMS.filter(
        (item) => item.category === "classroom" && gameData.ownedItems.includes(item.id)
      ),
    [gameData.ownedItems]
  );

  const hasAnyItems = gameData.ownedItems.some((id) => {
    const item = SHOP_ITEMS.find((shopItem) => shopItem.id === id);
    return item?.slot !== "outfit";
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PinnedHeader title="My Classroom" />
      <ScrollView
        bounces={false}
        alwaysBounceVertical={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: headerHeight + 8, paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ClassroomScene
          ownedItems={gameData.ownedItems}
          equippedItems={gameData.equippedItems}
          avatar={activeProfile?.avatar}
          savedLayout={gameData.classroomLayout}
          onLayoutChange={updateClassroomLayout}
        />

        {ownedClassroomItems.length > 0 && (
          <View style={styles.arrangeRow}>
            <TouchableOpacity
              style={[styles.arrangeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/classroom-edit")}
            >
              <Text style={[styles.arrangeBtnText, { color: colors.foreground }]}>Arrange Room</Text>
            </TouchableOpacity>
          </View>
        )}

        {passiveRate > 0 && (
          <View style={[styles.rateBanner, { backgroundColor: "#03030F", borderColor: "#00B4D855" }]}>
            <Image source={CLASSROOM_ITEM_ASSETS.neon} style={styles.rateAsset} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rateValue, { color: "#00B4D8" }]}>+{passiveRate} Star Coins/min</Text>
              <Text style={[styles.rateSub, { color: colors.mutedForeground }]}>Earned only while playing drills</Text>
            </View>
          </View>
        )}

        {!hasAnyItems && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image source={CLASSROOM_ITEM_ASSETS.shop_bag} style={styles.emptyAsset} resizeMode="contain" />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your classroom is empty!</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Complete math drills to earn Points, then visit the shop to decorate your classroom and customize your student.
            </Text>
            <TouchableOpacity
              style={[styles.shopCTA, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/shop")}
            >
              <Text style={styles.shopCTAText}>Visit Shop</Text>
            </TouchableOpacity>
          </View>
        )}

        {ownedClassroomItems.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Placed Classroom Items</Text>
            <View style={styles.itemRow}>
              {ownedClassroomItems.map((item) => {
                const itemAsset = getInventoryAsset(item);
                return (
                  <View
                    key={item.id}
                    style={[styles.itemChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    {itemAsset && <Image source={itemAsset} style={styles.chipAsset} resizeMode="contain" />}
                    <Text style={[styles.chipLabel, { color: colors.foreground }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {hasAnyItems &&
          SLOT_SECTIONS.map((section) => {
            const items = ownedBySlot[section.slot] ?? [];
            if (items.length === 0) return null;

            return (
              <View key={section.slot} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{section.label}</Text>
                <View style={styles.itemRow}>
                  <TouchableOpacity
                    style={[
                      styles.itemChip,
                      {
                        backgroundColor: !gameData.equippedItems[section.slot] ? colors.primary + "22" : colors.card,
                        borderColor: !gameData.equippedItems[section.slot] ? colors.primary : colors.border,
                        borderWidth: !gameData.equippedItems[section.slot] ? 2 : 1,
                      },
                    ]}
                    onPress={() => equipItem(section.slot, null)}
                  >
                    <Image source={CLASSROOM_ITEM_ASSETS.none} style={styles.chipAsset} resizeMode="contain" />
                    <Text
                      style={[
                        styles.chipLabel,
                        {
                          color: !gameData.equippedItems[section.slot]
                            ? colors.primary
                            : colors.mutedForeground,
                        },
                      ]}
                    >
                      None
                    </Text>
                  </TouchableOpacity>

                  {items.map((item) => {
                    const isOn = gameData.equippedItems[section.slot] === item.id;
                    const itemAsset = getInventoryAsset(item);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.itemChip,
                          {
                            backgroundColor: isOn ? colors.accent + "22" : colors.card,
                            borderColor: isOn ? colors.accent : colors.border,
                            borderWidth: isOn ? 2 : 1,
                          },
                        ]}
                        onPress={() => equipItem(section.slot, item.id)}
                      >
                        {itemAsset && <Image source={itemAsset} style={styles.chipAsset} resizeMode="contain" />}
                        <Text
                          style={[styles.chipLabel, { color: isOn ? colors.foreground : colors.mutedForeground }]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}

        {hasAnyItems && (
          <TouchableOpacity
            style={[styles.shopLink, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/shop")}
          >
            <Image source={CLASSROOM_ITEM_ASSETS.shop_bag} style={styles.shopLinkAsset} resizeMode="contain" />
            <Text style={[styles.shopLinkText, { color: colors.foreground }]}>Get more items from the Shop</Text>
            <Text style={[styles.shopLinkPoints, { color: colors.gold }]}>
              {gameData.points.toLocaleString()} Points
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 18 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 10 },
  backBtn: { width: 46, height: 46, alignItems: "center", justifyContent: "center" },
  shopBtn: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  headerIconAsset: { width: 52, height: 52 },
  shopIconAsset: { width: 30, height: 30 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  arrangeRow: { marginTop: -8, alignItems: "center" },
  arrangeBtn: {
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 44,
    minWidth: 172,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  arrangeBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  emptyCard: { borderRadius: 18, padding: 24, alignItems: "center", gap: 10, borderWidth: 1 },
  emptyAsset: { width: 86, height: 86, marginBottom: -2 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  shopCTA: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 28, marginTop: 4 },
  shopCTAText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  itemRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  itemChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    minHeight: 48,
    maxWidth: 168,
    borderWidth: 1,
  },
  chipAsset: { width: 30, height: 30 },
  chipLabel: { fontSize: 13, fontFamily: "Inter_500Medium", flexShrink: 1 },
  rateBanner: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rateAsset: { width: 38, height: 38 },
  rateValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  rateSub: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  shopLink: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shopLinkAsset: { width: 34, height: 34 },
  shopLinkText: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  shopLinkPoints: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
