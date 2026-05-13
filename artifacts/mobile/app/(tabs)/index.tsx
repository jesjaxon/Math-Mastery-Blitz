import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ROCKET_PARTS } from "@/constants/rocketParts";
import { useGame } from "@/context/GameContext";
import { useProfiles } from "@/context/ProfileContext";
import { useColors } from "@/hooks/useColors";
import type { Operation } from "@/constants/achievements";

const OP_COLORS: Record<Operation, string> = {
  add: "#7C6FFF", sub: "#FF6B9D", mul: "#00D9A3", div: "#FF9F43",
};
const OP_SYMBOLS: Record<Operation, string> = {
  add: "+", sub: "−", mul: "×", div: "÷",
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gameData, isLoaded, getPassiveRate } = useGame();
  const { activeProfile, profiles } = useProfiles();

  // Redirect to profiles screen if no profile selected
  useEffect(() => {
    if (profiles.length > 0 && !activeProfile) {
      router.replace("/(tabs)/profiles");
    }
  }, [activeProfile, profiles]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const ops: Operation[] = ["add", "sub", "mul", "div"];
  const unclaimedCount = Object.keys(gameData.unclaimedBonuses).length;
  const totalUnclaimed = Object.values(gameData.unclaimedBonuses).reduce((s, v) => s + v, 0);
  const passiveRate = getPassiveRate();
  const rocketProgress = gameData.rocketPartsOwned.length;
  const rocketTotal = ROCKET_PARTS.length;

  const navItems = [
    { label: "Classroom", emoji: "🏫", route: "/classroom" },
    { label: "Aquarium", emoji: "🐠", route: "/aquarium" },
    { label: "Zoo", emoji: "🦁", route: "/zoo" },
    { label: "Shop", emoji: "🛒", route: "/shop" },
    {
      label: "Rocket", emoji: "🚀", route: "/rocket",
      badge: rocketProgress > 0 ? `${rocketProgress}/${rocketTotal}` : undefined,
      highlight: rocketProgress === rocketTotal,
    },
    {
      label: "Badges", emoji: "🏆", route: "/achievements",
      badge: unclaimedCount > 0 ? `+${totalUnclaimed}` : undefined,
      badgeColor: colors.gold,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 20, paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {/* Player switcher */}
          <TouchableOpacity
            style={[styles.playerBtn, { backgroundColor: colors.card }]}
            onPress={() => router.push("/(tabs)/profiles")}
            activeOpacity={0.75}
          >
            <Text style={{ fontSize: 20 }}>{activeProfile?.avatar ?? "👤"}</Text>
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.appTitle, { color: colors.primary }]}>Math Minute</Text>
            {activeProfile ? (
              <Text style={[styles.appSubtitle, { color: colors.mutedForeground }]}>{activeProfile.name}</Text>
            ) : (
              <Text style={[styles.appSubtitle, { color: colors.mutedForeground }]}>How fast can you go?</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: colors.card }]}
            onPress={() => router.push("/setup")}
            activeOpacity={0.75}
          >
            <Feather name="settings" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Dual currency row */}
        {isLoaded && (
          <View style={styles.currencyRow}>
            <View style={[styles.currencyCard, { backgroundColor: colors.card, borderColor: colors.gold + "55", flex: 1 }]}>
              <Text style={styles.currencyEmoji}>⭐</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.currencyValue, { color: colors.gold }]}>{gameData.points.toLocaleString()}</Text>
                <Text style={[styles.currencyLabel, { color: colors.mutedForeground }]}>Points</Text>
              </View>
              {unclaimedCount > 0 && (
                <TouchableOpacity style={[styles.claimPill, { backgroundColor: colors.gold + "22" }]} onPress={() => router.push("/achievements")}>
                  <Text style={[styles.claimPillText, { color: colors.gold }]}>+{totalUnclaimed}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.currencyCard, { backgroundColor: colors.card, borderColor: "#00B4D8" + "55", flex: 1 }]}>
              <Text style={styles.currencyEmoji}>🪙</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.currencyValue, { color: "#00B4D8" }]}>{gameData.starCoins.toLocaleString()}</Text>
                <Text style={[styles.currencyLabel, { color: colors.mutedForeground }]}>
                  {passiveRate > 0 ? `+${passiveRate}/hr` : "Star Coins"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Stats */}
        {isLoaded && gameData.totalGames > 0 && (
          <View style={styles.statsRow}>
            {(["add", "sub", "mul", "div"] as Operation[]).map((op) => {
              const stat = gameData.opStats[op];
              if (!stat) return null;
              return (
                <View key={op} style={[styles.opCard, { backgroundColor: colors.card, borderColor: OP_COLORS[op] + "44" }]}>
                  <Text style={[styles.opSymbol, { color: OP_COLORS[op] }]}>{OP_SYMBOLS[op]}</Text>
                  <Text style={[styles.opBest, { color: colors.foreground }]}>{stat.bestDrillScore}</Text>
                  <Text style={[styles.opLabel, { color: colors.mutedForeground }]}>best</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Primary CTA */}
        <TouchableOpacity style={[styles.startBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/setup")} activeOpacity={0.82}>
          <Feather name="play" size={24} color="#fff" />
          <Text style={styles.startBtnText}>Start Drill</Text>
        </TouchableOpacity>

        {/* Nav grid */}
        <View style={styles.navGrid}>
          {navItems.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.navCard, {
                backgroundColor: colors.card,
                borderColor: item.highlight ? "#00B4D8" : item.badge ? colors.gold + "66" : colors.border,
                borderWidth: item.highlight || item.badge ? 1.5 : 1,
              }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.82}
            >
              <View style={styles.navCardTopRow}>
                <Text style={styles.navCardEmoji}>{item.emoji}</Text>
                {item.badge && (
                  <View style={[styles.navBadge, { backgroundColor: item.badgeColor ?? colors.primary }]}>
                    <Text style={styles.navBadgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.navCardLabel, { color: colors.foreground }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rocket progress teaser */}
        {isLoaded && rocketProgress > 0 && rocketProgress < rocketTotal && (
          <TouchableOpacity
            style={[styles.rocketTeaser, { backgroundColor: "#05051A", borderColor: "#00B4D8" + "55" }]}
            onPress={() => router.push("/rocket")}
          >
            <Text style={{ fontSize: 22 }}>🚀</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rocketTeaserTitle, { color: "#00B4D8" }]}>Rocket Assembly</Text>
              <View style={[styles.rocketTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.rocketFill, { width: `${(rocketProgress / rocketTotal) * 100}%` as any, backgroundColor: "#00B4D8" }]} />
              </View>
            </View>
            <Text style={[styles.rocketFraction, { color: "#00B4D8" }]}>{rocketProgress}/{rocketTotal}</Text>
          </TouchableOpacity>
        )}

        {isLoaded && gameData.totalGames === 0 && (
          <View style={[styles.welcomeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="info" size={18} color={colors.mutedForeground} />
            <Text style={[styles.welcomeText, { color: colors.mutedForeground }]}>
              Answer math questions to earn points. Decorate your classroom and zoo to earn Star Coins 🪙. Use Star Coins to build your rocket and launch to the moon!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  settingsBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  playerBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  appTitle: { fontSize: 42, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  appSubtitle: { fontSize: 16, fontFamily: "Inter_400Regular", marginTop: 4 },
  currencyRow: { flexDirection: "row", gap: 10 },
  currencyCard: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5 },
  currencyEmoji: { fontSize: 22 },
  currencyValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  currencyLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  claimPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  claimPillText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  statsRow: { flexDirection: "row", gap: 8 },
  opCard: { flex: 1, borderRadius: 14, padding: 10, alignItems: "center", gap: 2, borderWidth: 1.5 },
  opSymbol: { fontSize: 20, fontFamily: "Inter_700Bold" },
  opBest: { fontSize: 16, fontFamily: "Inter_700Bold" },
  opLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textTransform: "uppercase", letterSpacing: 0.5 },
  startBtn: { borderRadius: 18, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  startBtnText: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  navGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  navCard: { width: "30.5%", borderRadius: 16, paddingVertical: 14, alignItems: "center", gap: 6, borderWidth: 1 },
  navCardTopRow: { position: "relative", alignItems: "center" },
  navCardEmoji: { fontSize: 26 },
  navBadge: { position: "absolute", top: -4, right: -18, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  navBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#000" },
  navCardLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  rocketTeaser: { borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5 },
  rocketTeaserTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  rocketTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  rocketFill: { height: "100%", borderRadius: 3 },
  rocketFraction: { fontSize: 14, fontFamily: "Inter_700Bold" },
  welcomeCard: { borderRadius: 14, padding: 16, flexDirection: "row", gap: 12, borderWidth: 1, alignItems: "flex-start" },
  welcomeText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
