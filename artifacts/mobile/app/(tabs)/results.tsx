import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ACHIEVEMENT_BADGE_ASSETS } from "@/constants/achievementAssets";
import { ACHIEVEMENTS } from "@/constants/achievements";
import { SOLAR_SYSTEM } from "@/constants/planets";
import { RESULT_ASSETS } from "@/constants/resultAssets";
import { GEM_ASSETS } from "@/constants/workshopAssets";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { getOpLabel } from "@/utils/mathUtils";
import type { Operation } from "@/constants/achievements";
import { PinnedHeader, usePinnedHeaderHeight } from "@/components/PinnedHeader";
import { XpBar } from "@/components/XpBar";
import { useProfiles } from "@/context/ProfileContext";
import { submitLeaderboardScore } from "@/utils/leaderboard";

const OP_COLORS: Record<Operation, string> = {
  add: "#7C6FFF",
  sub: "#FF6B9D",
  mul: "#00D9A3",
  div: "#FF9F43",
};

function getAchievementCategory(id: string) {
  if (id.startsWith("add_")) return "add";
  if (id.startsWith("sub_")) return "sub";
  if (id.startsWith("mul_")) return "mul";
  if (id.startsWith("div_")) return "div";
  if (id.startsWith("score_")) return "score";
  if (id.startsWith("streak_")) return "streak";
  if (id.startsWith("drills_")) return "drills";
  return "special";
}

const formatReward = (value: number) =>
  Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

