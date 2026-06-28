import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
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
import {
  AQUARIUM_ANIMALS,
  RARITY_COLORS,
  type AquariumHabitat,
} from "@/constants/aquariumAnimals";
import {
  getAnimalLevelKey,
  getItemUpgradeCost,
  getStoredItemLevel,
  MAX_ITEM_LEVEL,
  useGame,
} from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { PinnedHeader, usePinnedHeaderHeight } from "@/components/PinnedHeader";

const RARITY_LABELS = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary",
};

const HABITAT_BACKGROUNDS: Record<AquariumHabitat, any> = {
  reef: require("@/assets/game/aquarium-habitats/coral-reef-wide.png"),
  freshwater: require("@/assets/game/aquarium-habitats/freshwater-plants-wide.png"),
  tidepool: require("@/assets/game/aquarium-habitats/tidepool-wide.png"),
  kelp: require("@/assets/game/aquarium-habitats/kelp-forest-wide.png"),
  ocean: require("@/assets/game/aquarium-habitats/open-ocean-wide.png"),
};

const HABITAT_LABELS: Record<AquariumHabitat, string> = {
  reef: "Coral Reef",
  freshwater: "Freshwater Tank",
  tidepool: "Rocky Tidepool",
  kelp: "Kelp Forest",
  ocean: "Open Ocean",
};

const STAGE_SIZES: Partial<Record<string, { width: number; height: number; bottom: number }>> = {
  coral: { width: 118, height: 118, bottom: 14 },
  crab: { width: 120, height: 120, bottom: 18 },
  shrimp: { width: 96, height: 96, bottom: 76 },
  lobster: { width: 130, height: 130, bottom: 18 },
  otter: { width: 128, height: 128, bottom: 42 },
  seal: { width: 142, height: 142, bottom: 24 },
  dolphin: { width: 156, height: 156, bottom: 52 },
  shark: { width: 162, height: 162, bottom: 48 },
  whale: { width: 176, height: 176, bottom: 38 },
  blue_whale: { width: 184, height: 184, bottom: 34 },
};

function AquariumScene({
  index,
  owned,
  canBuy,
  locked,
  animalLevel,
  upgradeCost,
  canUpgrade,
  canAffordUpgrade,
  onPrev,
  onNext,
  onBuy,
  onUpgrade,
}: {
  index: number;
  owned: boolean;
  canBuy: boolean;
  locked: boolean;
  animalLevel: number;
  upgradeCost: number;
  canUpgrade: boolean;
  canAffordUpgrade: boolean;
  onPrev: () => void;
  onNext: () => void;
  onBuy: () => void;
  onUpgrade: () => void;
}) {
  const animal = AQUARIUM_ANIMALS[index];
  const rarityColor = RARITY_COLORS[animal.rarity];
  const spriteSize = STAGE_SIZES[animal.id] ?? { width: 132, height: 132, bottom: 48 };
  const upgradedRate = animal.starCoinsPerHour * animalLevel;

  return (
    <View style={scene.tankShell}>
      <ImageBackground
        source={HABITAT_BACKGROUNDS[animal.habitat]}
        style={scene.background}
        imageStyle={scene.backgroundImage}
        resizeMode="cover"
      >
        <View style={scene.glassHighlight} />
        <View style={scene.topOverlay}>
          <View style={[scene.rarityPill, { backgroundColor: rarityColor + "E6" }]}>
            <Text style={scene.rarityText}>{RARITY_LABELS[animal.rarity]}</Text>
          </View>
          <Text style={scene.counterText}>{index + 1}/{AQUARIUM_ANIMALS.length} · Lv {animalLevel}</Text>
        </View>

        <TouchableOpacity style={[scene.navButton, scene.navLeft]} onPress={onPrev} activeOpacity={0.75}>
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[scene.navButton, scene.navRight]} onPress={onNext} activeOpacity={0.75}>
          <Feather name="chevron-right" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={[scene.stage, { bottom: spriteSize.bottom }]}>
          <Image
            source={animal.asset}
            style={[
              scene.animalSprite,
              { width: spriteSize.width, height: spriteSize.height },
              !owned && scene.lockedSprite,
            ]}
            resizeMode="contain"
          />
          {!owned && (
            <View style={scene.lockOverlay}>
              <Feather name="lock" size={13} color="#fff" />
              <Text style={scene.lockOverlayText}>Lv {animal.levelRequired}</Text>
            </View>
          )}
        </View>

        <View style={scene.caption}>
          <Text style={scene.name}>{animal.name}</Text>
          <Text style={scene.habitat}>{HABITAT_LABELS[animal.habitat]}</Text>
          <Text style={scene.rateLine}>+{upgradedRate} Star Coins/min</Text>
        </View>

        {!owned ? (
          <TouchableOpacity
            style={[scene.buyPill, { opacity: canBuy && !locked ? 1 : 0.72 }]}
            onPress={onBuy}
            disabled={!canBuy || locked}
            activeOpacity={0.82}
          >
            <Feather name={locked ? "lock" : "star"} size={13} color="#121124" />
            <Text style={scene.buyText}>
              {locked ? `Lv ${animal.levelRequired}` : `${animal.price.toLocaleString()} Points`}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              scene.buyPill,
              {
                backgroundColor: canUpgrade && canAffordUpgrade ? "#FFD166" : "rgba(255,255,255,0.22)",
                opacity: canUpgrade ? 1 : 0.82,
              },
            ]}
            onPress={onUpgrade}
            disabled={!canUpgrade || !canAffordUpgrade}
            activeOpacity={0.82}
          >
            <Feather name={animalLevel >= MAX_ITEM_LEVEL ? "check" : "arrow-up"} size={13} color="#121124" />
            <Text style={scene.buyText}>
              {animalLevel >= MAX_ITEM_LEVEL ? "Max Lv" : `Upgrade ${upgradeCost} Points`}
            </Text>
          </TouchableOpacity>
        )}
      </ImageBackground>
    </View>
  );
}

