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
import AchievementCard from "@/components/AchievementCard";
import { ACHIEVEMENTS } from "@/constants/achievements";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = [
  { id: "add", label: "Addition", prefix: "add_" },
  { id: "sub", label: "Subtraction", prefix: "sub_" },
  { id: "mul", label: "Multiplication", prefix: "mul_" },
  { id: "div", label: "Division", prefix: "div_" },
  { id: "score", label: "Score", prefix: "score_" },
  { id: "streak", label: "Streak", prefix: "streak_" },
  { id: "special", label: "Special", prefix: null },
];

const SPECIAL_IDS = new Set(["all_ops", "speed_demon"]);

export default function AchievementsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gameData } = useGame();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const unlocked = gameData.unlockedAchievements;
  const unlockedCount = Object.keys(unlocked).length;
  const totalCount = ACHIEVEMENTS.length;

  const getCategory = (id: string) => {
    if (SPECIAL_IDS.has(id)) return "special";
    for (const cat of CATEGORIES) {
      if (cat.prefix && id.startsWith(cat.prefix)) return cat.id;
    }
    return "special";
  };

  const grouped: Record<string, typeof ACHIEVEMENTS> = {};
  for (const ach of ACHIEVEMENTS) {
    const cat = getCategory(ach.id);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(ach);
  }

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
            Achievements
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress */}
        <View
          style={[
            styles.progressCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.progressRow}>
            <Feather name="award" size={20} color={colors.gold} />
            <Text style={[styles.progressText, { color: colors.foreground }]}>
              {unlockedCount} / {totalCount} unlocked
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.gold,
                  width: `${(unlockedCount / totalCount) * 100}%` as any,
                },
              ]}
            />
          </View>
        </View>

        {/* Categories */}
        {CATEGORIES.map((cat) => {
          const achs = grouped[cat.id];
          if (!achs || achs.length === 0) return null;
          const catUnlocked = achs.filter((a) => !!unlocked[a.id]).length;

          return (
            <View key={cat.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {cat.label}
                </Text>
                <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
                  {catUnlocked}/{achs.length}
                </Text>
              </View>
              <View style={styles.achList}>
                {achs.map((ach) => (
                  <AchievementCard
                    key={ach.id}
                    achievement={ach}
                    unlockedAt={unlocked[ach.id]}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 24 },
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
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  progressCard: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  sectionCount: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  achList: { gap: 8 },
});
