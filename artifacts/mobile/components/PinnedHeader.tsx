import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export const PINNED_HEADER_BODY_HEIGHT = 64;

export function usePinnedHeaderHeight() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  return topPad + PINNED_HEADER_BODY_HEIGHT + 8;
}

export function PinnedHeader({
  title,
  subtitle,
  showBack = true,
  showSettings = true,
  onBack,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showSettings?: boolean;
  onBack?: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.wrap, { paddingTop: topPad + 8, backgroundColor: colors.background }]}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={onBack ?? (() => router.back())}
            activeOpacity={0.82}
          >
            <Feather name="arrow-left" size={26} color={colors.foreground} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconSpacer} />
        )}

        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {showSettings ? (
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/settings" as any)}
            activeOpacity={0.82}
          >
            <Feather name="settings" size={24} color={colors.foreground} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconSpacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  row: {
    minHeight: PINNED_HEADER_BODY_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSpacer: { width: 52, height: 52 },
  copy: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 27, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { marginTop: 2, fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" },
});
