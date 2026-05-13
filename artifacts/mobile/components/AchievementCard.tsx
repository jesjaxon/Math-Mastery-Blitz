import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { AchievementDef } from "@/constants/achievements";
import { useColors } from "@/hooks/useColors";

interface AchievementCardProps {
  achievement: AchievementDef;
  unlockedAt?: number;
  compact?: boolean;
}

export default function AchievementCard({
  achievement,
  unlockedAt,
  compact = false,
}: AchievementCardProps) {
  const colors = useColors();
  const isUnlocked = !!unlockedAt;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isUnlocked
            ? colors.card
            : colors.secondary,
          borderColor: isUnlocked ? achievement.color : colors.border,
          borderWidth: isUnlocked ? 1.5 : 1,
          opacity: isUnlocked ? 1 : 0.55,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: isUnlocked
              ? achievement.color + "22"
              : colors.muted,
          },
        ]}
      >
        <Feather
          name={achievement.icon as any}
          size={compact ? 18 : 22}
          color={isUnlocked ? achievement.color : colors.mutedForeground}
        />
      </View>
      <View style={styles.textWrap}>
        <Text
          style={[
            styles.title,
            {
              color: isUnlocked ? colors.foreground : colors.mutedForeground,
              fontSize: compact ? 12 : 13,
            },
          ]}
          numberOfLines={1}
        >
          {achievement.title}
        </Text>
        {!compact && (
          <Text
            style={[styles.desc, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {achievement.description}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
  },
  desc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
  },
});
