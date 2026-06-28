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
import { ZOO_ANIMALS, RARITY_COLORS } from "@/constants/zooAnimals";
import {
  getAnimalLevelKey,
  getItemUpgradeCost,
  getStoredItemLevel,
  MAX_ITEM_LEVEL,
  useGame,
} from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { PinnedHeader, usePinnedHeaderHeight } from "@/components/PinnedHeader";

const RARITY_LABELS = { common: "Common", uncommon: "Uncommon", rare: "Rare", legendary: "Legendary" };
const HABITAT_BACKGROUNDS = {
  sahara: require("@/assets/game/zoo-habitats/sahara.png"),
  bamboo: require("@/assets/game/zoo-habitats/bamboo.png"),
  gorilla: require("@/assets/game/zoo-habitats/gorilla.png"),
  penguin: require("@/assets/game/zoo-habitats/penguin.png"),
  woodland: require("@/assets/game/zoo-habitats/woodland.png"),
};

function ZooScene({
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
  const animal = ZOO_ANIMALS[index];
  const rarityColor = RARITY_COLORS[animal.rarity];
  const upgradedRate = animal.starCoinsPerHour * animalLevel;

  return (
    <View style={scene.enclosure}>
      <ImageBackground
        source={HABITAT_BACKGROUNDS[animal.habitat]}
        style={scene.background}
        imageStyle={scene.backgroundImage}
        resizeMode="cover"
      >
        <View style={scene.topOverlay}>
          <View style={[scene.rarityPill, { backgroundColor: rarityColor + "DD" }]}>
            <Text style={scene.rarityPillText}>{RARITY_LABELS[animal.rarity]}</Text>
          </View>
          <Text style={scene.counterText}>{index + 1}/{ZOO_ANIMALS.length} · Lv {animalLevel}</Text>
        </View>

        <TouchableOpacity style={[scene.navButton, scene.navLeft]} onPress={onPrev} activeOpacity={0.75}>
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[scene.navButton, scene.navRight]} onPress={onNext} activeOpacity={0.75}>
          <Feather name="chevron-right" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={scene.stage}>
          <Image
            source={animal.asset}
            style={[scene.animalSprite, !owned && scene.lockedAnimal]}
            resizeMode="contain"
          />
          {!owned && (
            <View style={scene.lockedPill}>
              <Feather name="lock" size={12} color="#fff" />
              <Text style={scene.lockedText}>Lv {animal.levelRequired}</Text>
            </View>
          )}
        </View>

        <View style={scene.caption}>
          <Text style={scene.animalName}>{animal.name}</Text>
          <Text style={scene.habitatName}>{animal.habitat} habitat</Text>
          <Text style={scene.rateLine}>+{upgradedRate} Star Coins/min</Text>
        </View>

        {!owned ? (
          <TouchableOpacity
            style={[scene.actionPill, { opacity: canBuy && !locked ? 1 : 0.72 }]}
            onPress={onBuy}
            disabled={!canBuy || locked}
            activeOpacity={0.82}
          >
            <Feather name={locked ? "lock" : "star"} size={13} color="#121124" />
            <Text style={scene.actionText}>
              {locked ? `Lv ${animal.levelRequired}` : `${animal.price.toLocaleString()} Points`}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              scene.actionPill,
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
            <Text style={scene.actionText}>
              {animalLevel >= MAX_ITEM_LEVEL ? "Max Lv" : `Upgrade ${upgradeCost} Points`}
            </Text>
          </TouchableOpacity>
        )}
      </ImageBackground>
    </View>
  );
}

