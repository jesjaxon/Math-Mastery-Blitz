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
import { AQUARIUM_ANIMALS, RARITY_COLORS } from "@/constants/aquariumAnimals";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

const RARITY_LABELS = { common: "Common", uncommon: "Uncommon", rare: "Rare", legendary: "Legendary" };

function AquariumScene({ displayed }: { displayed: string[] }) {
  const animals = AQUARIUM_ANIMALS.filter((a) => displayed.includes(a.id));
  return (
    <View style={scene.tank}>
      <View style={scene.water}>
        {/* Bubbles */}
        {[20, 60, 110, 160, 210, 260, 310].map((x, i) => (
          <View key={i} style={[scene.bubble, { left: x, bottom: 12 + (i % 3) * 14 }]} />
        ))}
        {/* Seabed */}
        <View style={scene.seabed}>
          <Text style={{ fontSize: 18 }}>🪸</Text>
          <Text style={{ fontSize: 14 }}>🌿</Text>
          <Text style={{ fontSize: 18 }}>🪨</Text>
          <Text style={{ fontSize: 14 }}>🌿</Text>
          <Text style={{ fontSize: 18 }}>🪸</Text>
        </View>
        {/* Animals */}
        {animals.length === 0 ? (
          <View style={scene.emptyWater}>
            <Text style={scene.emptyText}>No animals yet — buy some below!</Text>
          </View>
        ) : (
          <View style={scene.animalRow}>
            {animals.map((a, i) => (
              <Text key={a.id} style={[scene.animalEmoji, { transform: [{ translateY: i % 2 === 0 ? -10 : 0 }] }]}>
                {a.emoji}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const scene = StyleSheet.create({
  tank: { borderRadius: 20, overflow: "hidden", height: 200 },
  water: {
    flex: 1,
    backgroundColor: "#0A3D62",
    justifyContent: "flex-end",
    position: "relative",
    padding: 12,
  },
  bubble: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(100, 200, 255, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(100, 200, 255, 0.5)",
  },
  seabed: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingBottom: 2,
  },
  emptyWater: { position: "absolute", top: 0, left: 0, right: 0, bottom: 50, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "Inter_400Regular" },
  animalRow: {
    position: "absolute",
    flexDirection: "row",
    flexWrap: "wrap",
    left: 16,
    right: 16,
    bottom: 56,
    justifyContent: "center",
    gap: 8,
  },
  animalEmoji: { fontSize: 30 },
});

export default function AquariumScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gameData, buyAnimal, toggleDisplayAnimal } = useGame();
  const [justBought, setJustBought] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleBuy = (id: string) => {
    const success = buyAnimal(id, "aquarium");
    if (success) {
      setJustBought(id);
      setTimeout(() => setJustBought(null), 1500);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 12, paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.card }]} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Aquarium</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {gameData.aquariumAnimals.length}/{AQUARIUM_ANIMALS.length} collected
            </Text>
          </View>
          <View style={[styles.coinBadge, { backgroundColor: "#0A3D62" }]}>
            <Text style={styles.coinText}>⭐ {gameData.points.toLocaleString()}</Text>
          </View>
        </View>

        <AquariumScene displayed={gameData.displayedAquariumAnimals} />

        {/* Display toggle section */}
        {gameData.aquariumAnimals.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Displaying in Tank</Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Tap to add/remove from the aquarium scene</Text>
            <View style={styles.chipRow}>
              {AQUARIUM_ANIMALS.filter((a) => gameData.aquariumAnimals.includes(a.id)).map((a) => {
                const isDisplayed = gameData.displayedAquariumAnimals.includes(a.id);
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.chip, {
                      backgroundColor: isDisplayed ? "#0A3D62" : colors.card,
                      borderColor: isDisplayed ? "#00B4D8" : colors.border,
                      borderWidth: isDisplayed ? 1.5 : 1,
                    }]}
                    onPress={() => toggleDisplayAnimal(a.id, "aquarium")}
                  >
                    <Text style={{ fontSize: 18 }}>{a.emoji}</Text>
                    <Text style={[styles.chipLabel, { color: isDisplayed ? "#00B4D8" : colors.mutedForeground }]}>{a.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Animal catalog */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sea Animals</Text>
          <View style={styles.grid}>
            {AQUARIUM_ANIMALS.map((animal) => {
              const owned = gameData.aquariumAnimals.includes(animal.id);
              const canAfford = gameData.points >= animal.price;
              const isBought = justBought === animal.id;
              const rarityColor = RARITY_COLORS[animal.rarity];

              return (
                <View key={animal.id} style={[styles.card, {
                  backgroundColor: owned ? colors.card : colors.secondary,
                  borderColor: owned ? rarityColor + "66" : colors.border,
                  borderWidth: owned ? 1.5 : 1,
                }]}>
                  <View style={[styles.rarityBadge, { backgroundColor: rarityColor + "22" }]}>
                    <Text style={[styles.rarityText, { color: rarityColor }]}>{RARITY_LABELS[animal.rarity]}</Text>
                  </View>
                  <Text style={styles.animalEmoji}>{animal.emoji}</Text>
                  <Text style={[styles.animalName, { color: colors.foreground }]} numberOfLines={1}>{animal.name}</Text>
                  <Text style={[styles.animalDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{animal.description}</Text>
                  <View style={styles.coinRate}>
                    <Text style={[styles.coinRateText, { color: "#00B4D8" }]}>🪙 {animal.starCoinsPerHour}/hr</Text>
                  </View>
                  {!owned ? (
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: canAfford ? colors.primary : colors.muted }]}
                      onPress={() => handleBuy(animal.id)}
                      disabled={!canAfford}
                    >
                      <Text style={[styles.btnText, { color: canAfford ? "#fff" : colors.mutedForeground }]}>
                        ⭐ {animal.price.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ) : isBought ? (
                    <View style={[styles.btn, { backgroundColor: colors.success + "22" }]}>
                      <Text style={[styles.btnText, { color: colors.success }]}>✓ Added!</Text>
                    </View>
                  ) : (
                    <View style={[styles.btn, { backgroundColor: rarityColor + "22" }]}>
                      <Text style={[styles.btnText, { color: rarityColor }]}>✓ Owned</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
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
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  coinBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  coinText: { color: "#FFD166", fontSize: 13, fontFamily: "Inter_700Bold" },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12 },
  chipLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "47%", borderRadius: 16, padding: 12, gap: 5, alignItems: "center" },
  rarityBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  rarityText: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  animalEmoji: { fontSize: 38, marginVertical: 2 },
  animalName: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  animalDesc: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 15, minHeight: 30 },
  coinRate: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  coinRateText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  btn: { borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12, alignItems: "center", width: "100%" },
  btnText: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
