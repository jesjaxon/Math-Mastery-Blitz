import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
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
import { ROCKET_PARTS } from "@/constants/rocketParts";
import { getProfileAvatarAsset } from "@/constants/profileAvatars";
import { useGame } from "@/context/GameContext";
import { useProfiles } from "@/context/ProfileContext";
import { useColors } from "@/hooks/useColors";
import { XpBar } from "@/components/XpBar";

const MENU_ASSETS = {
  profile: require("@/assets/game/menu/profile.png"),
  points: require("@/assets/game/menu/points.png"),
  starCoin: require("@/assets/game/menu/star-coin.png"),
  classroom: require("@/assets/game/menu/classroom.png"),
  aquarium: require("@/assets/game/menu/aquarium.png"),
  zoo: require("@/assets/game/menu/zoo.png"),
  shop: require("@/assets/game/menu/shop.png"),
  workshop: require("@/assets/game/menu/workshop.png"),
  rocket: require("@/assets/game/menu/rocket.png"),
  badges: require("@/assets/game/menu/badges.png"),
  start: require("@/assets/game/menu/start.png"),
  operations: require("@/assets/game/menu/operations.png"),
  titleBanner: require("@/assets/game/menu/one-minute-space-math-banner.png"),
  settings: require("@/assets/game/menu/settings.png"),
} satisfies Record<string, ImageSourcePropType>;

