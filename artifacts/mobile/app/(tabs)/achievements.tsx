import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
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
  ACHIEVEMENT_ASSETS,
  ACHIEVEMENT_BADGE_ASSETS,
} from "@/constants/achievementAssets";
import { ACHIEVEMENTS } from "@/constants/achievements";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { PinnedHeader, usePinnedHeaderHeight } from "@/components/PinnedHeader";

const CATEGORIES = [
  { id: "all", label: "All", prefix: null },
  { id: "unlocked", label: "Unlocked", prefix: null },
  { id: "add", label: "Add", prefix: "add_" },
  { id: "sub", label: "Sub", prefix: "sub_" },
  { id: "mul", label: "Times", prefix: "mul_" },
  { id: "div", label: "Divide", prefix: "div_" },
  { id: "score", label: "Score", prefix: "score_" },
  { id: "streak", label: "Streak", prefix: "streak_" },
  { id: "drills", label: "Drills", prefix: "drills_" },
  { id: "special", label: "Special", prefix: null },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];
type AchievementGroupId = Exclude<CategoryId, "all" | "unlocked">;

const SPECIAL_IDS = new Set([
  "all_ops",
  "speed_demon",
  "mix_master",
  "hard_hero",
  "marathon",
  "perfect_start",
  "first_shop",
  "animal_collector",
  "astronaut",
]);

function getCategory(id: string): AchievementGroupId {
  if (SPECIAL_IDS.has(id)) return "special";
  if (id.startsWith("add_")) return "add";
  if (id.startsWith("sub_")) return "sub";
  if (id.startsWith("mul_")) return "mul";
  if (id.startsWith("div_")) return "div";
  if (id.startsWith("score_")) return "score";
  if (id.startsWith("streak_")) return "streak";
  if (id.startsWith("drills_")) return "drills";
  return "special";
}

const formatNumber = (value: number) => value.toLocaleString();

