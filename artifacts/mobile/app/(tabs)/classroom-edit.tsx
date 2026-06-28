import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClassroomScene } from "@/components/ClassroomScene";
import { useGame } from "@/context/GameContext";
import { useProfiles } from "@/context/ProfileContext";

export default function ClassroomEditScreen() {
  const insets = useSafeAreaInsets();
  const { gameData, updateClassroomLayout } = useGame();
  const { activeProfile } = useProfiles();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <TouchableOpacity style={styles.backButton} activeOpacity={0.84} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.settingsButton} activeOpacity={0.84} onPress={() => router.push("/settings" as any)}>
        <Feather name="settings" size={22} color="#F6F4FF" />
      </TouchableOpacity>
      <ClassroomScene
        ownedItems={gameData.ownedItems}
        equippedItems={gameData.equippedItems}
        avatar={activeProfile?.avatar}
        savedLayout={gameData.classroomLayout}
        onLayoutChange={updateClassroomLayout}
        onDone={() => router.back()}
        mode="edit"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050512",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 14,
    top: 52,
    zIndex: 50,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(22,21,44,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  backText: { color: "#F6F4FF", fontSize: 16, fontWeight: "900" },
  settingsButton: {
    position: "absolute",
    right: 14,
    top: 52,
    zIndex: 50,
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(22,21,44,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
});
