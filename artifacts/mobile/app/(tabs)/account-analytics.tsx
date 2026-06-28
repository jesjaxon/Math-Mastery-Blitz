import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PinnedHeader, usePinnedHeaderHeight } from "@/components/PinnedHeader";
import type { Difficulty, Operation } from "@/constants/achievements";
import { useGame, type QuestionAnalyticsStats } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { getOpLabel, getOpSymbol } from "@/utils/mathUtils";

type OpFilter = "all" | Operation;
type DifficultyFilter = "all" | Difficulty;
type SortFilter = "all" | "missed" | "quickest" | "slowest";

const OP_FILTERS: Array<{ id: OpFilter; label: string; color: string }> = [
  { id: "all", label: "All", color: "#7C6FFF" },
  { id: "add", label: "+", color: "#7C6FFF" },
  { id: "sub", label: "−", color: "#FF6B9D" },
  { id: "mul", label: "×", color: "#00D9A3" },
  { id: "div", label: "÷", color: "#FF9F43" },
];

const SORT_FILTERS: Array<{ id: SortFilter; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { id: "all", label: "All", icon: "list" },
  { id: "missed", label: "Most Missed", icon: "alert-triangle" },
  { id: "quickest", label: "Quickest", icon: "zap" },
  { id: "slowest", label: "Slowest", icon: "clock" },
];

const DIFFICULTY_FILTERS: Array<{ id: DifficultyFilter; label: string; color: string }> = [
  { id: "all", label: "All", color: "#7C6FFF" },
  { id: "easy", label: "Easy", color: "#00D9A3" },
  { id: "medium", label: "Medium", color: "#FFD166" },
  { id: "hard", label: "Hard", color: "#FF6B9D" },
];

const formatSeconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
const avgMs = (item: QuestionAnalyticsStats) =>
  item.correct > 0 ? item.totalResponseMs / item.correct : Number.POSITIVE_INFINITY;

function metricFor(item: QuestionAnalyticsStats, sort: SortFilter) {
  if (sort === "missed") return `${item.wrong} wrong`;
  if (sort === "quickest" || sort === "slowest") return item.correct > 0 ? formatSeconds(avgMs(item)) : "No time";
  return `${item.correct}✓ ${item.wrong}✕`;
}

