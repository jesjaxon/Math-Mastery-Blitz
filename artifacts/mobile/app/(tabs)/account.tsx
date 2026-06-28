import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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
import { PinnedHeader, usePinnedHeaderHeight } from "@/components/PinnedHeader";
import { getProfileAvatarAsset } from "@/constants/profileAvatars";
import {
  LEVEL_THRESHOLDS,
  LEVEL_TITLES,
  useGame,
} from "@/context/GameContext";
import { useProfiles } from "@/context/ProfileContext";
import { useColors } from "@/hooks/useColors";
import { XpBar } from "@/components/XpBar";

const formatSeconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

export default function AccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const headerHeight = usePinnedHeaderHeight();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { activeProfile } = useProfiles();
  const { gameData, getLevelInfo } = useGame();
  const [showRoadmap, setShowRoadmap] = useState(false);

  const analytics = useMemo(
    () => Object.values(gameData.questionAnalytics ?? {}),
    [gameData.questionAnalytics]
  );
  const totalCorrect = analytics.reduce((sum, q) => sum + q.correct, 0);
  const totalWrong = analytics.reduce((sum, q) => sum + q.wrong, 0);
  const avgMs =
    totalCorrect > 0
      ? analytics.reduce((sum, q) => sum + q.totalResponseMs, 0) / totalCorrect
      : 0;
  const avatar = getProfileAvatarAsset(activeProfile?.avatar);
  const levelInfo = getLevelInfo(gameData.points);
  const nextLevelTitle = levelInfo.nextLevelXp
    ? getLevelInfo(levelInfo.nextLevelXp).title
    : levelInfo.title;
  const ladder = LEVEL_TITLES.map((title, levelIndex) => {
    return {
      level: levelIndex + 1,
      title,
      threshold: LEVEL_THRESHOLDS[levelIndex],
    };
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PinnedHeader title="Account" subtitle="Stats & analytics" />
      <ScrollView
        bounces={false}
        alwaysBounceVertical={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: headerHeight + 8, paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#17143A", "#082B3A", "#241643"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.avatarWell}>
            {avatar ? <Image source={avatar} style={styles.avatar} resizeMode="contain" /> : null}
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.playerName} numberOfLines={1}>
              {activeProfile?.name ?? "Player"}
            </Text>
            <Text style={styles.heroSub}>Lv {levelInfo.level} · {levelInfo.title}</Text>
          </View>
        </LinearGradient>

        <View style={[styles.levelPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.levelHeader}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.levelTitle, { color: colors.foreground }]} numberOfLines={1}>
                {levelInfo.currentXp.toLocaleString()} lifetime XP
              </Text>
              <Text style={[styles.levelSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                {levelInfo.isMaxLevel
                  ? "Maximum rank reached"
                  : `${levelInfo.xpToNext.toLocaleString()} XP until ${nextLevelTitle}`}
              </Text>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: "#7C6FFF22" }]}>
              <Text style={styles.levelBadgeText}>Lv {levelInfo.level}</Text>
            </View>
          </View>
          <XpBar progress={levelInfo.progress} height={14} />
          <View style={styles.levelMetaRow}>
            <Text style={[styles.levelMeta, { color: colors.mutedForeground }]}>
              {levelInfo.xpIntoLevel.toLocaleString()}
              {levelInfo.xpNeededForLevel ? ` / ${levelInfo.xpNeededForLevel.toLocaleString()}` : ""} XP this level
            </Text>
            <Text style={[styles.levelMeta, { color: colors.mutedForeground }]}>
              {gameData.totalGames} drills
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.collapseButton, { backgroundColor: "#7C6FFF18", borderColor: "#7C6FFF55" }]}
            onPress={() => setShowRoadmap((value) => !value)}
            activeOpacity={0.82}
          >
            <Text style={[styles.collapseButtonText, { color: "#B8A9FF" }]}>
              {showRoadmap ? "Collapse Levels" : "Expand Levels"}
            </Text>
            <Feather name={showRoadmap ? "chevron-up" : "chevron-down"} size={18} color="#B8A9FF" />
          </TouchableOpacity>
          {showRoadmap && (
            <View style={styles.ladderList}>
              <Text style={[styles.ladderHeading, { color: colors.foreground }]}>
                20-Level Rank Roadmap
              </Text>
              {ladder.map((row) => {
                const isCurrent = row.level === levelInfo.level;
                const isUnlocked = row.threshold <= levelInfo.currentXp;
                return (
                  <View
                    key={row.level}
                    style={[
                      styles.ladderRow,
                      {
                        backgroundColor: isCurrent
                          ? "#7C6FFF22"
                          : isUnlocked
                            ? "rgba(255,209,102,0.10)"
                            : "rgba(255,255,255,0.04)",
                      },
                    ]}
                  >
                    <Text style={[styles.ladderLevel, { color: isCurrent ? "#9AE6FF" : colors.mutedForeground }]}>
                      Lv {row.level}
                    </Text>
                    <Text style={[styles.ladderTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {row.title}
                    </Text>
                    <Text style={[styles.ladderXp, { color: colors.mutedForeground }]}>
                      {row.threshold.toLocaleString()} XP
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.statGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="target" size={22} color="#FFD166" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{totalCorrect}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Correct</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="alert-circle" size={22} color="#FF6B9D" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{totalWrong}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Wrong</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="clock" size={22} color="#00D9A3" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{avgMs ? formatSeconds(avgMs) : "0.0s"}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Avg Time</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.analyticsCta, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/account-analytics" as any)}
          activeOpacity={0.84}
        >
          <View style={[styles.analyticsIcon, { backgroundColor: "#00D9A322" }]}>
            <Feather name="bar-chart-2" size={24} color="#00D9A3" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.analyticsCtaTitle, { color: colors.foreground }]}>Question Analytics</Text>
          </View>
          <Feather name="chevron-right" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  hero: {
    minHeight: 118,
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  avatarWell: {
    width: 78,
    height: 78,
    borderRadius: 22,
    backgroundColor: "rgba(124,111,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatar: { width: 76, height: 76 },
  heroCopy: { flex: 1, gap: 5 },
  playerName: { color: "#FFFFFF", fontSize: 28, fontFamily: "Inter_700Bold" },
  heroSub: { color: "rgba(255,255,255,0.72)", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  levelPanel: { borderRadius: 22, borderWidth: 1, padding: 14, gap: 12 },
  levelHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  levelTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  levelSub: { marginTop: 3, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  levelBadge: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  levelBadgeText: { color: "#9AE6FF", fontSize: 15, fontFamily: "Inter_700Bold" },
  levelMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  levelMeta: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  collapseButton: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  collapseButtonText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  ladderList: { gap: 7 },
  ladderHeading: { fontSize: 15, fontFamily: "Inter_700Bold", marginTop: 2 },
  ladderRow: { minHeight: 38, borderRadius: 13, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 9 },
  ladderLevel: { width: 40, fontSize: 12, fontFamily: "Inter_700Bold" },
  ladderTitle: { flex: 1, fontSize: 13, fontFamily: "Inter_700Bold" },
  ladderXp: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  statGrid: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    minHeight: 104,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 10,
  },
  statValue: { fontSize: 21, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  analyticsCta: {
    minHeight: 92,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  analyticsIcon: { width: 52, height: 52, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  analyticsCtaTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
});
