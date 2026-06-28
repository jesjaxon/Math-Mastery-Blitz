import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { playGameSound } from "@/utils/gameAudio";

interface NumberPadProps {
  onPress: (key: string) => void;
  disabled?: boolean;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

const SCREEN_SIDE_PADDING = 40;
const PAD_PADDING = 16;
const GRID_GAP = 8;
const MAX_BTN_WIDTH = 104;

export default function NumberPad({ onPress, disabled = false }: NumberPadProps) {
  const colors = useColors();
  const { settings } = useGame();
  const { width } = useWindowDimensions();
  const usableWidth = width - SCREEN_SIDE_PADDING - PAD_PADDING * 2;
  const btnWidth = Math.min(
    (usableWidth - GRID_GAP * 2) / 3,
    MAX_BTN_WIDTH
  );
  const btnHeight = Math.max(58, btnWidth * 0.72);

  const handlePress = (key: string) => {
    if (!key || disabled) return;
    if (settings.hapticsEnabled && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    playGameSound("keyTap", settings.soundEnabled, settings.soundVolume);
    onPress(key);
  };

  return (
    <View style={styles.container}>
      {KEYS.map((key, i) => {
        if (key === "") {
          return <View key={i} style={[styles.btn, { opacity: 0 }]} />;
        }
        const isDel = key === "del";
        return (
          <TouchableOpacity
            key={i}
            style={[
              styles.btn,
              {
                backgroundColor: isDel
                  ? colors.secondary
                  : colors.card,
                borderColor: colors.border,
                opacity: disabled ? 0.4 : 1,
                width: btnWidth,
                height: btnHeight,
              },
            ]}
            onPress={() => handlePress(key)}
            activeOpacity={0.65}
            disabled={disabled}
            testID={`key-${key}`}
          >
            {isDel ? (
              <Feather name="delete" size={26} color={colors.mutedForeground} />
            ) : (
              <Text
                style={[
                  styles.btnText,
                  { color: colors.foreground },
                ]}
              >
                {key}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: GRID_GAP,
    paddingHorizontal: PAD_PADDING,
  },
  btn: {
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  btnText: {
    fontSize: 28,
    fontFamily: "Inter_600SemiBold",
  },
});