type NavItem = {
  label: string;
  route: string;
  asset: ImageSourcePropType;
  color: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  highlight?: boolean;
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gameData, isLoaded, getPassiveRate, getLevelInfo } = useGame();
  const { activeProfile, profiles } = useProfiles();

  useEffect(() => {
    if (profiles.length > 0 && !activeProfile) {
      router.replace("/(tabs)/profiles");
    }
  }, [activeProfile, profiles]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const headerHeight = topPad + 112;

  const unclaimedCount = Object.keys(gameData.unclaimedBonuses).length;
  const totalUnclaimed = Object.values(gameData.unclaimedBonuses).reduce((s, v) => s + v, 0);
  const passiveRate = getPassiveRate();
  const rocketProgress = gameData.rocketPartsOwned.length;
  const rocketTotal = ROCKET_PARTS.length;
  const levelInfo = getLevelInfo(gameData.points);
  const nextLevelTitle = levelInfo.nextLevelXp
    ? getLevelInfo(levelInfo.nextLevelXp).title
    : levelInfo.title;
  const activeAvatarAsset = getProfileAvatarAsset(activeProfile?.avatar) ?? MENU_ASSETS.profile;

  const navItems: NavItem[] = [
    { label: "Account", asset: activeAvatarAsset, route: "/account", color: "#7C6FFF", subtitle: "Stats & analytics" },
    { label: "Leaderboard", asset: MENU_ASSETS.badges, route: "/leaderboard", color: "#FFD166", subtitle: "Compete online" },
    { label: "Classroom", asset: MENU_ASSETS.classroom, route: "/classroom", color: "#8ACB5A", subtitle: "Decorate" },
    { label: "Aquarium", asset: MENU_ASSETS.aquarium, route: "/aquarium", color: "#00B4D8", subtitle: "Collect sea pals" },
    { label: "Zoo", asset: MENU_ASSETS.zoo, route: "/zoo", color: "#66BB6A", subtitle: "Adopt animals" },
    { label: "Shop", asset: MENU_ASSETS.shop, route: "/shop", color: "#FF6B9D", subtitle: "New rewards" },
    { label: "Workshop", asset: MENU_ASSETS.workshop, route: "/workshop", color: "#9C7CFF", subtitle: "Craft boosts" },
    {
      label: "Rocket", asset: MENU_ASSETS.rocket, route: "/rocket", color: "#00B4D8", subtitle: "Build & launch",
      badge: rocketProgress > 0 ? `${rocketProgress}/${rocketTotal}` : undefined,
      highlight: rocketProgress === rocketTotal,
    },
    {
      label: "Badges", asset: MENU_ASSETS.badges, route: "/achievements", color: "#FFD166", subtitle: "Claim prizes",
      badge: unclaimedCount > 0 ? `+${totalUnclaimed}` : undefined,
      badgeColor: colors.gold,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.homeHeader, { paddingTop: topPad + 8, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.headerAvatarBtn, { backgroundColor: "#16152C", borderColor: "#7C6FFF66" }]}
          onPress={() => router.push("/(tabs)/profiles")}
          activeOpacity={0.78}
        >
          <Image source={activeAvatarAsset} style={styles.headerAvatarAsset} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.headerLogoWrap}>
          <Image source={MENU_ASSETS.titleBanner} style={styles.headerLogo} resizeMode="contain" />
        </View>
        <TouchableOpacity
          style={[styles.headerSettingsBtn, { backgroundColor: "#16152C", borderColor: "#7C6FFF66" }]}
          onPress={() => router.push("/settings" as any)}
          activeOpacity={0.82}
        >
          <Image source={MENU_ASSETS.settings} style={styles.headerSettingsAsset} resizeMode="contain" />
        </TouchableOpacity>
      </View>
      <ScrollView
        bounces={false}
        alwaysBounceVertical={false}
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight + 8, paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.push("/setup")} activeOpacity={0.9}>
          <LinearGradient
            colors={["#15143A", "#092E3B", "#251845"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroCopy}>
              <View style={styles.heroEyebrow}>
                <Image source={MENU_ASSETS.operations} style={styles.eyebrowIcon} resizeMode="contain" />
                <Text style={styles.heroEyebrowText}>60 second challenge</Text>
              </View>
              <Text style={styles.heroTitle}>Math Fuel</Text>
              <Text style={styles.heroSub} numberOfLines={2}>Solve fast. Power your rocket.</Text>
              <View style={styles.heroStartPill}>
                <View style={styles.heroPlayBadge}>
                  <Feather name="play" size={17} color="#101027" />
                </View>
                <Text style={styles.heroStartText}>Start Drill</Text>
              </View>
            </View>
            <Image source={MENU_ASSETS.start} style={styles.heroAsset} resizeMode="contain" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Dual currency row */}
        {isLoaded && (
          <View style={styles.currencyRow}>
            <View style={[styles.currencyCard, { backgroundColor: "#16152C", borderColor: colors.gold + "55", flex: 1 }]}>
              <Image source={MENU_ASSETS.points} style={styles.currencyAsset} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.currencyValue, { color: colors.gold }]} numberOfLines={1}>{gameData.points.toLocaleString()}</Text>
                <Text style={[styles.currencyLabel, { color: colors.mutedForeground }]} numberOfLines={1}>Points</Text>
              </View>
              <View style={styles.currencyMeta}>
                <View style={[styles.levelBadge, { backgroundColor: colors.primary + "22" }]}>
                  <Text style={[styles.levelBadgeText, { color: colors.primary }]}>Lv {levelInfo.level}</Text>
                </View>
                {unclaimedCount > 0 && (
                  <TouchableOpacity style={[styles.claimPill, { backgroundColor: colors.gold + "22" }]} onPress={() => router.push("/achievements")}>
                    <Text style={[styles.claimPillText, { color: colors.gold }]}>+{totalUnclaimed}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={[styles.currencyCard, { backgroundColor: "#101F30", borderColor: "#00B4D8" + "55", flex: 1 }]}>
              <Image source={MENU_ASSETS.starCoin} style={styles.currencyAsset} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.currencyValue, { color: "#00B4D8" }]} numberOfLines={1}>{gameData.starCoins.toLocaleString()}</Text>
                <Text style={[styles.currencyLabel, { color: colors.mutedForeground }]}>
                  {passiveRate > 0 ? `+${passiveRate} Star Coins/min in drills` : "Star Coins"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {isLoaded && (
          <TouchableOpacity
            style={[styles.xpCard, { backgroundColor: "#15142C", borderColor: "#7C6FFF55" }]}
            onPress={() => router.push("/account" as any)}
            activeOpacity={0.84}
          >
            <View style={styles.xpHeader}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.xpTitle, { color: colors.foreground }]} numberOfLines={1}>
                  Lv {levelInfo.level} · {levelInfo.title}
                </Text>
                <Text style={[styles.xpSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {levelInfo.isMaxLevel
                    ? `${levelInfo.currentXp.toLocaleString()} lifetime XP · max rank`
                    : `${levelInfo.xpToNext.toLocaleString()} XP to ${nextLevelTitle}`}
                </Text>
              </View>
              <Text style={[styles.xpValue, { color: "#9AE6FF" }]}>
                {levelInfo.currentXp.toLocaleString()} XP
              </Text>
            </View>
            <XpBar progress={levelInfo.progress} height={12} />
          </TouchableOpacity>
        )}

        {/* Nav grid */}
        <View style={styles.navGrid}>
          {navItems.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.navCard, {
                backgroundColor: "#15142C",
                borderColor: item.highlight ? "#00B4D8" : item.badge ? colors.gold + "66" : item.color + "44",
              }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.82}
            >
              <View style={[styles.navIconWell, { backgroundColor: item.color + "18" }]}>
                <Image source={item.asset} style={styles.navAsset} resizeMode="contain" />
                {item.badge && (
                  <View style={[styles.navBadge, { backgroundColor: item.badgeColor ?? colors.primary }]}>
                    <Text style={styles.navBadgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.navCardLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Text style={[styles.navCardSub, { color: colors.mutedForeground }]} numberOfLines={1}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rocket progress teaser */}
        {isLoaded && rocketProgress > 0 && rocketProgress < rocketTotal && (
          <TouchableOpacity
            style={[styles.rocketTeaser, { backgroundColor: "#05051A", borderColor: "#00B4D8" + "55" }]}
            onPress={() => router.push("/rocket")}
          >
            <Image source={MENU_ASSETS.rocket} style={styles.rocketAsset} resizeMode="contain" />
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
            <Image source={MENU_ASSETS.operations} style={styles.welcomeAsset} resizeMode="contain" />
            <Text style={[styles.welcomeText, { color: colors.mutedForeground }]}>
              Answer math questions to earn Points. Decorate your classroom and adopt animals to earn Star Coins while playing drills.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 18, gap: 14 },
  homeHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    minHeight: 112,
    paddingHorizontal: 18,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatarBtn: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    overflow: "hidden",
  },
  headerAvatarAsset: { width: 56, height: 56 },
  headerLogoWrap: {
    flex: 1,
    minWidth: 0,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLogo: { width: "100%", height: 76 },
  headerSettingsBtn: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  headerSettingsAsset: { width: 44, height: 44 },
  heroCard: {
    minHeight: 176,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroCopy: { flex: 1, gap: 9, paddingRight: 130, zIndex: 1 },
  heroEyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyebrowIcon: { width: 28, height: 28 },
  heroEyebrowText: { color: "#9AE6FF", fontSize: 12, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0 },
  heroTitle: { color: "#FFFFFF", fontSize: 27, fontFamily: "Inter_700Bold", lineHeight: 31 },
  heroSub: { color: "rgba(255,255,255,0.74)", fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  heroStartPill: {
    marginTop: 4,
    alignSelf: "flex-start",
    minWidth: 142,
    height: 48,
    paddingLeft: 10,
    paddingRight: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 16,
    backgroundColor: "#FFD166",
    shadowColor: "#FFD166",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  heroPlayBadge: { width: 28, height: 28, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.48)", alignItems: "center", justifyContent: "center" },
  heroStartText: { color: "#09091A", fontSize: 14, fontFamily: "Inter_700Bold" },
  heroAsset: { position: "absolute", right: 12, bottom: 16, width: 108, height: 108, opacity: 0.98 },
  currencyRow: { flexDirection: "row", gap: 10 },
  currencyCard: { minHeight: 76, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5 },
  currencyAsset: { width: 36, height: 36 },
  currencyValue: { fontSize: 20, fontFamily: "Inter_700Bold", includeFontPadding: false },
  currencyLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  currencyMeta: { alignItems: "flex-end", gap: 5 },
  levelBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  levelBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  claimPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  claimPillText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  xpCard: { borderRadius: 18, borderWidth: 1.5, padding: 13, gap: 10 },
  xpHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  xpTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  xpSub: { marginTop: 2, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  xpValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  startBtn: { borderRadius: 18, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  startBtnText: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  navGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  navCard: { width: "48.5%", minHeight: 142, borderRadius: 22, padding: 12, alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5 },
  navIconWell: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center", position: "relative" },
  navAsset: { width: 68, height: 68 },
  navBadge: { position: "absolute", top: -5, right: -8, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  navBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#000" },
  navCardLabel: { fontSize: 15, fontFamily: "Inter_700Bold", textAlign: "center" },
  navCardSub: { fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "center" },
  rocketTeaser: { borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5 },
  rocketAsset: { width: 44, height: 44 },
  rocketTeaserTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  rocketTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  rocketFill: { height: "100%", borderRadius: 3 },
  rocketFraction: { fontSize: 14, fontFamily: "Inter_700Bold" },
  welcomeCard: { borderRadius: 18, padding: 14, flexDirection: "row", gap: 12, borderWidth: 1, alignItems: "center" },
  welcomeAsset: { width: 42, height: 42 },
  welcomeText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