const scene = StyleSheet.create({
  enclosure: {
    borderRadius: 22,
    overflow: "hidden",
    height: 260,
    backgroundColor: "#16240F",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  background: {
    flex: 1,
    position: "relative",
  },
  backgroundImage: {
    borderRadius: 22,
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
  rarityPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rarityPillText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
  },
  counterText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    backgroundColor: "rgba(0,0,0,0.42)",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  navButton: {
    position: "absolute",
    top: 104,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  navLeft: { left: 10 },
  navRight: { right: 10 },
  stage: {
    position: "absolute",
    left: 72,
    right: 72,
    bottom: 42,
    alignItems: "center",
  },
  animalSprite: {
    width: 140,
    height: 140,
  },
  lockedAnimal: {
    opacity: 0.45,
  },
  lockedPill: {
    marginTop: -8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  lockedText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  caption: {
    position: "absolute",
    left: 14,
    bottom: 12,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  animalName: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  habitatName: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "capitalize",
  },
  rateLine: { color: "#A8F58C", fontSize: 11, fontFamily: "Inter_700Bold", marginTop: 2 },
  actionPill: {
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
  actionText: { color: "#121124", fontSize: 13, fontFamily: "Inter_700Bold" },
});

export default function ZooScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gameData, buyAnimal, upgradeAnimal, getLevel } = useGame();
  const [justBought, setJustBought] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const headerHeight = usePinnedHeaderHeight();

  const playerLevel = getLevel(gameData.points);
  const currentAnimal = ZOO_ANIMALS[currentSlide];
  const currentOwned = gameData.zooAnimals.includes(currentAnimal.id);
  const currentLocked = playerLevel < currentAnimal.levelRequired;
  const currentCanBuy = gameData.points >= currentAnimal.price;
  const currentLevelKey = getAnimalLevelKey("zoo", currentAnimal.id);
  const currentAnimalLevel = getStoredItemLevel(gameData.itemLevels, currentLevelKey);
  const currentUpgradeCost = getItemUpgradeCost(currentAnimal.price, currentAnimalLevel);
  const currentCanUpgrade = currentOwned && currentAnimalLevel < MAX_ITEM_LEVEL;
  const currentCanAffordUpgrade = gameData.points >= currentUpgradeCost;

  const handleBuy = (id: string) => {
    const success = buyAnimal(id, "zoo");
    if (success) {
      setJustBought(id);
      setTimeout(() => setJustBought(null), 1500);
    }
  };

  const handleUpgrade = (id: string) => {
    upgradeAnimal(id, "zoo");
  };

  const goPrev = () => {
    setCurrentSlide((i) => (i === 0 ? ZOO_ANIMALS.length - 1 : i - 1));
  };

  const goNext = () => {
    setCurrentSlide((i) => (i + 1) % ZOO_ANIMALS.length);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PinnedHeader
        title="School Zoo"
        subtitle={`${gameData.zooAnimals.length}/${ZOO_ANIMALS.length} adopted`}
      />
      <View style={[styles.pinnedBankroll, { top: headerHeight, backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={[styles.balanceStrip, { backgroundColor: "#1A3A12" }]}>
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
        <ZooScene
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
          {ZOO_ANIMALS.map((animal, i) => (
            <TouchableOpacity
              key={animal.id}
              style={[
                styles.slideDot,
                {
                  backgroundColor: i === currentSlide ? colors.primary : colors.border,
                  opacity: gameData.zooAnimals.includes(animal.id) ? 1 : 0.45,
                },
              ]}
              onPress={() => setCurrentSlide(i)}
              accessibilityLabel={`Show ${animal.name} habitat`}
            />
          ))}
        </View>

        {/* Animal catalog */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Land Animals</Text>
          <View style={styles.grid}>
            {ZOO_ANIMALS.map((animal) => {
              const owned = gameData.zooAnimals.includes(animal.id);
              const canAfford = gameData.points >= animal.price;
              const isBought = justBought === animal.id;
              const rarityColor = RARITY_COLORS[animal.rarity];
              const isLocked = playerLevel < animal.levelRequired;
              const animalLevel = getStoredItemLevel(
                gameData.itemLevels,
                getAnimalLevelKey("zoo", animal.id)
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
                      borderColor: owned ? rarityColor + "66" : colors.border,
                      borderWidth: owned ? 1.5 : 1,
                      opacity: isLocked && !owned ? 0.65 : 1,
                    },
                  ]}
                  onPress={() => setCurrentSlide(ZOO_ANIMALS.findIndex((a) => a.id === animal.id))}
                  activeOpacity={0.82}
                >
                  <View style={[styles.rarityBadge, { backgroundColor: rarityColor + "22" }]}>
                    <Text style={[styles.rarityText, { color: rarityColor }]}>{RARITY_LABELS[animal.rarity]}</Text>
                  </View>
                  {isLocked && !owned && (
                    <View style={[styles.lockBadge, { backgroundColor: "#FF475722" }]}>
                      <Feather name="lock" size={9} color="#FF4757" />
                      <Text style={[styles.lockText, { color: "#FF4757" }]}>Lv {animal.levelRequired}</Text>
                    </View>
                  )}
                  <Image source={animal.asset} style={styles.animalAsset} resizeMode="contain" />
                  <Text style={[styles.animalName, { color: colors.foreground }]} numberOfLines={1}>{animal.name}</Text>
                  <Text style={[styles.animalDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{animal.description}</Text>
                  <View style={styles.coinRate}>
                    <Text style={[styles.coinRateText, { color: "#4CAF50" }]}>Lv {animalLevel} · +{upgradedRate} Star Coins/min</Text>
                  </View>
                  {!owned ? (
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: (canAfford && !isLocked) ? colors.primary : colors.muted }]}
                      onPress={() => handleBuy(animal.id)}
                      disabled={!canAfford || isLocked}
                    >
                      <Text style={[styles.btnText, { color: (canAfford && !isLocked) ? "#fff" : colors.mutedForeground }]}>
                        {isLocked ? `Lv ${animal.levelRequired}` : `${animal.price.toLocaleString()} Points`}
                      </Text>
                    </TouchableOpacity>
                  ) : isBought ? (
                    <View style={[styles.btn, { backgroundColor: colors.success + "22" }]}>
                      <Text style={[styles.btnText, { color: colors.success }]}>Adopted!</Text>
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
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  coinBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 4 },
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
    backgroundColor: "#1A3A12",
  },
  slideDots: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: -8 },
  slideDot: { width: 8, height: 8, borderRadius: 4 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12 },
  chipAsset: { width: 24, height: 24 },
  chipLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "47%", borderRadius: 16, padding: 12, gap: 5, alignItems: "center", position: "relative" },
  rarityBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  rarityText: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  lockBadge: { position: "absolute", top: 28, right: 8, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, flexDirection: "row", alignItems: "center", gap: 2 },
  lockText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  animalAsset: { width: 74, height: 74, marginVertical: 2 },
  animalName: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  animalDesc: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 15, minHeight: 30 },
  coinRate: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  coinRateText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  btn: { borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12, alignItems: "center", width: "100%" },
  btnText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  upgradeBtn: { borderRadius: 10, paddingVertical: 7, paddingHorizontal: 10, alignItems: "center", width: "100%" },
  upgradeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
});
