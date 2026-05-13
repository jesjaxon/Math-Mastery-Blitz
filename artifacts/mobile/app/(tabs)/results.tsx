import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
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
import { getOpLabel } from "@/utils/mathUtils";
import type { Operation } from "@/constants/achievements";

const OP_COLORS: Record<Operation, string> = {
  add: "#7C6FFF",
  sub: "#FF6B9D",
  mul: "#00D9A3",
  div: "#FF9F43",
};

export default function ResultsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { lastSession, gameData } = useGame();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const scoreAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scoreAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scoreAnim]);

  if (!lastSession) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.homeBtn, { backgroundColor: colors.primary, marginTop: topPad + 20 }]}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.homeBtnText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { score, correctByOp, maxStreak, operations } = lastSession as any;
  const newAchievementIds: string[] = (lastSession as any).newAchievements ?? [];
  const newAchievements = ACHIEVEMENTS.filter((a) => newAchievementIds.includes(a.id));

  const isPersonalBest = score > 0 && score >= gameData.allTimeBest;

  const scoreScale = scoreAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 24, paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground }]}>
            Time's Up!
          </Text>

          {/* Score */}
          <Animated.View
            style={[
              styles.scoreCircle,
              {
                backgroundColor: colors.primary + "22",
                borderColor: colors.primary,
                transform: [{ scale: scoreScale }],
              },
            ]}
          >
            <Text style={[styles.scoreNumber, { color: colors.primary }]}>
              {score}
            </Text>
            <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>
              correct
            </Text>
          </Animated.View>

          {isPersonalBest && score > 0 && (
            <View style={[styles.pbBadge, { backgroundColor: colors.gold + "22" }]}>
              <Feather name="award" size={16} color={colors.gold} />
              <Text style={[styles.pbText, { color: colors.gold }]}>
                Personal Best!
              </Text>
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="zap" size={18} color={colors.gold} />
              <Text style={[styles.statVal, { color: colors.foreground }]}>
                {maxStreak}
              </Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>
                Best Streak
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="layers" size={18} color={colors.accent} />
              <Text style={[styles.statVal, { color: colors.foreground }]}>
                {operations.length}
              </Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>
                Operations
              </Text>
            </View>
          </View>

          {/* Breakdown by op */}
          {operations.length > 1 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
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
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.opDot,
                          { backgroundColor: OP_COLORS[op] },
                        ]}
                      />
                      <Text style={[styles.opName, { color: colors.foreground }]}>
                        {getOpLabel(op)}
                      </Text>
                      <Text style={[styles.opCount, { color: OP_COLORS[op] }]}>
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
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                NEW BADGES
              </Text>
              <View style={styles.achList}>
                {newAchievements.map((ach) => (
                  <AchievementCard
                    key={ach.id}
                    achievement={ach}
                    unlockedAt={gameData.unlockedAchievements[ach.id]}
                  />
                ))}
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
              <Feather name="refresh-cw" size={18} color="#fff" />
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.homeBtn2, { backgroundColor: colors.card, borderColor: colors.border }]}
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
  scroll: { paddingHorizontal: 20 },
  content: { gap: 20, alignItems: "center" },
  title: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  scoreNumber: {
    fontSize: 58,
    fontFamily: "Inter_700Bold",
  },
  scoreLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  pbBadge: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  pbText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
  },
  statVal: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
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
  opDot: { width: 8, height: 8, borderRadius: 4 },
  opName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  opCount: { fontSize: 22, fontFamily: "Inter_700Bold" },
  achList: { gap: 8 },
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
  playAgainText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
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
  homeBtnText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
});
