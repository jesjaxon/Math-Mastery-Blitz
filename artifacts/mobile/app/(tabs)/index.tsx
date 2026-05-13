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

const OP_SYMBOLS: Record<Operation, string> = {
  add: "+",
  sub: "−",
  mul: "×",
  div: "÷",
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gameData, isLoaded } = useGame();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const ops: Operation[] = ["add", "sub", "mul", "div"];
  const totalGames = gameData.totalGames;
  const bestScore = gameData.allTimeBest;
  const achievementCount = Object.keys(gameData.unlockedAchievements).length;
  const unclaimedCount = Object.keys(gameData.unclaimedBonuses).length;
  const totalUnclaimed = Object.values(gameData.unclaimedBonuses).reduce(
    (s, v) => s + v,
    0
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 20, paddingBottom: bottomPad + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.appTitle, { color: colors.primary }]}>
            Math Minute
          </Text>
          <Text
            style={[styles.appSubtitle, { color: colors.mutedForeground }]}
          >
            How fast can you go?
          </Text>
        </View>

        {/* Points banner */}
        {isLoaded && (
          <View
            style={[
              styles.pointsBanner,
              {
                backgroundColor: colors.card,
                borderColor: colors.gold + "55",
              },
            ]}
          >
            <Text style={[styles.pointsLabel, { color: colors.mutedForeground }]}>
              ⭐ Points
            </Text>
            <Text style={[styles.pointsValue, { color: colors.gold }]}>
              {gameData.points.toLocaleString()}
            </Text>
            {unclaimedCount > 0 && (
              <TouchableOpacity
                style={[
                  styles.claimBanner,
                  { backgroundColor: colors.gold + "22" },
                ]}
                onPress={() => router.push("/achievements")}
              >
                <Text style={[styles.claimBannerText, { color: colors.gold }]}>
                  +{totalUnclaimed} unclaimed!
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Stats Row */}
        {isLoaded && totalGames > 0 && (
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
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {bestScore}
              </Text>
              <Text
                style={[styles.statLabel, { color: colors.mutedForeground }]}
              >
                Best Score
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.statValue, { color: colors.accent }]}>
                {totalGames}
              </Text>
              <Text
                style={[styles.statLabel, { color: colors.mutedForeground }]}
              >
                Drills
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.statValue, { color: colors.gold }]}>
                {achievementCount}
              </Text>
              <Text
                style={[styles.statLabel, { color: colors.mutedForeground }]}
              >
                Badges
              </Text>
            </View>
          </View>
        )}

        {/* Operation bests */}
        {isLoaded && totalGames > 0 && (
          <View style={styles.opsGrid}>
            {ops.map((op) => {
              const stat = gameData.opStats[op];
              if (!stat) return null;
              return (
                <View
                  key={op}
                  style={[
                    styles.opCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: OP_COLORS[op] + "44",
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <Text style={[styles.opSymbol, { color: OP_COLORS[op] }]}>
                    {OP_SYMBOLS[op]}
                  </Text>
                  <Text style={[styles.opBest, { color: colors.foreground }]}>
                    {stat.bestDrillScore}
                  </Text>
                  <Text
                    style={[styles.opLabel, { color: colors.mutedForeground }]}
                  >
                    best
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Primary CTA */}
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/setup")}
          activeOpacity={0.82}
        >
          <Feather name="play" size={24} color="#fff" />
          <Text style={styles.startBtnText}>Start Drill</Text>
        </TouchableOpacity>

        {/* Secondary nav grid */}
        <View style={styles.navGrid}>
          <TouchableOpacity
            style={[
              styles.navCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => router.push("/classroom")}
            activeOpacity={0.82}
          >
            <Text style={styles.navCardEmoji}>🏫</Text>
            <Text style={[styles.navCardLabel, { color: colors.foreground }]}>
              Classroom
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => router.push("/shop")}
            activeOpacity={0.82}
          >
            <Text style={styles.navCardEmoji}>🛒</Text>
            <Text style={[styles.navCardLabel, { color: colors.foreground }]}>
              Shop
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navCard,
              {
                backgroundColor: colors.card,
                borderColor:
                  unclaimedCount > 0 ? colors.gold + "88" : colors.border,
                borderWidth: unclaimedCount > 0 ? 1.5 : 1,
              },
            ]}
            onPress={() => router.push("/achievements")}
            activeOpacity={0.82}
          >
            <View style={styles.navCardIconWrap}>
              <Text style={styles.navCardEmoji}>🏆</Text>
              {unclaimedCount > 0 && (
                <View
                  style={[styles.notifDot, { backgroundColor: colors.gold }]}
                />
              )}
            </View>
            <Text style={[styles.navCardLabel, { color: colors.foreground }]}>
              Badges
            </Text>
          </TouchableOpacity>
        </View>

        {/* Welcome msg */}
        {isLoaded && totalGames === 0 && (
          <View
            style={[
              styles.welcomeCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="info" size={18} color={colors.mutedForeground} />
            <Text
              style={[styles.welcomeText, { color: colors.mutedForeground }]}
            >
              Pick your operations, set a time limit, and answer as many
              questions as you can. Earn points to decorate your classroom!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  header: { alignItems: "center", paddingVertical: 8 },
  appTitle: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  appSubtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  pointsBanner: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    gap: 10,
  },
  pointsLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  pointsValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    flex: 1,
  },
  claimBanner: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  claimBannerText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  opsGrid: { flexDirection: "row", gap: 10 },
  opCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 2,
  },
  opSymbol: { fontSize: 22, fontFamily: "Inter_700Bold" },
  opBest: { fontSize: 18, fontFamily: "Inter_700Bold" },
  opLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  startBtn: {
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  startBtnText: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  navGrid: { flexDirection: "row", gap: 10 },
  navCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  navCardEmoji: { fontSize: 28 },
  navCardLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  navCardIconWrap: { position: "relative" },
  notifDot: {
    position: "absolute",
    top: -2,
    right: -6,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  welcomeCard: {
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  welcomeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
