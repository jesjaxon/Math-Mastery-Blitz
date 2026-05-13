import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface TimerBarProps {
  timeLeft: number;
  totalTime: number;
}

export default function TimerBar({ timeLeft, totalTime }: TimerBarProps) {
  const colors = useColors();
  const widthAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pct = totalTime > 0 ? timeLeft / totalTime : 0;
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, totalTime, widthAnim]);

  const pct = totalTime > 0 ? timeLeft / totalTime : 0;
  const barColor =
    pct > 0.5
      ? colors.success
      : pct > 0.25
      ? colors.warning
      : colors.destructive;

  const barWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[styles.track, { backgroundColor: colors.border }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: barWidth,
            backgroundColor: barColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    width: "100%",
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
});