export default function AccountAnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const headerHeight = usePinnedHeaderHeight();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { gameData } = useGame();
  const [opFilter, setOpFilter] = useState<OpFilter>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [sortFilter, setSortFilter] = useState<SortFilter>("missed");

  const analytics = useMemo(
    () => Object.values(gameData.questionAnalytics ?? {}),
    [gameData.questionAnalytics]
  );

  const filtered = useMemo(() => {
    const byOp = opFilter === "all" ? analytics : analytics.filter((item) => item.op === opFilter);
    const byDifficulty =
      difficultyFilter === "all"
        ? byOp
        : byOp.filter((item) => item.difficulty === difficultyFilter);
    const visible =
      sortFilter === "missed"
        ? byDifficulty.filter((item) => item.wrong > 0)
        : sortFilter === "quickest" || sortFilter === "slowest"
          ? byDifficulty.filter((item) => item.correct > 0 && item.totalResponseMs > 0)
          : byDifficulty;

    return [...visible].sort((a, b) => {
      if (sortFilter === "missed") {
        return b.wrong - a.wrong || b.wrong / Math.max(1, b.attempts) - a.wrong / Math.max(1, a.attempts);
      }
      if (sortFilter === "quickest") return avgMs(a) - avgMs(b);
      if (sortFilter === "slowest") return avgMs(b) - avgMs(a);
      return b.lastSeen - a.lastSeen;
    });
  }, [analytics, difficultyFilter, opFilter, sortFilter]);

  const totalCorrect = filtered.reduce((sum, item) => sum + item.correct, 0);
  const totalWrong = filtered.reduce((sum, item) => sum + item.wrong, 0);
  const timed = filtered.filter((item) => item.correct > 0 && item.totalResponseMs > 0);
  const average = timed.length
    ? timed.reduce((sum, item) => sum + avgMs(item), 0) / timed.length
    : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PinnedHeader title="Analytics" subtitle="Question history" />
      <ScrollView
        bounces={false}
        alwaysBounceVertical={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: headerHeight + 8, paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.summaryPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{filtered.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Questions</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: "#00D9A3" }]}>{totalCorrect}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Correct</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: "#FF6B9D" }]}>{totalWrong}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Wrong</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: "#FFD166" }]}>{average ? formatSeconds(average) : "0.0s"}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Avg</Text>
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={[styles.filterTitle, { color: colors.foreground }]}>Operation</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {OP_FILTERS.map((filter) => {
              const selected = opFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.opChip,
                    {
                      backgroundColor: selected ? filter.color + "33" : colors.card,
                      borderColor: selected ? filter.color : colors.border,
                    },
                  ]}
                  onPress={() => setOpFilter(filter.id)}
                  activeOpacity={0.82}
                >
                  <Text style={[styles.opChipText, { color: selected ? filter.color : colors.mutedForeground }]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.filterSection}>
          <Text style={[styles.filterTitle, { color: colors.foreground }]}>Difficulty</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {DIFFICULTY_FILTERS.map((filter) => {
              const selected = difficultyFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.difficultyChip,
                    {
                      backgroundColor: selected ? filter.color + "33" : colors.card,
                      borderColor: selected ? filter.color : colors.border,
                    },
                  ]}
                  onPress={() => setDifficultyFilter(filter.id)}
                  activeOpacity={0.82}
                >
                  <Text style={[styles.difficultyChipText, { color: selected ? filter.color : colors.mutedForeground }]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.filterSection}>
          <Text style={[styles.filterTitle, { color: colors.foreground }]}>Sort</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {SORT_FILTERS.map((filter) => {
              const selected = sortFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.sortChip,
                    {
                      backgroundColor: selected ? "#7C6FFF33" : colors.card,
                      borderColor: selected ? "#7C6FFF" : colors.border,
                    },
                  ]}
                  onPress={() => setSortFilter(filter.id)}
                  activeOpacity={0.82}
                >
                  <Feather name={filter.icon} size={15} color={selected ? "#B8A9FF" : colors.mutedForeground} />
                  <Text style={[styles.sortChipText, { color: selected ? "#B8A9FF" : colors.mutedForeground }]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.list}>
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const opConfig = OP_FILTERS.find((filter) => filter.id === item.op) ?? OP_FILTERS[0];
              const wrongRate = item.attempts > 0 ? Math.round((item.wrong / item.attempts) * 100) : 0;
              return (
                <View key={item.questionKey} style={[styles.questionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.opBadge, { backgroundColor: opConfig.color + "22" }]}>
                    <Text style={[styles.opSymbol, { color: opConfig.color }]}>{getOpSymbol(item.op)}</Text>
                  </View>
                  <View style={styles.questionCopy}>
                    <Text style={[styles.questionText, { color: colors.foreground }]} numberOfLines={1}>
                      {item.display} = {item.answer}
                    </Text>
                    <Text style={[styles.questionMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {getOpLabel(item.op)} · {item.difficulty} · {item.attempts} attempts · {wrongRate}% wrong
                    </Text>
                  </View>
                  <Text style={[styles.metric, { color: opConfig.color }]}>{metricFor(item, sortFilter)}</Text>
                </View>
              );
            })
          ) : (
            <View style={[styles.emptyPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="bar-chart-2" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No questions yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Play drills to build analytics for this filter.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  summaryPanel: { borderRadius: 22, borderWidth: 1, padding: 14, flexDirection: "row", gap: 8 },
  summaryItem: { flex: 1, alignItems: "center", gap: 3 },
  summaryValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  summaryLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  filterSection: { gap: 8 },
  filterTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  chipRow: { gap: 8, paddingRight: 20 },
  opChip: { minWidth: 54, height: 44, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  opChipText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  difficultyChip: { height: 42, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 15 },
  difficultyChipText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  sortChip: { height: 42, borderRadius: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12 },
  sortChipText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  list: { gap: 10 },
  questionCard: { minHeight: 76, borderRadius: 18, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  opBadge: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  opSymbol: { fontSize: 25, fontFamily: "Inter_700Bold" },
  questionCopy: { flex: 1, minWidth: 0 },
  questionText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  questionMeta: { marginTop: 3, fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  metric: { minWidth: 74, textAlign: "right", fontSize: 13, fontFamily: "Inter_700Bold" },
  emptyPanel: { borderRadius: 22, borderWidth: 1, minHeight: 150, padding: 18, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: { textAlign: "center", fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 19 },
});
