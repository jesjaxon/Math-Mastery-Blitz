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
import { PinnedHeader, usePinnedHeaderHeight } from "@/components/PinnedHeader";
import type { Difficulty } from "@/constants/achievements";
import { getProfileAvatarAsset } from "@/constants/profileAvatars";
import { useColors } from "@/hooks/useColors";
import {
  fetchLeaderboard,
  formatOperations,
  type LeaderboardEntry,
  type LeaderboardScope,
} from "@/utils/leaderboard";

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

export default function LeaderboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const headerHeight = usePinnedHeaderHeight();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [scope, setScope] = useState<LeaderboardScope>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [online, setOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const result = await fetchLeaderboard(scope);
    setEntries(result.entries);
    setOnline(result.online);
    setRefreshing(false);
  }, [scope]);

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
            <Feather name="award" size={32} color={online ? "#00D9A3" : colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>Class Champions</Text>
            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
              {online ? "Online scores are live" : "Local scores saved on this device"}
            </Text>
          </View>
        </View>

        <View style={styles.filters}>
          {FILTERS.map((filter) => {
            const selected = filter.id === scope;
            return (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterBtn,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setScope(filter.id)}
                activeOpacity={0.84}
              >
                <Text style={[styles.filterText, { color: selected ? "#FFFFFF" : colors.mutedForeground }]}>
                  {filter.label}
                </Text>
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
                    {difficultyLabel(entry.difficulty)}
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
            <TouchableOpacity style={[styles.startBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/setup")}>
              <Text style={styles.startText}>Start Drill</Text>
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
  heroTitle: { fontSize: 27, fontFamily: "Inter_700Bold" },
  heroSub: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  filters: { flexDirection: "row", gap: 8 },
  filterBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  filterText: { fontSize: 13, fontFamily: "Inter_700Bold" },
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
    minWidth: 160,
    minHeight: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  startText: { color: "#FFFFFF", fontSize: 17, fontFamily: "Inter_700Bold" },
});
