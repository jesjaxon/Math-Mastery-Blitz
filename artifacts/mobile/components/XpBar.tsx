import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { UI_ASSETS } from "@/constants/uiAssets";

export function XpBar({
  progress,
  height = 14,
}: {
  progress: number;
  height?: number;
}) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  return (
    <View style={[styles.wrap, { height, borderRadius: height / 2 }]}>
      <Image source={UI_ASSETS.xpBarTrack} style={styles.asset} resizeMode="stretch" />
      <View
        style={[
          styles.fillClip,
          {
            width: `${clampedProgress * 100}%` as any,
            borderRadius: height / 2,
          },
        ]}
      >
        <Image source={UI_ASSETS.xpBarFill} style={styles.asset} resizeMode="stretch" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", overflow: "hidden", position: "relative" },
  asset: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  fillClip: { position: "absolute", top: 0, left: 0, bottom: 0, overflow: "hidden" },
});
