import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SHOP_ITEMS, getItemById, type ShopItem } from "@/constants/shopItems";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");
const SCENE_W = SCREEN_W - 40;
const SCENE_H = Math.min(SCENE_W * 0.68, 280);
const WALL_H = SCENE_H * 0.6;

function StudentCharacter({
  outfit,
  hat,
  accessory,
}: {
  outfit?: ShopItem;
  hat?: ShopItem;
  accessory?: ShopItem;
}) {
  const bodyColor = outfit?.outfitColor ?? "#4A8FE0";

  return (
    <View style={sc.studentWrap}>
      {hat && (
        <Text style={sc.hat} adjustsFontSizeToFit={false}>
          {hat.emoji}
        </Text>
      )}
      <View style={[sc.head]}>
        <Text style={sc.face}>{accessory?.id === "sunglasses" ? "😎" : "😊"}</Text>
      </View>
      {accessory && accessory.id !== "sunglasses" && (
        <Text style={sc.accessory}>{accessory.emoji}</Text>
      )}
      <View style={[sc.body, { backgroundColor: bodyColor }]} />
      <View style={sc.desk}>
        <Text style={sc.deskEmoji}>📖</Text>
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  studentWrap: {
    alignItems: "center",
    position: "relative",
    width: 70,
  },
  hat: { fontSize: 24, marginBottom: -4, zIndex: 2 },
  head: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5CBA7",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  face: { fontSize: 22 },
  accessory: {
    position: "absolute",
    right: 2,
    top: 28,
    fontSize: 16,
    zIndex: 3,
  },
  body: {
    width: 32,
    height: 28,
    borderRadius: 6,
    marginTop: 2,
  },
  desk: {
    marginTop: 4,
    width: 64,
    height: 12,
    backgroundColor: "#8B6914",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  deskEmoji: { fontSize: 14, lineHeight: 14, marginTop: -2 },
});

function ClassroomScene({
  equippedItems,
}: {
  equippedItems: Record<string, string>;
}) {
  const wall = equippedItems["wall"]
    ? getItemById(equippedItems["wall"])
    : undefined;
  const floorLeft = equippedItems["floor_left"]
    ? getItemById(equippedItems["floor_left"])
    : undefined;
  const floorRight = equippedItems["floor_right"]
    ? getItemById(equippedItems["floor_right"])
    : undefined;
  const ceiling = equippedItems["ceiling"]
    ? getItemById(equippedItems["ceiling"])
    : undefined;
  const outfit = equippedItems["outfit"]
    ? getItemById(equippedItems["outfit"])
    : undefined;
  const hat = equippedItems["hat"]
    ? getItemById(equippedItems["hat"])
    : undefined;
  const accessory = equippedItems["accessory"]
    ? getItemById(equippedItems["accessory"])
    : undefined;
  const deskItem = equippedItems["desk"]
    ? getItemById(equippedItems["desk"])
    : undefined;

  return (
    <View style={[room.scene, { width: SCENE_W, height: SCENE_H }]}>
      {/* Wall */}
      <View style={[room.wall, { height: WALL_H }]}>
        {/* Ceiling item */}
        {ceiling ? (
          <Text style={room.ceilingItem}>{ceiling.emoji}</Text>
        ) : (
          <Text style={[room.ceilingItem, { opacity: 0.15 }]}>✨</Text>
        )}

        {/* Wall decor + chalkboard row */}
        <View style={room.wallRow}>
          {/* Left wall item */}
          <View style={room.wallSlot}>
            {wall ? (
              <Text style={room.wallEmoji}>{wall.emoji}</Text>
            ) : (
              <Text style={[room.wallEmoji, { opacity: 0.12 }]}>🖼️</Text>
            )}
          </View>

          {/* Chalkboard */}
          <View style={room.chalkboard}>
            <Text style={room.chalkText}>✏️ MATH</Text>
            <Text style={room.chalkSub}>2 + 2 = ?</Text>
          </View>

          {/* Windows */}
          <View style={room.windowWrap}>
            <View style={room.window}>
              <Text style={room.windowSun}>☀️</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Floor divider */}
      <View style={room.floorLine} />

      {/* Floor */}
      <View style={room.floor}>
        {/* Left floor item */}
        <View style={room.floorSlot}>
          {floorLeft ? (
            <Text style={room.floorEmoji}>{floorLeft.emoji}</Text>
          ) : (
            <Text style={[room.floorEmoji, { opacity: 0.12 }]}>🪴</Text>
          )}
        </View>

        {/* Student */}
        <StudentCharacter outfit={outfit} hat={hat} accessory={accessory} />

        {/* Right floor item */}
        <View style={room.floorSlot}>
          {floorRight ? (
            <Text style={room.floorEmoji}>{floorRight.emoji}</Text>
          ) : (
            <Text style={[room.floorEmoji, { opacity: 0.12 }]}>🏆</Text>
          )}
        </View>
      </View>

      {/* Desk item overlay */}
      {deskItem && (
        <View style={room.deskItemOverlay} pointerEvents="none">
          <Text style={room.deskItemEmoji}>{deskItem.emoji}</Text>
        </View>
      )}
    </View>
  );
}

