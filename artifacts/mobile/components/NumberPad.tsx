import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface NumberPadProps {
  onPress: (key: string) => void;
  disabled?: boolean;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", ""];

const { width } = Dimensions.get("window");
const PAD_PADDING = 16;
const BTN_SIZE = Math.min((width - PAD_PADDING * 2 - 12) / 3, 110);

export default function NumberPad({ onPress, disabled = false }: NumberPadProps) {
  const colors = useColors();

  const handlePress = (key: string) => {
    if (!key || disabled) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
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
                width: BTN_SIZE,
                height: BTN_SIZE * 0.72,
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
    gap: 6,
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
