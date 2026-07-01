import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { PinnedHeader, usePinnedHeaderHeight } from "@/components/PinnedHeader";
import type { Difficulty } from "@/constants/achievements";
import { getProfileAvatarAsset } from "@/constants/profileAvatars";
import { RESULT_ASSETS } from "@/constants/resultAssets";
import { useColors } from "@/hooks/useColors";
import {
  fetchLeaderboard,
  formatOperations,
  type LeaderboardBoard,
  type LeaderboardEntry,
  type LeaderboardScope,
} from "@/utils/leaderboard";

const BOARDS: Array<{ id: LeaderboardBoard; label: string; title: string; unit: string }> = [
  { id: "oneMinute", label: "1 min", title: "Best 1-Minute Scores", unit: "correct" },
  { id: "day", label: "Today", title: "Most Answered Today", unit: "today" },
  { id: "week", label: "Week", title: "Most Answered This Week", unit: "week" },
  { id: "month", label: "Month", title: "Most Answered This Month", unit: "month" },
];

const FILTERS: Array<{ id: LeaderboardScope; label: string }> = [
  { id: "all", label: "All" },
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

function difficultyLabel(difficulty: Difficulty) {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

function scoreLine(entry: LeaderboardEntry) {
  return `${entry.playerName} scored ${entry.score} correct on ${difficultyLabel(entry.difficulty)} mode in 1 Minute Space Math!`;
}

function BevelButtonArt({
  label,
  selected,
  variant,
}: {
  label: string;
  selected: boolean;
  variant: "small" | "wide";
}) {
  const width = variant === "wide" ? 510 : 322;
  const height = 162;
  const fillTop = selected ? "#A88EFF" : "#29264F";
  const fillMid = selected ? "#7F5AFF" : "#211D42";
  const fillBottom = selected ? "#6F4CFF" : "#171331";
  const rim = selected ? "#7D63FF" : "#3B345F";
  const glow = selected ? "#DCD3FF" : "#5A5087";
  const textColor = selected ? "#FFFFFF" : "#A39CBD";
  const fontSize = variant === "wide" ? 50 : label.length > 5 ? 46 : 50;
  const rx = variant === "wide" ? 42 : 34;

  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <SvgLinearGradient id={`leader-fill-${label}-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={fillTop} />
          <Stop offset="0.56" stopColor={fillMid} />
          <Stop offset="1" stopColor={fillBottom} />
        </SvgLinearGradient>
        <SvgLinearGradient id={`leader-shine-${label}-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={selected ? 0.42 : 0.16} />
          <Stop offset="0.24" stopColor="#FFFFFF" stopOpacity={selected ? 0.12 : 0.04} />
          <Stop offset="1" stopColor="#000000" stopOpacity={selected ? 0.1 : 0.32} />
        </SvgLinearGradient>
      </Defs>
      <Rect x="9" y="9" width={width - 18} height={height - 18} rx={rx} fill={rim} />
      <Rect x="17" y="16" width={width - 34} height={height - 32} rx={rx - 8} fill={`url(#leader-fill-${label}-${variant})`} />
      <Rect x="17" y="16" width={width - 34} height={height - 32} rx={rx - 8} fill={`url(#leader-shine-${label}-${variant})`} />
      <Rect
        x="24"
        y="23"
        width={width - 48}
        height={height - 46}
        rx={rx - 14}
        fill="none"
        stroke={glow}
        strokeWidth={variant === "wide" ? 4 : 5}
        opacity={selected ? 0.68 : 0.36}
      />
      <Path
        d={`M42 34h${variant === "wide" ? 112 : 58}l19-18h${variant === "wide" ? 150 : 70}l19 18h${variant === "wide" ? 110 : 45}M42 ${height - 34}h${variant === "wide" ? 112 : 58}l19 18h${variant === "wide" ? 150 : 70}l19-18h${variant === "wide" ? 110 : 45}`}
        fill="none"
        stroke={glow}
        strokeWidth={variant === "wide" ? 6 : 5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={selected ? 0.78 : 0.45}
      />
      <SvgText
        x={width / 2}
        y={height / 2 + fontSize * 0.34}
        fill={textColor}
        fontSize={fontSize}
        fontWeight="900"
        textAnchor="middle"
        letterSpacing="0"
      >
        {label}
      </SvgText>
    </Svg>
  );
}

export default function LeaderboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const headerHeight = usePinnedHeaderHeight();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [board, setBoard] = useState<LeaderboardBoard>("oneMinute");
  const [scope, setScope] = useState<LeaderboardScope>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [online, setOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const boardInfo = BOARDS.find((item) => item.id === board) ?? BOARDS[0];

  const load = useCallback(async () => {
    setRefreshing(true);
    const result = await fetchLeaderboard(scope, board);
    setEntries(result.entries);
    setOnline(result.online);
    setRefreshing(false);
  }, [board, scope]);

  useEffect(() => {
    load();
  }, [load]);

  const topThree = useMemo(() => entries.slice(0, 3), [entries]);
  const rest = useMemo(() => entries.slice(3), [entries]);

  async function shareEntry(entry: LeaderboardEntry) {
    await Share.share({ message: scoreLine(entry) });
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PinnedHeader title="Leaderboard" showSettings />
      <ScrollView
        bounces={false}
        alwaysBounceVertical={false}
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight + 8, paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />}
      >
        <View style={[styles.hero, { backgroundColor: "#11152E", borderColor: online ? "#00D9A366" : "#FFD16666" }]}>
          <View style={styles.heroIcon}>
            <Image source={RESULT_ASSETS.trophy} style={styles.heroTrophy} resizeMode="contain" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>{boardInfo.title}</Text>
            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
              {online ? "Online scores are live" : "Local scores saved on this device"}
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.boardFilters}>
          {BOARDS.map((item) => {
            const selected = item.id === board;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.boardBtn}
                onPress={() => setBoard(item.id)}
                activeOpacity={0.84}
              >
                <BevelButtonArt label={item.label} selected={selected} variant="small" />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.filters}>
          {FILTERS.map((filter) => {
            const selected = filter.id === scope;
            return (
              <TouchableOpacity
                key={filter.id}
                style={styles.filterBtn}
                onPress={() => setScope(filter.id)}
                activeOpacity={0.84}
              >
                <BevelButtonArt label={filter.label} selected={selected} variant="small" />
              </TouchableOpacity>
            );
          })}
        </View>

        {topThree.length > 0 && (
          <View style={styles.podiumRow}>
            {topThree.map((entry, index) => {
              const avatar = getProfileAvatarAsset(entry.avatar as any);
              return (
                <TouchableOpacity
                  key={entry.id}
                  style={[
                    styles.podiumCard,
                    {
                      backgroundColor: index === 0 ? colors.gold + "20" : colors.card,
                      borderColor: index === 0 ? colors.gold : colors.border,
                      marginTop: index === 0 ? 0 : 18,
                    },
                  ]}
                  onPress={() => shareEntry(entry)}
                  activeOpacity={0.86}
                >
                  <Text style={[styles.rank, { color: index === 0 ? colors.gold : colors.primary }]}>#{index + 1}</Text>
                  {avatar ? <Image source={avatar} style={styles.podiumAvatar} resizeMode="contain" /> : null}
                  <Text style={[styles.podiumName, { color: colors.foreground }]} numberOfLines={1}>
                    {entry.playerName}
                  </Text>
                  <Text style={[styles.podiumScore, { color: index === 0 ? colors.gold : "#9AE6FF" }]}>
                    {entry.score}
                  </Text>
                  <Text style={[styles.podiumMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {difficultyLabel(entry.difficulty)} · {boardInfo.unit}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.list}>
          {rest.map((entry, index) => {
            const avatar = getProfileAvatarAsset(entry.avatar as any);
            const rank = index + 4;
            return (
              <TouchableOpacity
                key={entry.id}
                style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => shareEntry(entry)}
                activeOpacity={0.82}
              >
                <Text style={[styles.rowRank, { color: colors.primary }]}>#{rank}</Text>
                {avatar ? <Image source={avatar} style={styles.rowAvatar} resizeMode="contain" /> : <View style={styles.rowAvatar} />}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={1}>
                    {entry.playerName}
                  </Text>
                  <Text style={[styles.rowMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {difficultyLabel(entry.difficulty)} · {formatOperations(entry.operations)} · {entry.maxStreak} streak
                  </Text>
                </View>
                <Text style={[styles.rowScore, { color: colors.gold }]}>{entry.score}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {entries.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="users" size={38} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No scores yet</Text>
            <TouchableOpacity style={styles.startBtn} onPress={() => router.push("/setup")}>
              <BevelButtonArt label="Start Drill" selected variant="wide" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 18, gap: 14 },
  hero: {
    minHeight: 112,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTrophy: { width: 56, height: 56 },
  heroTitle: { fontSize: 27, fontFamily: "Inter_700Bold" },
  heroSub: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  boardFilters: { gap: 8, paddingRight: 4 },
  boardBtn: {
    minWidth: 88,
    height: 44,
    borderRadius: 14,
    overflow: "hidden",
  },
  filters: { flexDirection: "row", gap: 8 },
  filterBtn: {
    flex: 1,
    height: 44,
    borderRadius: 15,
    overflow: "hidden",
  },
  podiumRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  podiumCard: {
    flex: 1,
    minHeight: 184,
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 10,
    alignItems: "center",
  },
  rank: { fontSize: 15, fontFamily: "Inter_700Bold" },
  podiumAvatar: { width: 66, height: 66, marginTop: 4 },
  podiumName: { fontSize: 13, fontFamily: "Inter_700Bold", marginTop: 6, maxWidth: "100%" },
  podiumScore: { fontSize: 34, fontFamily: "Inter_700Bold", marginTop: 4 },
  podiumMeta: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  list: { gap: 10 },
  row: {
    minHeight: 76,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowRank: { width: 38, fontSize: 16, fontFamily: "Inter_700Bold" },
  rowAvatar: { width: 48, height: 48 },
  rowName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  rowMeta: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  rowScore: { fontSize: 24, fontFamily: "Inter_700Bold" },
  empty: {
    minHeight: 220,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  startBtn: {
    width: 170,
    height: 54,
    borderRadius: 18,
    overflow: "hidden",
  },
});