export default function AchievementsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gameData, claimBonus } = useGame();
  const [filter, setFilter] = useState<CategoryId>("all");
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null);
  const [justClaimed, setJustClaimed] = useState<Record<string, number>>({});

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const headerHeight = usePinnedHeaderHeight();

  const unlocked = gameData.unlockedAchievements;
  const unclaimed = gameData.unclaimedBonuses;
  const unlockedCount = Object.keys(unlocked).length;
  const totalCount = ACHIEVEMENTS.length;
  const progressPct = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;
  const totalUnclaimedPts = Object.values(unclaimed).reduce((sum, value) => sum + value, 0);

  const grouped = useMemo(() => {
    const groups: Record<AchievementGroupId, typeof ACHIEVEMENTS> = {
      add: [],
      sub: [],
      mul: [],
      div: [],
      score: [],
      streak: [],
      drills: [],
      special: [],
    };
    for (const achievement of ACHIEVEMENTS) {
      groups[getCategory(achievement.id)].push(achievement);
    }
    return groups;
  }, []);

  const visibleAchievements = useMemo(() => {
    if (filter === "all") return ACHIEVEMENTS;
    if (filter === "unlocked") return ACHIEVEMENTS.filter((achievement) => !!unlocked[achievement.id]);
    return grouped[filter];
  }, [filter, grouped, unlocked]);

  const selectedAchievement = useMemo(() => {
    const explicit = ACHIEVEMENTS.find((achievement) => achievement.id === selectedAchievementId);
    if (explicit) return explicit;
    return (
      ACHIEVEMENTS.find((achievement) => !!unlocked[achievement.id]) ??
      visibleAchievements[0] ??
      ACHIEVEMENTS[0]
    );
  }, [selectedAchievementId, unlocked, visibleAchievements]);

  const selectedCategory = getCategory(selectedAchievement.id);
  const selectedUnlocked = !!unlocked[selectedAchievement.id];
  const selectedBadgeSource = selectedUnlocked
    ? ACHIEVEMENT_BADGE_ASSETS[selectedCategory]
    : ACHIEVEMENT_ASSETS.locked;

  const handleClaim = (achievementId: string, points: number) => {
    const claimed = claimBonus(achievementId);
    if (claimed <= 0) return;
    setJustClaimed((prev) => ({ ...prev, [achievementId]: points }));
    setTimeout(() => {
      setJustClaimed((prev) => {
        const next = { ...prev };
        delete next[achievementId];
        return next;
      });
    }, 1600);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PinnedHeader title="Badges" subtitle="Claim rewards from your math wins" />
      <ScrollView
        bounces={false}
        alwaysBounceVertical={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: headerHeight + 8, paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.pointsPill, { backgroundColor: colors.gold + "22", alignSelf: "flex-end" }]}>
          <Text style={[styles.pointsPillText, { color: colors.gold }]}>
            {formatNumber(gameData.points)} Points
          </Text>
        </View>

          <ImageBackground
            source={ACHIEVEMENT_ASSETS.hero}
            imageStyle={styles.heroImage}
            resizeMode="cover"
            style={[styles.hero, { borderColor: colors.border }]}
          >
            <View style={styles.heroShade} />
            <View style={styles.heroTop}>
              <Image source={selectedBadgeSource} style={styles.heroBadge} resizeMode="contain" />
              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle} numberOfLines={1}>{selectedAchievement.title}</Text>
                <Text style={styles.heroSub} numberOfLines={2}>{selectedAchievement.description}</Text>
              </View>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{selectedUnlocked ? "Unlocked" : "Locked"}</Text>
                <Text style={styles.heroStatLabel}>selected</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>+{selectedAchievement.bonusPoints}</Text>
                <Text style={styles.heroStatLabel}>Points</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
            </View>
          </ImageBackground>

        {totalUnclaimedPts > 0 && (
          <View style={[styles.claimPanel, { backgroundColor: colors.gold + "18", borderColor: colors.gold + "88" }]}>
            <Image source={ACHIEVEMENT_ASSETS.reward} style={styles.claimAsset} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.claimTitle, { color: colors.gold }]}>Bonus Points ready</Text>
              <Text style={[styles.claimSub, { color: colors.mutedForeground }]}>
                Claim +{formatNumber(totalUnclaimedPts)} Points from unlocked badges below.
              </Text>
            </View>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {CATEGORIES.map((cat) => {
            const count =
              cat.id === "all"
                ? unlockedCount
                : cat.id === "unlocked"
                  ? unlockedCount
                : grouped[cat.id].filter((achievement) => !!unlocked[achievement.id]).length;
            const total = cat.id === "all" || cat.id === "unlocked" ? totalCount : grouped[cat.id].length;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.tab,
                  {
                    backgroundColor: filter === cat.id ? colors.primary : colors.card,
                    borderColor: filter === cat.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setFilter(cat.id)}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, { color: filter === cat.id ? "#fff" : colors.foreground }]}>
                  {cat.label}
                </Text>
                <Text style={[styles.tabCount, { color: filter === cat.id ? "#fff" : colors.mutedForeground }]}>
                  {count}/{total}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.badgeGrid}>
          {visibleAchievements.map((achievement) => {
            const category = getCategory(achievement.id);
            const isUnlocked = !!unlocked[achievement.id];
            const bonus = unclaimed[achievement.id] ?? 0;
            const wasClaimed = !!justClaimed[achievement.id];
            const hasClaim = isUnlocked && bonus > 0 && !wasClaimed;
            const badgeSource = isUnlocked
              ? ACHIEVEMENT_BADGE_ASSETS[category]
              : ACHIEVEMENT_ASSETS.locked;
            const isSelected = selectedAchievement.id === achievement.id;

            return (
              <TouchableOpacity
                key={achievement.id}
                style={[
                  styles.badgeCard,
                  {
                    backgroundColor: isUnlocked ? colors.card : "#131227",
                    borderColor: isSelected ? colors.gold : isUnlocked ? achievement.color + "AA" : colors.border,
                    opacity: isUnlocked ? 1 : 0.62,
                  },
                ]}
                activeOpacity={0.88}
                onPress={() => setSelectedAchievementId(achievement.id)}
              >
                <View style={[styles.badgeArtWell, { backgroundColor: achievement.color + (isUnlocked ? "18" : "08") }]}>
                  <Image source={badgeSource} style={styles.badgeAsset} resizeMode="contain" />
                  {hasClaim && <View style={[styles.claimDot, { backgroundColor: colors.gold }]} />}
                </View>

                <View style={styles.badgeCopy}>
                  <View style={styles.badgeTitleRow}>
                    <Text
                      style={[styles.badgeTitle, { color: isUnlocked ? colors.foreground : colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {achievement.title}
                    </Text>
                    <Text style={[styles.badgeBonus, { color: colors.gold }]}>
                      +{achievement.bonusPoints} Points
                    </Text>
                  </View>
                  <Text style={[styles.badgeDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {achievement.description}
                  </Text>
                </View>

                {hasClaim && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.gold }]}
                    onPress={() => handleClaim(achievement.id, bonus)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.actionText}>Claim +{bonus}</Text>
                  </TouchableOpacity>
                )}
                {wasClaimed && (
                  <View style={[styles.actionBtn, { backgroundColor: colors.success + "22" }]}>
                    <Text style={[styles.actionText, { color: colors.success }]}>Claimed</Text>
                  </View>
                )}
                {isUnlocked && !hasClaim && !wasClaimed && (
                  <View style={[styles.actionBtn, { backgroundColor: achievement.color + "1F" }]}>
                    <Feather name="check" size={15} color={achievement.color} />
                    <Text style={[styles.actionText, { color: achievement.color }]}>Unlocked</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 14 },
  stickyTop: {
    gap: 12,
    paddingBottom: 10,
    zIndex: 5,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1, alignItems: "center" },
  title: { fontSize: 32, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2, textAlign: "center" },
  pointsPill: {
    minWidth: 58,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  pointsPillText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  hero: {
    height: 214,
    borderRadius: 28,
    borderWidth: 1.5,
    overflow: "hidden",
    padding: 14,
    justifyContent: "space-between",
  },
  heroImage: { borderRadius: 28 },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 6, 20, 0.3)",
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroBadge: { width: 104, height: 104 },
  heroCopy: { flex: 1 },
  heroTitle: { color: "#fff", fontSize: 25, fontFamily: "Inter_700Bold" },
  heroSub: { color: "rgba(255,255,255,0.78)", fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 3, lineHeight: 18 },
  heroStats: { flexDirection: "row", gap: 8 },
  heroStat: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "rgba(7, 10, 30, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroStatValue: { color: "#FFD05A", fontSize: 17, fontFamily: "Inter_700Bold" },
  heroStatLabel: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#FFD05A" },
  claimPanel: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  claimAsset: { width: 54, height: 54 },
  claimTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  claimSub: { fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 17, marginTop: 2 },
  tabRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  tab: {
    minWidth: 74,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  tabText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  tabCount: { fontSize: 10, fontFamily: "Inter_700Bold", marginTop: 2 },
  badgeGrid: { gap: 12 },
  badgeCard: {
    width: "100%",
    minHeight: 154,
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 12,
    gap: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  badgeArtWell: {
    width: 114,
    height: 114,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeAsset: { width: 104, height: 104 },
  claimDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#141225",
  },
  badgeCopy: { flex: 1, gap: 6, minWidth: 0 },
  badgeTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  badgeTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold" },
  badgeBonus: { fontSize: 13, fontFamily: "Inter_700Bold" },
  badgeDesc: { fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 17 },
  actionBtn: {
    minWidth: 92,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },
  actionText: { color: "#141225", fontSize: 13, fontFamily: "Inter_700Bold" },
});
