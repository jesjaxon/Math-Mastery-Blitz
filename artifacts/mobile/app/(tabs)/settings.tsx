import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useRef } from "react";
import {
  Alert,
  Image,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { START_DRILL_ASSETS } from "@/constants/startDrillAssets";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { PinnedHeader, usePinnedHeaderHeight } from "@/components/PinnedHeader";
import { MAIN_MUSIC_TRACKS, SPACE_MUSIC_TRACKS, type MusicTrackOption } from "@/utils/gameAudio";

function SettingSwitch({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.settingIcon, { backgroundColor: colors.primary + "22" }]}>
        <Feather name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.settingSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function SettingsAction({
  icon,
  title,
  subtitle,
  onPress,
  destructive = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const colors = useColors();
  const accent = destructive ? "#FF4D6D" : colors.primary;
  return (
    <TouchableOpacity
      style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={[styles.settingIcon, { backgroundColor: accent + "22" }]}>
        <Feather name={icon} size={20} color={accent} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, { color: destructive ? "#FF8FA3" : colors.foreground }]}>{title}</Text>
        <Text style={[styles.settingSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function VolumeSlider({
  icon,
  title,
  value,
  onChange,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const colors = useColors();
  const trackRef = useRef<View>(null);
  const trackLeft = useRef(0);
  const trackWidth = useRef(1);

  const commitFromPageX = (pageX: number) => {
    const next = Math.max(0, Math.min(1, (pageX - trackLeft.current) / trackWidth.current));
    onChange(Math.round(next * 100) / 100);
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          trackRef.current?.measureInWindow((x, _y, width) => {
            trackLeft.current = x;
            trackWidth.current = Math.max(1, width);
            commitFromPageX(event.nativeEvent.pageX);
          });
        },
        onPanResponderMove: (event) => commitFromPageX(event.nativeEvent.pageX),
      }),
    [onChange]
  );

  return (
    <View style={[styles.volumeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.settingIcon, { backgroundColor: colors.primary + "22" }]}>
        <Feather name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.volumeCopy}>
        <View style={styles.volumeTitleRow}>
          <Text style={[styles.settingTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.volumeValue, { color: colors.mutedForeground }]}>{Math.round(value * 100)}%</Text>
        </View>
        <View ref={trackRef} style={[styles.volumeTrack, { backgroundColor: colors.border }]} {...responder.panHandlers}>
          <View style={[styles.volumeFill, { width: `${value * 100}%`, backgroundColor: colors.primary }]} />
          <View style={[styles.volumeThumb, { left: `${value * 100}%`, backgroundColor: colors.foreground }]} />
        </View>
      </View>
    </View>
  );
}

function SoundtrackPicker({
  title,
  tracks,
  selected,
  onChange,
}: {
  title: string;
  tracks: MusicTrackOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const colors = useColors();
  const toggle = (id: string) => {
    const isOn = selected.includes(id);
    const next = isOn ? selected.filter((x) => x !== id) : [...selected, id];
    onChange(next.length > 0 ? next : selected);
  };

  return (
    <View style={[styles.soundtrackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.soundtrackTitle, { color: colors.foreground }]}>{title}</Text>
      {tracks.map((track) => {
        const isOn = selected.includes(track.id);
        return (
          <TouchableOpacity
            key={track.id}
            style={[
              styles.trackOption,
              {
                backgroundColor: isOn ? colors.primary + "22" : "rgba(255,255,255,0.04)",
                borderColor: isOn ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.82}
            onPress={() => toggle(track.id)}
          >
            <Feather name={isOn ? "check-circle" : "circle"} size={20} color={isOn ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.trackLabel, { color: isOn ? colors.foreground : colors.mutedForeground }]}>
              {track.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    settings,
    updateSettings,
    resetGameProgress,
    resetAchievements,
    gameData,
    setDevUnlimitedMoney,
  } = useGame();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const headerHeight = usePinnedHeaderHeight();

  const confirmResetGame = () => {
    Alert.alert("Reset game?", "This clears Points, Star Coins, items, animals, rockets, and classroom progress.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: resetGameProgress },
    ]);
  };

  const confirmResetAchievements = () => {
    Alert.alert("Reset badges?", "This clears unlocked badges and unclaimed badge prizes.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: resetAchievements },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PinnedHeader title="Settings" showSettings={false} />
      <ScrollView
        bounces={false}
        alwaysBounceVertical={false}
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight + 8, paddingBottom: bottomPad + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#191446", "#10293E", "#27184A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <Feather name="settings" size={34} color="#FFFFFF" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Game Controls</Text>
            <Text style={styles.heroSub}>Sound, feedback, profiles, and progress tools.</Text>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Play Feel</Text>
          <SettingSwitch
            icon="volume-2"
            title="Sound effects"
            subtitle="Keypad taps, correct answers, and wrong answer sounds"
            value={settings.soundEnabled}
            onValueChange={(soundEnabled) => updateSettings({ soundEnabled })}
          />
          <VolumeSlider
            icon="volume-1"
            title="Sound volume"
            value={settings.soundVolume}
            onChange={(soundVolume) => updateSettings({ soundVolume })}
          />
          <SettingSwitch
            icon="music"
            title="Music"
            subtitle="Loop the kid-friendly space beat"
            value={settings.musicEnabled}
            onValueChange={(musicEnabled) => updateSettings({ musicEnabled })}
          />
          <VolumeSlider
            icon="disc"
            title="Music volume"
            value={settings.musicVolume}
            onChange={(musicVolume) => updateSettings({ musicVolume })}
          />
          <View style={styles.soundtrackMenu}>
            <Text style={[styles.soundtrackMenuTitle, { color: colors.foreground }]}>Soundtrack Menu</Text>
            <SoundtrackPicker
              title="Main Game Loop"
              tracks={MAIN_MUSIC_TRACKS}
              selected={settings.mainMusicTracks}
              onChange={(mainMusicTracks) => updateSettings({ mainMusicTracks })}
            />
            <SoundtrackPicker
              title="Space Mode Loop"
              tracks={SPACE_MUSIC_TRACKS}
              selected={settings.spaceMusicTracks}
              onChange={(spaceMusicTracks) => updateSettings({ spaceMusicTracks })}
            />
          </View>
          <SettingSwitch
            icon="zap"
            title="Haptic feedback"
            subtitle="Phone taps and wrong answer bumps"
            value={settings.hapticsEnabled}
            onValueChange={(hapticsEnabled) => updateSettings({ hapticsEnabled })}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Game</Text>
          <SettingsAction
            icon="sliders"
            title="Drill setup"
            subtitle={`${settings.timeLimit}s · ${settings.difficulty} · ${settings.operations.length} operation${settings.operations.length === 1 ? "" : "s"}`}
            onPress={() => router.push("/setup")}
          />
          <SettingsAction
            icon="users"
            title="Players"
            subtitle="Switch player or manage profiles"
            onPress={() => router.push("/profiles")}
          />
          <SettingsAction
            icon="bar-chart-2"
            title="Account analytics"
            subtitle="Slowest questions and most missed problems"
            onPress={() => router.push("/account" as any)}
          />
          <SettingsAction
            icon="award"
            title="Leaderboard rewards"
            subtitle="Manage seasonal prizes and special giveaways"
            onPress={() => router.push("/leaderboard-rewards" as any)}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dev Panel</Text>
          <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: "#FFD16622" }]}>
              <Feather name="tool" size={20} color="#FFD166" />
            </View>
            <View style={styles.settingCopy}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>Unlimited money</Text>
              <Text style={[styles.settingSub, { color: colors.mutedForeground }]}>Testing mode for purchases and upgrades</Text>
            </View>
            <Switch value={settings.devUnlimitedMoney} onValueChange={setDevUnlimitedMoney} />
          </View>
          <View style={[styles.devStats, { borderColor: colors.border }]}>
            <Text style={[styles.devStatText, { color: colors.mutedForeground }]}>
              Items {gameData.ownedItems.length} · Animals {gameData.aquariumAnimals.length + gameData.zooAnimals.length} · Rockets {gameData.rocketPartsOwned.length}/6
            </Text>
          </View>
          <SettingsAction
            icon="refresh-cw"
            title="Reset game"
            subtitle="Clear progress, purchases, classroom, aquarium, zoo, and rocket"
            onPress={confirmResetGame}
            destructive
          />
          <SettingsAction
            icon="award"
            title="Reset badges"
            subtitle="Clear achievements and unclaimed prizes"
            onPress={confirmResetAchievements}
            destructive
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 18 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 10 },
  backBtn: { width: 54, height: 54, alignItems: "center", justifyContent: "center" },
  backAsset: { width: 58, height: 58 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  hero: {
    borderRadius: 24,
    padding: 18,
    minHeight: 112,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,111,255,0.4)",
  },
  heroCopy: { flex: 1, gap: 4 },
  heroTitle: { color: "#FFFFFF", fontSize: 22, fontFamily: "Inter_700Bold" },
  heroSub: { color: "rgba(255,255,255,0.72)", fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 2 },
  settingRow: {
    minHeight: 78,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionRow: {
    minHeight: 78,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  settingCopy: { flex: 1, gap: 3 },
  settingTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  settingSub: { fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 16 },
  volumeRow: {
    minHeight: 76,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  volumeCopy: { flex: 1, gap: 10 },
  volumeTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  volumeValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  volumeTrack: { height: 14, borderRadius: 7, overflow: "visible", justifyContent: "center" },
  volumeFill: { position: "absolute", left: 0, height: 14, borderRadius: 7 },
  volumeThumb: {
    position: "absolute",
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.2)",
  },
  soundtrackMenu: { gap: 10 },
  soundtrackMenuTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  soundtrackCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 9,
  },
  soundtrackTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  trackOption: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  trackLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  devStats: { borderWidth: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "rgba(255,255,255,0.03)" },
  devStatText: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" },
});
