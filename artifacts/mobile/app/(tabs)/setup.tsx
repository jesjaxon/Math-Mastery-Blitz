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
import { useGame, type GameSettings } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import type { Difficulty, Operation } from "@/constants/achievements";

const OPERATIONS: { id: Operation; symbol: string; label: string; color: string }[] = [
  { id: "add", symbol: "+", label: "Add", color: "#7C6FFF" },
  { id: "sub", symbol: "−", label: "Subtract", color: "#FF6B9D" },
  { id: "mul", symbol: "×", label: "Multiply", color: "#00D9A3" },
  { id: "div", symbol: "÷", label: "Divide", color: "#FF9F43" },
];

const TIME_OPTIONS = [
  { label: "30s", value: 30 },
  { label: "1 min", value: 60 },
  { label: "2 min", value: 120 },
  { label: "3 min", value: 180 },
];

const DIFFICULTY_OPTIONS: { id: Difficulty; label: string; desc: string; color: string }[] = [
  { id: "easy", label: "Easy", desc: "Small numbers", color: "#00D9A3" },
  { id: "medium", label: "Medium", desc: "Moderate numbers", color: "#FF9F43" },
  { id: "hard", label: "Hard", desc: "Larger numbers", color: "#FF4757" },
];

export default function SetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useGame();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const toggleOp = (op: Operation) => {
    const current = settings.operations;
    if (current.includes(op)) {
      if (current.length === 1) return;
      updateSettings({ operations: current.filter((o) => o !== op) });
    } else {
      updateSettings({ operations: [...current, op] });
    }
  };

  const selectAll = () => {
    updateSettings({ operations: ["add", "sub", "mul", "div"] });
  };

  const canStart = settings.operations.length > 0;

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
          <Text style={[styles.title, { color: colors.foreground }]}>New Drill</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Operations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Operations
            </Text>
            <TouchableOpacity onPress={selectAll}>
              <Text style={[styles.selectAll, { color: colors.primary }]}>
                All
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.opsGrid}>
            {OPERATIONS.map((op) => {
              const selected = settings.operations.includes(op.id);
              return (
                <TouchableOpacity
                  key={op.id}
                  style={[
                    styles.opBtn,
                    {
                      backgroundColor: selected ? op.color + "22" : colors.card,
                      borderColor: selected ? op.color : colors.border,
                      borderWidth: selected ? 2 : 1,
                    },
                  ]}
                  onPress={() => toggleOp(op.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.opSymbol, { color: op.color }]}>
                    {op.symbol}
                  </Text>
                  <Text
                    style={[
                      styles.opLabel,
                      { color: selected ? colors.foreground : colors.mutedForeground },
                    ]}
                  >
                    {op.label}
                  </Text>
                  {selected && (
                    <View
                      style={[styles.checkDot, { backgroundColor: op.color }]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Time Limit */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Time Limit
          </Text>
          <View style={styles.timeRow}>
            {TIME_OPTIONS.map((t) => {
              const selected = settings.timeLimit === t.value;
              return (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.timeBtn,
                    {
                      backgroundColor: selected ? colors.primary : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => updateSettings({ timeLimit: t.value })}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.timeBtnText,
                      { color: selected ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Difficulty
          </Text>
          <View style={styles.diffRow}>
            {DIFFICULTY_OPTIONS.map((d) => {
              const selected = settings.difficulty === d.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    styles.diffBtn,
                    {
                      backgroundColor: selected ? d.color + "22" : colors.card,
                      borderColor: selected ? d.color : colors.border,
                      borderWidth: selected ? 2 : 1,
                    },
                  ]}
                  onPress={() =>
                    updateSettings({ difficulty: d.id as Difficulty })
                  }
                  activeOpacity={0.75}
                >
                  <Text style={[styles.diffLabel, { color: selected ? d.color : colors.mutedForeground }]}>
                    {d.label}
                  </Text>
                  <Text style={[styles.diffDesc, { color: colors.mutedForeground }]}>
                    {d.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[
            styles.startBtn,
            { backgroundColor: canStart ? colors.primary : colors.muted },
          ]}
          onPress={() => canStart && router.push("/game")}
          activeOpacity={0.82}
          disabled={!canStart}
        >
          <Feather name="zap" size={22} color="#fff" />
          <Text style={styles.startBtnText}>Start!</Text>
        </TouchableOpacity>
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
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  selectAll: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  opsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  opBtn: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 6,
    position: "relative",
  },
  opSymbol: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  opLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  checkDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timeRow: {
    flexDirection: "row",
    gap: 10,
  },
  timeBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  timeBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  diffRow: {
    flexDirection: "row",
    gap: 10,
  },
  diffBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 4,
  },
  diffLabel: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  diffDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  startBtn: {
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
  },
  startBtnText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