const scene = StyleSheet.create({
  tankShell: {
    height: 286,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(91, 218, 255, 0.38)",
    backgroundColor: "#053147",
  },
  background: { flex: 1, position: "relative" },
  backgroundImage: { borderRadius: 24 },
  glassHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  topOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rarityPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  rarityText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
  },
  counterText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  navButton: {
    position: "absolute",
    top: 120,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  navLeft: { left: 10 },
  navRight: { right: 10 },
  stage: {
    position: "absolute",
    left: 70,
    right: 70,
    alignItems: "center",
  },
  animalSprite: { shadowColor: "#001B2E", shadowOpacity: 0.28, shadowRadius: 12 },
  lockedSprite: { opacity: 0.48 },
  lockOverlay: {
    marginTop: -8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  lockOverlayText: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
  caption: {
    position: "absolute",
    left: 14,
    bottom: 14,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  name: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  habitat: { color: "rgba(255,255,255,0.78)", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  rateLine: { color: "#9BE7FF", fontSize: 11, fontFamily: "Inter_700Bold", marginTop: 2 },
  buyPill: {
    position: "absolute",
    right: 14,
    bottom: 14,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFD166",
  },
  buyText: { color: "#121124", fontSize: 13, fontFamily: "Inter_700Bold" },
});

export default function AquariumScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gameData, buyAnimal, upgradeAnimal, getLevel } = useGame();
  const [justBought, setJustBought] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const headerHeight = usePinnedHeaderHeight();
  const playerLevel = getLevel(gameData.points);
  const currentAnimal = AQUARIUM_ANIMALS[currentSlide];
  const currentOwned = gameData.aquariumAnimals.includes(currentAnimal.id);
  const currentLocked = playerLevel < currentAnimal.levelRequired;
  const currentCanBuy = gameData.points >= currentAnimal.price;
  const currentLevelKey = getAnimalLevelKey("aquarium", currentAnimal.id);
  const currentAnimalLevel = getStoredItemLevel(gameData.itemLevels, currentLevelKey);
  const currentUpgradeCost = getItemUpgradeCost(currentAnimal.price, currentAnimalLevel);
  const currentCanUpgrade = currentOwned && currentAnimalLevel < MAX_ITEM_LEVEL;
  const currentCanAffordUpgrade = gameData.points >= currentUpgradeCost;

  const handleBuy = (id: string) => {
    const success = buyAnimal(id, "aquarium");
    if (success) {
      setJustBought(id);
      setTimeout(() => setJustBought(null), 1500);
    }
  };

  const handleUpgrade = (id: string) => {
    upgradeAnimal(id, "aquarium");
  };

  const goPrev = () => setCurrentSlide((i) => (i === 0 ? AQUARIUM_ANIMALS.length - 1 : i - 1));
  const goNext = () => setCurrentSlide((i) => (i + 1) % AQUARIUM_ANIMALS.length);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PinnedHeader
        title="Aquarium"
        subtitle={`${gameData.aquariumAnimals.length}/${AQUARIUM_ANIMALS.length} collected`}
      />
      <View style={[styles.pinnedBankroll, { top: headerHeight, backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={[styles.balanceStrip, { backgroundColor: "#173248" }]}>
          <Feather name="star" size={18} color="#FFD166" />
          <View>
            <Text style={[styles.bankrollLabel, { color: colors.mutedForeground }]}>Points available</Text>
            <Text style={styles.coinText}>{gameData.points.toLocaleString()} Points</Text>
          </View>
        </View>
      </View>
      <ScrollView
        bounces={false}
        alwaysBounceVertical={false}
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight + 78, paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <AquariumScene
          index={currentSlide}
          owned={currentOwned}
          canBuy={currentCanBuy}
          locked={currentLocked}
          animalLevel={currentAnimalLevel}
          upgradeCost={currentUpgradeCost}
          canUpgrade={currentCanUpgrade}
          canAffordUpgrade={currentCanAffordUpgrade}
          onPrev={goPrev}
          onNext={goNext}
          onBuy={() => handleBuy(currentAnimal.id)}
          onUpgrade={() => handleUpgrade(currentAnimal.id)}
        />

        <View style={styles.slideDots}>
          {AQUARIUM_ANIMALS.map((animal, i) => (
            <TouchableOpacity
              key={animal.id}
              style={[
                styles.slideDot,
                {
                  backgroundColor: i === currentSlide ? "#00B4D8" : colors.border,
                  opacity: gameData.aquariumAnimals.includes(animal.id) ? 1 : 0.45,
                },
              ]}
              onPress={() => setCurrentSlide(i)}
              accessibilityLabel={`Show ${animal.name} habitat`}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sea Animals</Text>
          <View style={styles.grid}>
            {AQUARIUM_ANIMALS.map((animal, index) => {
              const owned = gameData.aquariumAnimals.includes(animal.id);
              const canAfford = gameData.points >= animal.price;
              const isBought = justBought === animal.id;
              const rarityColor = RARITY_COLORS[animal.rarity];
              const isLocked = playerLevel < animal.levelRequired;
              const animalLevel = getStoredItemLevel(
                gameData.itemLevels,
                getAnimalLevelKey("aquarium", animal.id)
              );
              const upgradedRate = animal.starCoinsPerHour * animalLevel;
              const upgradeCost = getItemUpgradeCost(animal.price, animalLevel);
              const canUpgrade = owned && animalLevel < MAX_ITEM_LEVEL;
              const canAffordUpgrade = gameData.points >= upgradeCost;

              return (
                <TouchableOpacity
                  key={animal.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: owned ? colors.card : colors.secondary,
                      borderColor: owned ? rarityColor + "77" : colors.border,
                      borderWidth: owned ? 1.5 : 1,
                      opacity: isLocked && !owned ? 0.64 : 1,
                    },
                  ]}
                  onPress={() => setCurrentSlide(index)}
                  activeOpacity={0.84}
                >
                  <View style={[styles.rarityBadge, { backgroundColor: rarityColor + "22" }]}>
                    <Text style={[styles.rarityBadgeText, { color: rarityColor }]}>
                      {RARITY_LABELS[animal.rarity]}
                    </Text>
                  </View>
                  {isLocked && !owned && (
                    <View style={styles.lockBadge}>
                      <Feather name="lock" size={9} color="#FF6B7A" />
                      <Text style={styles.lockText}>Lv {animal.levelRequired}</Text>
                    </View>
                  )}
                  <Image source={animal.asset} style={styles.cardAnimal} resizeMode="contain" />
                  <Text style={[styles.animalName, { color: colors.foreground }]} numberOfLines={1}>
                    {animal.name}
                  </Text>
                  <Text style={[styles.habitatText, { color: "#00B4D8" }]} numberOfLines={1}>
                    {HABITAT_LABELS[animal.habitat]}
                  </Text>
                  <Text style={[styles.animalDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {animal.description}
                  </Text>
                  <View style={styles.ratePill}>
                    <Text style={styles.rateText}>Lv {animalLevel} · +{upgradedRate} Star Coins/min</Text>
                  </View>
                  {!owned ? (
                    <TouchableOpacity
                      style={[
                        styles.btn,
                        { backgroundColor: canAfford && !isLocked ? colors.primary : colors.muted },
                      ]}
                      onPress={() => handleBuy(animal.id)}
                      disabled={!canAfford || isLocked}
                    >
                      <Text style={[styles.btnText, { color: canAfford && !isLocked ? "#fff" : colors.mutedForeground }]}>
                        {isLocked ? `Lv ${animal.levelRequired}` : `${animal.price.toLocaleString()} Points`}
                      </Text>
                    </TouchableOpacity>
                  ) : isBought ? (
                    <View style={[styles.btn, { backgroundColor: colors.success + "22" }]}>
                      <Text style={[styles.btnText, { color: colors.success }]}>Added!</Text>
                    </View>
                  ) : (
                    <>
                      <View style={[styles.btn, { backgroundColor: rarityColor + "22" }]}>
                        <Text style={[styles.btnText, { color: rarityColor }]}>
                          {animalLevel >= MAX_ITEM_LEVEL ? "Max Lv" : "Owned"}
                        </Text>
                      </View>
                      {animalLevel < MAX_ITEM_LEVEL && (
                        <TouchableOpacity
                          style={[
                            styles.upgradeBtn,
                            { backgroundColor: canUpgrade && canAffordUpgrade ? "#FFD16622" : colors.muted },
                          ]}
                          onPress={() => handleUpgrade(animal.id)}
                          disabled={!canUpgrade || !canAffordUpgrade}
                          activeOpacity={0.82}
                        >
                          <Text
                            style={[
                              styles.upgradeText,
                              { color: canUpgrade && canAffordUpgrade ? "#FFD166" : colors.mutedForeground },
                            ]}
                          >
                            Upgrade {upgradeCost} Points
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </TouchableOpacity>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  coinBadge: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#173248",
  },
  coinText: { color: "#FFD166", fontSize: 15, fontFamily: "Inter_700Bold" },
  bankrollLabel: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0 },
  pinnedBankroll: { position: "absolute", left: 0, right: 0, zIndex: 90, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10, borderBottomWidth: 1 },
  balanceStrip: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#173248",
  },
  slideDots: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: -8 },
  slideDot: { width: 8, height: 8, borderRadius: 4 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: "47%",
    minHeight: 294,
    borderRadius: 16,
    padding: 12,
    gap: 5,
    alignItems: "center",
    position: "relative",
  },
  rarityBadge: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  rarityBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  lockBadge: {
    position: "absolute",
    top: 30,
    right: 8,
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FF475722",
  },
  lockText: { color: "#FF6B7A", fontSize: 9, fontFamily: "Inter_700Bold" },
  cardAnimal: { width: 78, height: 78, marginVertical: 1 },
  animalName: { fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "center" },
  habitatText: { fontSize: 10, fontFamily: "Inter_700Bold", textAlign: "center" },
  animalDesc: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 15, minHeight: 30 },
  ratePill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(0,180,216,0.14)",
  },
  rateText: { color: "#00B4D8", fontSize: 12, fontFamily: "Inter_700Bold" },
  btn: { borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12, alignItems: "center", width: "100%" },
  btnText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  upgradeBtn: { borderRadius: 10, paddingVertical: 7, paddingHorizontal: 10, alignItems: "center", width: "100%" },
  upgradeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
});