const room = StyleSheet.create({
  scene: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#E8D5B0",
  },
  wall: {
    backgroundColor: "#EDD9A3",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 6,
  },
  ceilingItem: {
    fontSize: 22,
    textAlign: "center",
  },
  wallRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    flex: 1,
  },
  wallSlot: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  wallEmoji: { fontSize: 32 },
  chalkboard: {
    flex: 1,
    backgroundColor: "#2D4A3E",
    borderRadius: 6,
    borderWidth: 3,
    borderColor: "#8B6914",
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  chalkText: {
    color: "#E8E8E8",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  chalkSub: {
    color: "#B8D4C8",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  windowWrap: {
    width: 44,
    alignItems: "center",
  },
  window: {
    width: 40,
    height: 40,
    backgroundColor: "#AEE4FF",
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#8B6914",
    alignItems: "center",
    justifyContent: "center",
  },
  windowSun: { fontSize: 18 },
  floorLine: {
    height: 4,
    backgroundColor: "#8B6914",
  },
  floor: {
    flex: 1,
    backgroundColor: "#C4A265",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 6,
  },
  floorSlot: {
    width: 50,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  floorEmoji: { fontSize: 36 },
  deskItemOverlay: {
    position: "absolute",
    bottom: SCENE_H * 0.18,
    left: SCENE_W / 2 + 16,
  },
  deskItemEmoji: { fontSize: 18 },
});

// Slot sections for the "inventory" panel
const SLOT_SECTIONS = [
  {
    label: "🏫 Classroom — Wall",
    slot: "wall",
    category: "classroom" as const,
  },
  {
    label: "🌿 Classroom — Floor Left",
    slot: "floor_left",
    category: "classroom" as const,
  },
  {
    label: "📦 Classroom — Floor Right",
    slot: "floor_right",
    category: "classroom" as const,
  },
  {
    label: "🪟 Classroom — Ceiling",
    slot: "ceiling",
    category: "classroom" as const,
  },
  { label: "📐 Desk", slot: "desk", category: "classroom" as const },
  { label: "👕 Outfit", slot: "outfit", category: "student" as const },
  { label: "🎩 Hat", slot: "hat", category: "student" as const },
  {
    label: "⭐ Accessory",
    slot: "accessory",
    category: "student" as const,
  },
];

export default function ClassroomScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gameData, equipItem, getPassiveRate } = useGame();
  const passiveRate = getPassiveRate();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const ownedBySlot = useMemo(() => {
    const map: Record<string, ShopItem[]> = {};
    for (const item of SHOP_ITEMS) {
      if (gameData.ownedItems.includes(item.id)) {
        if (!map[item.slot]) map[item.slot] = [];
        map[item.slot].push(item);
      }
    }
    return map;
  }, [gameData.ownedItems]);

  const hasAnyItems = gameData.ownedItems.length > 0;

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
          <Text style={[styles.title, { color: colors.foreground }]}>
            My Classroom
          </Text>
          <TouchableOpacity
            style={[styles.shopBtn, { backgroundColor: colors.card }]}
            onPress={() => router.push("/shop")}
          >
            <Feather name="shopping-bag" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Classroom scene */}
        <ClassroomScene equippedItems={gameData.equippedItems} />

        {/* Star coin production banner */}
        {passiveRate > 0 && (
          <View style={[styles.rateBanner, { backgroundColor: "#03030F", borderColor: "#00B4D8" + "55" }]}>
            <Text style={{ fontSize: 20 }}>🪙</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rateValue, { color: "#00B4D8" }]}>+{passiveRate} Star Coins / hour</Text>
              <Text style={[styles.rateSub, { color: colors.mutedForeground }]}>Earned passively — spend in Rocket Assembly</Text>
            </View>
          </View>
        )}

        {/* Empty state */}
        {!hasAnyItems && (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Your classroom is empty!
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Complete math drills to earn points, then visit the shop to
              decorate your classroom and customize your student.
            </Text>
            <TouchableOpacity
              style={[styles.shopCTA, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/shop")}
            >
              <Text style={styles.shopCTAText}>Visit Shop</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Inventory sections */}
        {hasAnyItems &&
          SLOT_SECTIONS.map((section) => {
            const items = ownedBySlot[section.slot] ?? [];
            if (items.length === 0) return null;

            return (
              <View key={section.slot} style={styles.section}>
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  {section.label}
                </Text>
                <View style={styles.itemRow}>
                  {/* "None" option */}
                  <TouchableOpacity
                    style={[
                      styles.itemChip,
                      {
                        backgroundColor:
                          !gameData.equippedItems[section.slot]
                            ? colors.primary + "22"
                            : colors.card,
                        borderColor:
                          !gameData.equippedItems[section.slot]
                            ? colors.primary
                            : colors.border,
                        borderWidth:
                          !gameData.equippedItems[section.slot] ? 2 : 1,
                      },
                    ]}
                    onPress={() => equipItem(section.slot, null)}
                  >
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
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.itemChip,
                          {
                            backgroundColor: isOn
                              ? colors.accent + "22"
                              : colors.card,
                            borderColor: isOn ? colors.accent : colors.border,
                            borderWidth: isOn ? 2 : 1,
                          },
                        ]}
                        onPress={() => equipItem(section.slot, item.id)}
                      >
                        <Text style={styles.chipEmoji}>{item.emoji}</Text>
                        <Text
                          style={[
                            styles.chipLabel,
                            {
                              color: isOn
                                ? colors.foreground
                                : colors.mutedForeground,
                            },
                          ]}
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

        {/* Shop link */}
        {hasAnyItems && (
          <TouchableOpacity
            style={[
              styles.shopLink,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => router.push("/shop")}
          >
            <Feather name="shopping-bag" size={18} color={colors.primary} />
            <Text style={[styles.shopLinkText, { color: colors.foreground }]}>
              Get more items from the Shop
            </Text>
            <Text style={[styles.shopLinkPoints, { color: colors.gold }]}>
              ⭐ {gameData.points.toLocaleString()}
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
  shopBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  emptyCard: {
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  shopCTA: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 4,
  },
  shopCTAText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  section: { gap: 10 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  itemRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  itemChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: 160,
  },
  chipEmoji: { fontSize: 16 },
  chipLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flexShrink: 1,
  },
  rateBanner: {
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
  },
  rateValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  rateSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  shopLink: {
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
  },
  shopLinkText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  shopLinkPoints: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
