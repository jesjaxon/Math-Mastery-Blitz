import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  type ImageSourcePropType,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import type { Difficulty, Operation } from "@/constants/achievements";
import { START_DRILL_ASSETS } from "@/constants/startDrillAssets";
import { PinnedHeader, usePinnedHeaderHeight } from "@/components/PinnedHeader";

const OPERATIONS: { id: Operation; label: string; color: string; asset: ImageSourcePropType }[] = [
  { id: "add", label: "Add", color: "#8A6CFF", asset: START_DRILL_ASSETS.operationAdd },
  { id: "sub", label: "Subtract", color: "#FF6BBA", asset: START_DRILL_ASSETS.operationSubtract },
  { id: "mul", label: "Multiply", color: "#00D9E8", asset: START_DRILL_ASSETS.operationMultiply },
  { id: "div", label: "Divide", color: "#FFB13B", asset: START_DRILL_ASSETS.operationDivide },
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
  const {
    settings,
    updateSettings,
  } = useGame();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const headerHeight = usePinnedHeaderHeight();

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
      <PinnedHeader title="New Drill" />
      <ScrollView
        bounces={false}
        alwaysBounceVertical={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: headerHeight + 8, paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Operations</Text>
            <TouchableOpacity style={styles.selectAllBtn} onPress={selectAll}>
              <Image source={START_DRILL_ASSETS.selectAll} style={styles.selectAllAsset} resizeMode="contain" />
              <Text style={[styles.selectAll, { color: colors.primary }]}>All</Text>
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
                  <Image source={op.asset} style={styles.opAsset} resizeMode="contain" />
                  <Text style={[styles.opLabel, { color: selected ? colors.foreground : colors.mutedForeground }]}>
                    {op.label}
                  </Text>
                  {selected && <Image source={START_DRILL_ASSETS.selectedRing} style={styles.selectedAsset} resizeMode="contain" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.iconTitleRow}>
            <Image source={START_DRILL_ASSETS.timeLimit} style={styles.sectionIcon} resizeMode="contain" />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Time Limit</Text>
          </View>
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
                  <Text style={[styles.timeBtnText, { color: selected ? "#fff" : colors.mutedForeground }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.iconTitleRow}>
            <Image source={START_DRILL_ASSETS.difficulty} style={styles.sectionIcon} resizeMode="contain" />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Difficulty</Text>
          </View>
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
                  onPress={() => updateSettings({ difficulty: d.id as Difficulty })}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.diffLabel, { color: selected ? d.color : colors.mutedForeground }]}>
                    {d.label}
                  </Text>
                  <Text style={[styles.diffDesc, { color: colors.mutedForeground }]}>{d.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.startBtn,
            { opacity: canStart ? 1 : 0.48 },
          ]}
          onPress={() => canStart && router.push("/game")}
          activeOpacity={0.82}
          disabled={!canStart}
        >
          <LinearGradient
            colors={canStart ? ["#7C6FFF", "#8F52FF", "#00B4D8"] : ["#292845", "#22213A"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.startBtnBg}
          >
            <View style={styles.startIconWell}>
              <Image source={START_DRILL_ASSETS.difficulty} style={styles.startIconAsset} resizeMode="contain" />
            </View>
            <Text style={styles.startBtnText}>Start!</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 10 },
  backBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  headerIconBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  backAsset: { width: 54, height: 54 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionIcon: { width: 34, height: 34 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  selectAllBtn: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, minHeight: 34, maxWidth: 88, overflow: "hidden" },
  selectAllAsset: { width: 24, height: 24 },
  selectAll: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  opsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  opBtn: { width: "47%", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 13, alignItems: "center", gap: 4, position: "relative", minHeight: 132, overflow: "hidden" },
  opAsset: { width: 76, height: 76 },
  opLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  selectedAsset: { position: "absolute", top: 8, right: 8, width: 22, height: 22 },
  timeRow: { flexDirection: "row", gap: 10 },
  timeBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1 },
  timeBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  diffRow: { flexDirection: "row", gap: 10 },
  diffBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 8, alignItems: "center", gap: 4 },
  diffLabel: { fontSize: 15, fontFamily: "Inter_700Bold" },
  diffDesc: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  startBtn: { height: 68, borderRadius: 22, marginTop: 4, overflow: "hidden" },
  startBtnBg: { flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10, borderRadius: 22 },
  startIconWell: { width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  startIconAsset: { width: 34, height: 34 },
  startBtnText: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
});
