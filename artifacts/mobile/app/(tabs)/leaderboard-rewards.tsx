import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PinnedHeader, usePinnedHeaderHeight } from "@/components/PinnedHeader";
import { ZOO_ANIMALS } from "@/constants/zooAnimals";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { LEADERBOARD_PRIZES, type LeaderboardBoard, type LeaderboardPrize } from "@/utils/leaderboard";

const BOARDS: Array<{ id: LeaderboardBoard; label: string; title: string }> = [
  { id: "oneMinute", label: "1 min", title: "Monthly 1-Minute Board" },
  { id: "day", label: "Day", title: "Daily Most Answered" },
  { id: "week", label: "Week", title: "Weekly Most Answered" },
  { id: "month", label: "Month", title: "Monthly Most Answered" },
];

function numberText(value: number) {
  return Number.isFinite(value) ? String(value) : "0";
}

export default function LeaderboardRewardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const headerHeight = usePinnedHeaderHeight();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { settings, updateSettings } = useGame();
  const [board, setBoard] = useState<LeaderboardBoard>("oneMinute");

  const activeBoard = BOARDS.find((item) => item.id === board) ?? BOARDS[0];
  const prizes = settings.leaderboardPrizes[board] ?? LEADERBOARD_PRIZES[board];

  const showcasePrize = useMemo(() => prizes.find((prize) => prize.zooAnimalId) ?? prizes[0], [prizes]);
  const showcaseAnimal = showcasePrize?.zooAnimalId
    ? ZOO_ANIMALS.find((animal) => animal.id === showcasePrize.zooAnimalId)
    : null;

  const updatePrize = (rank: number, patch: Partial<LeaderboardPrize>) => {
    const current = settings.leaderboardPrizes[board] ?? LEADERBOARD_PRIZES[board];
    const nextBoard = current.map((prize) => (prize.rank === rank ? { ...prize, ...patch } : prize));
    updateSettings({
      leaderboardPrizes: {
        ...settings.leaderboardPrizes,
        [board]: nextBoard,
      },
    });
  };

  const resetBoard = () => {
    updateSettings({
      leaderboardPrizes: {
        ...settings.leaderboardPrizes,
        [board]: LEADERBOARD_PRIZES[board],
      },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PinnedHeader title="Reward Manager" showSettings={false} />
      <ScrollView
        bounces={false}
        alwaysBounceVertical={false}
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight + 8, paddingBottom: bottomPad + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.showcase, { backgroundColor: "#11152E", borderColor: colors.gold + "88" }]}>
          <View style={styles.showcaseCopy}>
            <Text style={[styles.eyebrow, { color: colors.gold }]}>Leaderboard Giveaway</Text>
            <Text style={[styles.showcaseTitle, { color: colors.foreground }]}>{activeBoard.title}</Text>
            <Text style={[styles.showcaseSub, { color: colors.mutedForeground }]} numberOfLines={2}>
              {showcasePrize?.label ?? "Season prize"} · +{showcasePrize?.points ?? 0} pts · +{showcasePrize?.starCoins ?? 0} Star Coins
            </Text>
          </View>
          {showcaseAnimal ? (
            <View style={[styles.showcaseAnimalWell, { backgroundColor: colors.gold + "18" }]}>
              <Image source={showcaseAnimal.asset} style={styles.showcaseAnimal} resizeMode="contain" />
              <Text style={[styles.showcaseAnimalName, { color: colors.gold }]} numberOfLines={1}>{showcaseAnimal.name}</Text>
            </View>
          ) : (
            <View style={[styles.showcaseAnimalWell, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="award" size={40} color={colors.gold} />
              <Text style={[styles.showcaseAnimalName, { color: colors.gold }]}>No animal</Text>
            </View>
          )}
        </View>

        <View style={styles.boardTabs}>
          {BOARDS.map((item) => {
            const selected = item.id === board;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.boardTab,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.84}
                onPress={() => setBoard(item.id)}
              >
                <Text style={[styles.boardTabText, { color: selected ? "#FFFFFF" : colors.mutedForeground }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {prizes.map((prize) => {
          const selectedAnimal = prize.zooAnimalId ? ZOO_ANIMALS.find((animal) => animal.id === prize.zooAnimalId) : null;
          return (
            <View key={prize.rank} style={[styles.prizeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.prizeHeader}>
                <View style={[styles.rankBadge, { backgroundColor: colors.gold + "22" }]}>
                  <Text style={[styles.rankText, { color: colors.gold }]}>#{prize.rank}</Text>
                </View>
                <Text style={[styles.prizeCardTitle, { color: colors.foreground }]}>Rank {prize.rank} Prize</Text>
              </View>

              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Showcase label</Text>
              <TextInput
                value={prize.label}
                onChangeText={(label) => updatePrize(prize.rank, { label })}
                placeholder="Prize label"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              />

              <View style={styles.amountRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Points</Text>
                  <TextInput
                    value={numberText(prize.points)}
                    onChangeText={(text) => updatePrize(prize.rank, { points: Math.max(0, Math.floor(Number(text) || 0)) })}
                    keyboardType="number-pad"
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Star Coins</Text>
                  <TextInput
                    value={numberText(prize.starCoins)}
                    onChangeText={(text) => updatePrize(prize.rank, { starCoins: Math.max(0, Math.floor(Number(text) || 0)) })}
                    keyboardType="number-pad"
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  />
                </View>
              </View>

              <View style={styles.selectedAnimalRow}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Special zoo animal</Text>
                <TouchableOpacity
                  style={[styles.clearAnimalBtn, { borderColor: colors.border }]}
                  activeOpacity={0.82}
                  onPress={() => updatePrize(prize.rank, { zooAnimalId: undefined })}
                >
                  <Text style={[styles.clearAnimalText, { color: colors.mutedForeground }]}>None</Text>
                </TouchableOpacity>
              </View>
              {selectedAnimal ? (
                <View style={[styles.selectedAnimal, { backgroundColor: colors.gold + "12", borderColor: colors.gold + "66" }]}>
                  <Image source={selectedAnimal.asset} style={styles.selectedAnimalAsset} resizeMode="contain" />
                  <Text style={[styles.selectedAnimalText, { color: colors.gold }]}>Giving away {selectedAnimal.name}</Text>
                </View>
              ) : null}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.animalStrip}>
                {ZOO_ANIMALS.map((animal) => {
                  const selected = animal.id === prize.zooAnimalId;
                  return (
                    <TouchableOpacity
                      key={animal.id}
                      style={[
                        styles.animalChoice,
                        {
                          backgroundColor: selected ? colors.primary + "22" : "rgba(255,255,255,0.04)",
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                      activeOpacity={0.84}
                      onPress={() => updatePrize(prize.rank, { zooAnimalId: animal.id })}
                    >
                      <Image source={animal.asset} style={styles.animalAsset} resizeMode="contain" />
                      <Text style={[styles.animalName, { color: selected ? colors.foreground : colors.mutedForeground }]} numberOfLines={1}>
                        {animal.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          );
        })}

        <TouchableOpacity style={[styles.resetBtn, { borderColor: colors.border }]} activeOpacity={0.84} onPress={resetBoard}>
          <Feather name="rotate-ccw" size={18} color={colors.mutedForeground} />
          <Text style={[styles.resetText, { color: colors.mutedForeground }]}>Reset this board to defaults</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 18, gap: 14 },
  showcase: {
    minHeight: 136,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  showcaseCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 12, fontFamily: "Inter_700Bold", textTransform: "uppercase" },
  showcaseTitle: { fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 4 },
  showcaseSub: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 4, lineHeight: 18 },
  showcaseAnimalWell: { width: 104, height: 104, borderRadius: 22, alignItems: "center", justifyContent: "center", padding: 8 },
  showcaseAnimal: { width: 76, height: 70 },
  showcaseAnimalName: { fontSize: 11, fontFamily: "Inter_700Bold", maxWidth: "100%" },
  boardTabs: { flexDirection: "row", gap: 8 },
  boardTab: { flex: 1, height: 48, borderRadius: 15, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  boardTabText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  prizeCard: { borderRadius: 22, borderWidth: 1.5, padding: 14, gap: 10 },
  prizeHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  rankBadge: { width: 42, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  prizeCardTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  inputLabel: { fontSize: 12, fontFamily: "Inter_700Bold" },
  input: { height: 48, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 12, fontSize: 16, fontFamily: "Inter_700Bold" },
  amountRow: { flexDirection: "row", gap: 10 },
  selectedAnimalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  clearAnimalBtn: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  clearAnimalText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  selectedAnimal: { minHeight: 54, borderRadius: 14, borderWidth: 1.5, flexDirection: "row", alignItems: "center", gap: 8, padding: 8 },
  selectedAnimalAsset: { width: 42, height: 42 },
  selectedAnimalText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  animalStrip: { gap: 8, paddingVertical: 2 },
  animalChoice: { width: 86, height: 94, borderRadius: 16, borderWidth: 1.5, alignItems: "center", justifyContent: "center", padding: 6 },
  animalAsset: { width: 54, height: 48 },
  animalName: { fontSize: 10, fontFamily: "Inter_700Bold", maxWidth: "100%" },
  resetBtn: { height: 54, borderRadius: 16, borderWidth: 1.5, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  resetText: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