export default function ResultsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { lastSession, gameData, getLevel, getLevelInfo, getDrillMultiplier, getDrillCoinBonus } = useGame();
  const { activeProfile } = useProfiles();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const headerHeight = usePinnedHeaderHeight();

  const scoreAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pointsAnim = useRef(new Animated.Value(0)).current;
  const submittedScoreKey = useRef<string | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scoreAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(400),
        Animated.spring(pointsAnim, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, scoreAnim, pointsAnim]);

  useEffect(() => {
    if (!lastSession || !activeProfile) return;
    const key = `${activeProfile.id}:${lastSession.totalGames}:${lastSession.score}:${lastSession.difficulty}`;
    if (submittedScoreKey.current === key) return;
    submittedScoreKey.current = key;
    submitLeaderboardScore({
      playerId: activeProfile.id,
      playerName: activeProfile.name,
      avatar: activeProfile.avatar,
      score: lastSession.score,
      difficulty: lastSession.difficulty,
      operations: lastSession.operations,
      timeLimit: lastSession.timeLimit,
      maxStreak: lastSession.maxStreak,
      pointsEarned: lastSession.pointsEarned,
      starCoinsEarned: lastSession.starCoinsEarned,
    }).catch(() => {});
  }, [activeProfile, lastSession]);

  if (!lastSession) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            styles.homeBtn,
            { backgroundColor: colors.primary, marginTop: topPad + 20 },
          ]}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.homeBtnText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { score, correctByOp, maxStreak, operations, pointsEarned } =
    lastSession as any;
  const starCoinsEarned: number = (lastSession as any).starCoinsEarned ?? 0;
  const planetGemsEarned: Record<string, number> = (lastSession as any).planetGemsEarned ?? {};
  const gemRewardEntries = Object.entries(planetGemsEarned).filter(([, amount]) => amount > 0);
  const newAchievementIds: string[] = (lastSession as any).newAchievements ?? [];
  const newAchievements = ACHIEVEMENTS.filter((a) =>
    newAchievementIds.includes(a.id)
  );

  const drillMultiplier = getDrillMultiplier();
  const drillCoinBonus = getDrillCoinBonus();
  const hasInventionBonus = drillMultiplier > 1 || drillCoinBonus > 0;

  const isPersonalBest = score > 0 && score >= gameData.allTimeBest;
  const totalBonusAvail = newAchievements.reduce(
    (s, a) => s + a.bonusPoints,
    0
  );

  const currentLevel = getLevel(gameData.points);
  const prevPoints = gameData.points - pointsEarned;
  const prevLevel = getLevel(prevPoints < 0 ? 0 : prevPoints);
  const didLevelUp = currentLevel > prevLevel;
  const levelInfo = getLevelInfo(gameData.points);
  const nextLevelTitle = levelInfo.nextLevelXp
    ? getLevelInfo(levelInfo.nextLevelXp).title
    : levelInfo.title;

  const scoreScale = scoreAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const pointsScale = pointsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PinnedHeader title="Results" />
      <ScrollView
        bounces={false}
        alwaysBounceVertical={false}
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight + 8, paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={["#17153A", "#092B3B", "#21163C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroCopy}>
              <Text style={[styles.title, { color: colors.foreground }]}>Drill Complete</Text>
              <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>Rewards added while you played</Text>
            </View>
            <Animated.View style={[styles.scoreOrb, { borderColor: colors.primary, transform: [{ scale: scoreScale }] }]}>
              <Image source={RESULT_ASSETS.trophy} style={styles.scoreTrophy} resizeMode="contain" />
              <Text style={[styles.scoreNumber, { color: colors.primary }]}>{score}</Text>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>correct</Text>
            </Animated.View>
          </LinearGradient>

          {isPersonalBest && score > 0 && (
            <View
              style={[
                styles.pbBadge,
                { backgroundColor: colors.gold + "22" },
              ]}
            >
              <Image source={RESULT_ASSETS.personalBest} style={styles.badgeAsset} resizeMode="contain" />
              <Text style={[styles.pbText, { color: colors.gold }]}>
                Personal Best!
              </Text>
            </View>
          )}

          {/* Level Up banner */}
          {didLevelUp && (
            <View style={[styles.levelUpBanner, { backgroundColor: "#7C6FFF22", borderColor: "#7C6FFF" }]}>
              <Image source={RESULT_ASSETS.trophy} style={styles.levelUpAsset} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.levelUpText, { color: "#7C6FFF" }]}>
                  Level Up! Lv {prevLevel} → Lv {currentLevel}
                </Text>
                <Text style={[styles.levelUpSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {levelInfo.title}
                </Text>
              </View>
            </View>
          )}

          {/* XP and points earned */}
          <Animated.View
            style={[
              styles.pointsCard,
              {
                backgroundColor: colors.gold + "18",
                borderColor: colors.gold + "66",
                transform: [{ scale: pointsScale }],
              },
            ]}
          >
            <Image source={RESULT_ASSETS.points} style={styles.rewardAsset} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.pointsEarned, { color: colors.gold }]}>
                +{formatReward(pointsEarned)} XP gained!
              </Text>
              <Text
                style={[
                  styles.pointsBalance,
                  { color: colors.mutedForeground },
                ]}
              >
                {formatReward(gameData.points)} Points · {levelInfo.title}
              </Text>
              <View style={styles.resultXpBarWrap}>
                <XpBar progress={levelInfo.progress} height={11} />
              </View>
              <Text style={[styles.resultXpMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                {levelInfo.isMaxLevel
                  ? "Maximum rank reached"
                  : `${levelInfo.xpToNext.toLocaleString()} XP to ${nextLevelTitle}`}
              </Text>
            </View>
            {totalBonusAvail > 0 && (
              <Text style={[styles.bonusHint, { color: colors.gold }]}>
                +{totalBonusAvail}{"\n"}to claim
              </Text>
            )}
          </Animated.View>

          {/* Star Coins earned */}
          <View style={[styles.coinsCard, { backgroundColor: "#00B4D818", borderColor: "#00B4D866" }]}>
            <Image source={RESULT_ASSETS.starCoins} style={styles.rewardAsset} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.coinsEarned, { color: "#00B4D8" }]}>
                +{formatReward(starCoinsEarned)} Star Coins this drill!
              </Text>
              <Text style={[styles.coinsBalance, { color: colors.mutedForeground }]}>
                Balance: {formatReward(gameData.starCoins)} Star Coins
              </Text>
            </View>
          </View>

          {gemRewardEntries.length > 0 && (
            <View style={[styles.gemRewardCard, { backgroundColor: "#7C6FFF18", borderColor: "#7C6FFF66" }]}>
              <View style={styles.gemRewardHead}>
                <Feather name="tool" size={20} color="#B8A9FF" />
                <Text style={[styles.gemRewardTitle, { color: colors.foreground }]}>Workshop stones found</Text>
              </View>
              <View style={styles.gemRewardRow}>
                {gemRewardEntries.map(([planetId, amount]) => {
                  const planet = SOLAR_SYSTEM.find((body) => body.id === planetId);
                  return (
                    <View key={planetId} style={styles.gemRewardPill}>
                      <Image source={GEM_ASSETS[planetId]} style={styles.gemRewardIcon} resizeMode="contain" />
                      <Text style={styles.gemRewardText}>
                        +{amount} {planet?.name ?? "Stone"}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Invention bonus line */}
          {hasInventionBonus && (
            <View style={[styles.inventionBonusRow, { backgroundColor: "#9C27B011", borderColor: "#9C27B044" }]}>
              <Text style={[styles.inventionBonusText, { color: "#CE93D8" }]}>
                {drillMultiplier > 1 ? `×${drillMultiplier.toFixed(2)} multiplier` : ""}
                {drillMultiplier > 1 && drillCoinBonus > 0 ? "  ·" : ""}
                {drillCoinBonus > 0 ? `  +${drillCoinBonus} Star Coins/answer` : ""}
                {" "}invention bonus active
              </Text>
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Image source={RESULT_ASSETS.streak} style={styles.statAsset} resizeMode="contain" />
              <Text style={[styles.statVal, { color: colors.foreground }]}>
                {maxStreak}
              </Text>
              <Text
                style={[styles.statLbl, { color: colors.mutedForeground }]}
              >
                Best Streak
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Image source={RESULT_ASSETS.operations} style={styles.statAsset} resizeMode="contain" />
              <Text style={[styles.statVal, { color: colors.foreground }]}>
                {operations.length}
              </Text>
              <Text
                style={[styles.statLbl, { color: colors.mutedForeground }]}
              >
                Operations
              </Text>
            </View>
          </View>

          {/* Breakdown by op */}
          {operations.length > 1 && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.mutedForeground },
                ]}
              >
                BREAKDOWN
              </Text>
              <View style={styles.breakdown}>
                {operations.map((op: Operation) => {
                  const count = (correctByOp as any)[op] ?? 0;
                  return (
                    <View
                      key={op}
                      style={[
                        styles.breakdownRow,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.opDot,
                          { backgroundColor: OP_COLORS[op] },
                        ]}
                      />
                      <Text
                        style={[styles.opName, { color: colors.foreground }]}
                      >
                        {getOpLabel(op)}
                      </Text>
                      <Text
                        style={[styles.opCount, { color: OP_COLORS[op] }]}
                      >
                        {count}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* New Achievements */}
          {newAchievements.length > 0 && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.mutedForeground },
                ]}
              >
                NEW BADGES
              </Text>
              <View style={styles.newAchList}>
                {newAchievements.map((ach) => (
                  <View
                    key={ach.id}
                    style={[
                      styles.newAchRow,
                      {
                        backgroundColor: ach.color + "18",
                        borderColor: ach.color + "55",
                      },
                    ]}
                  >
                    <Image
                      source={ACHIEVEMENT_BADGE_ASSETS[getAchievementCategory(ach.id)]}
                      style={styles.achAsset}
                      resizeMode="contain"
                    />
                    <Text
                      style={[styles.newAchTitle, { color: colors.foreground }]}
                    >
                      {ach.title}
                    </Text>
                    <Text
                      style={[styles.newAchBonus, { color: colors.gold }]}
                    >
                      +{ach.bonusPoints} Points
                    </Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={[
                    styles.claimCTA,
                    { backgroundColor: colors.gold + "22" },
                  ]}
                  onPress={() => router.push("/achievements")}
                >
                  <Text style={[styles.claimCTAText, { color: colors.gold }]}>
                    Claim bonus Points on Achievements page
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.playAgainBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.replace("/setup")}
              activeOpacity={0.82}
            >
              <Image source={RESULT_ASSETS.playAgain} style={styles.playAgainAsset} resizeMode="contain" />
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.homeBtn2,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => router.replace("/")}
              activeOpacity={0.82}
            >
              <Feather name="home" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 18 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 10 },
  headerBtn: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  content: { gap: 18, alignItems: "center" },
  heroCard: {
    width: "100%",
    minHeight: 174,
    borderRadius: 26,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(124,111,255,0.28)",
    overflow: "hidden",
  },
  heroCopy: { flex: 1, gap: 6 },
  title: { fontSize: 30, fontFamily: "Inter_700Bold" },
  heroSub: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
  scoreOrb: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,111,255,0.14)",
  },
  scoreTrophy: { position: "absolute", top: -18, width: 58, height: 58 },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  scoreNumber: { fontSize: 58, fontFamily: "Inter_700Bold" },
  scoreLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  pbBadge: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  badgeAsset: { width: 24, height: 24 },
  pbText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  levelUpBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    width: "100%",
  },
  levelUpAsset: { width: 34, height: 34 },
  levelUpText: { fontSize: 17, fontFamily: "Inter_700Bold" },
  levelUpSub: { marginTop: 2, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  pointsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  rewardAsset: { width: 48, height: 48 },
  pointsEarned: { fontSize: 18, fontFamily: "Inter_700Bold" },
  pointsBalance: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  resultXpBarWrap: { marginTop: 8 },
  resultXpMeta: { marginTop: 4, fontSize: 11, fontFamily: "Inter_600SemiBold" },
  bonusHint: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  coinsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  coinsEarned: { fontSize: 16, fontFamily: "Inter_700Bold" },
  coinsBalance: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  gemRewardCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 10,
  },
  gemRewardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gemRewardTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  gemRewardRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gemRewardPill: {
    minHeight: 38,
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: "rgba(7, 10, 30, 0.72)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gemRewardIcon: { width: 24, height: 24 },
  gemRewardText: { color: "#DCD7FF", fontSize: 12, fontFamily: "Inter_700Bold" },
  statsRow: { flexDirection: "row", gap: 12, width: "100%" },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 15,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
  },
  statAsset: { width: 38, height: 38 },
  statVal: { fontSize: 28, fontFamily: "Inter_700Bold" },
  statLbl: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  section: { width: "100%", gap: 10 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  breakdown: { gap: 8 },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  achAsset: { width: 34, height: 34 },
  opDot: { width: 8, height: 8, borderRadius: 4 },
  opName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  opCount: { fontSize: 22, fontFamily: "Inter_700Bold" },
  newAchList: { gap: 8 },
  newAchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  newAchTitle: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  newAchBonus: { fontSize: 13, fontFamily: "Inter_700Bold" },
  claimCTA: {
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  claimCTAText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 4,
  },
  playAgainBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  playAgainAsset: { width: 32, height: 32 },
  playAgainText: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
  homeBtn2: {
    width: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  homeBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    alignSelf: "center",
  },
  homeBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  inventionBonusRow: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  inventionBonusText: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },
});
