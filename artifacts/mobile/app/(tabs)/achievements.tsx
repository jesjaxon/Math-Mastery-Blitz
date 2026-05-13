import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { ACHIEVEMENTS } from "@/constants/achievements";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = [
  { id: "add", label: "Addition", prefix: "add_" },
  { id: "sub", label: "Subtraction", prefix: "sub_" },
  { id: "mul", label: "Multiplication", prefix: "mul_" },
  { id: "div", label: "Division", prefix: "div_" },
  { id: "score", label: "Score", prefix: "score_" },
  { id: "streak", label: "Streak", prefix: "streak_" },
  { id: "special", label: "Special", prefix: null },
];

const SPECIAL_IDS = new Set(["all_ops", "speed_demon"]);

export default function AchievementsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gameData, claimBonus } = useGame();
  const [justClaimed, setJustClaimed] = useState<Record<string, number>>({});

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const unlocked = gameData.unlockedAchievements;
  const unclaimed = gameData.unclaimedBonuses;
  const unlockedCount = Object.keys(unlocked).length;
  const totalCount = ACHIEVEMENTS.length;

  const getCategory = (id: string) => {
    if (SPECIAL_IDS.has(id)) return "special";
    for (const cat of CATEGORIES) {
      if (cat.prefix && id.startsWith(cat.prefix)) return cat.id;
    }
    return "special";
  };

  const grouped: Record<string, typeof ACHIEVEMENTS> = {};
  for (const ach of ACHIEVEMENTS) {
    const cat = getCategory(ach.id);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(ach);
  }

  const handleClaim = (achievementId: string, pts: number) => {
    claimBonus(achievementId);
    setJustClaimed((prev) => ({ ...prev, [achievementId]: pts }));
    setTimeout(() => {
      setJustClaimed((prev) => {
        const next = { ...prev };
        delete next[achievementId];
        return next;
      });
    }, 2000);
  };

  const totalUnclaimedPts = Object.values(unclaimed).reduce((s, v) => s + v, 0);

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
          <Text style={[styles.title, { color: colors.foreground }]}>
            Achievements
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Unclaimed bonus summary */}
        {totalUnclaimedPts > 0 && (
          <TouchableOpacity
            style={[
              styles.unclaimedBanner,
              { backgroundColor: colors.gold + "18", borderColor: colors.gold },
            ]}
            activeOpacity={0.85}
          >
            <Text style={styles.unclaimedEmoji}>🎁</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.unclaimedTitle, { color: colors.gold }]}>
                Bonus Points Ready!
              </Text>
              <Text
                style={[styles.unclaimedSub, { color: colors.mutedForeground }]}
              >
                Claim +{totalUnclaimedPts} pts from your new badges below
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Progress */}
        <View
          style={[
            styles.progressCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.progressRow}>
            <Feather name="award" size={20} color={colors.gold} />
            <Text style={[styles.progressText, { color: colors.foreground }]}>
              {unlockedCount} / {totalCount} unlocked
            </Text>
            <Text style={[styles.pointsDisplay, { color: colors.gold }]}>
              ⭐ {gameData.points.toLocaleString()} pts
            </Text>
          </View>
          <View
            style={[styles.progressTrack, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.gold,
                  width: `${(unlockedCount / totalCount) * 100}%` as any,
                },
              ]}
            />
          </View>
        </View>

        {/* Categories */}
        {CATEGORIES.map((cat) => {
          const achs = grouped[cat.id];
          if (!achs || achs.length === 0) return null;
          const catUnlocked = achs.filter((a) => !!unlocked[a.id]).length;

          return (
            <View key={cat.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  {cat.label}
                </Text>
                <Text
                  style={[
                    styles.sectionCount,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {catUnlocked}/{achs.length}
                </Text>
              </View>
              <View style={styles.achList}>
                {achs.map((ach) => {
                  const isUnlocked = !!unlocked[ach.id];
                  const bonus = unclaimed[ach.id];
                  const wasClaimed = !!justClaimed[ach.id];

                  return (
                    <View
                      key={ach.id}
                      style={[
                        styles.achCard,
                        {
                          backgroundColor: isUnlocked
                            ? colors.card
                            : colors.secondary,
                          borderColor: isUnlocked
                            ? ach.color
                            : colors.border,
                          borderWidth: isUnlocked ? 1.5 : 1,
                          opacity: isUnlocked ? 1 : 0.5,
                        },
                      ]}
                    >
                      {/* Icon */}
                      <View
                        style={[
                          styles.iconWrap,
                          {
                            backgroundColor: isUnlocked
                              ? ach.color + "22"
                              : colors.muted,
                          },
                        ]}
                      >
                        <Feather
                          name={ach.icon as any}
                          size={20}
                          color={
                            isUnlocked ? ach.color : colors.mutedForeground
                          }
                        />
                      </View>

                      {/* Text */}
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text
                          style={[
                            styles.achTitle,
                            {
                              color: isUnlocked
                                ? colors.foreground
                                : colors.mutedForeground,
                            },
                          ]}
                        >
                          {ach.title}
                        </Text>
                        <Text
                          style={[
                            styles.achDesc,
                            { color: colors.mutedForeground },
                          ]}
                          numberOfLines={2}
                        >
                          {ach.description}
                        </Text>
                        <Text
                          style={[
                            styles.achBonus,
                            { color: colors.gold },
                          ]}
                        >
                          +{ach.bonusPoints} pts bonus
                        </Text>
                      </View>

                      {/* Claim / claimed */}
                      {isUnlocked && bonus && !wasClaimed && (
                        <TouchableOpacity
                          style={[
                            styles.claimBtn,
                            { backgroundColor: colors.gold },
                          ]}
                          onPress={() => handleClaim(ach.id, bonus)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.claimBtnText}>
                            Claim{"\n"}+{bonus}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {wasClaimed && (
                        <View
                          style={[
                            styles.claimedBadge,
                            { backgroundColor: colors.success + "22" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.claimedText,
                              { color: colors.success },
                            ]}
                          >
                            ✓ +{justClaimed[ach.id]}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
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
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  unclaimedBanner: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderWidth: 1.5,
  },
  unclaimedEmoji: { fontSize: 28 },
  unclaimedTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  unclaimedSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  progressCard: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressText: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  pointsDisplay: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sectionCount: { fontSize: 13, fontFamily: "Inter_500Medium" },
  achList: { gap: 8 },
  achCard: {
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  achTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  achDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  achBonus: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  claimBtn: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    flexShrink: 0,
  },
  claimBtnText: {
    color: "#000",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  claimedBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    flexShrink: 0,
  },
  claimedText: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
