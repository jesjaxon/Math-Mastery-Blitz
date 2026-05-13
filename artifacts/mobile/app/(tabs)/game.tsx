import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NumberPad from "@/components/NumberPad";
import TimerBar from "@/components/TimerBar";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { generateQuestion, type Question } from "@/utils/mathUtils";
import type { Operation } from "@/constants/achievements";

export default function GameScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, setLastSession, saveSession } = useGame();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [question, setQuestion] = useState<Question>(() =>
    generateQuestion(settings.operations, settings.difficulty)
  );
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.timeLimit);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctByOp, setCorrectByOp] = useState<Partial<Record<Operation, number>>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const flashAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const maxStreakRef = useRef(0);
  const correctByOpRef = useRef<Partial<Record<Operation, number>>>({});

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion(settings.operations, settings.difficulty));
    setInput("");
    setIsTransitioning(false);
  }, [settings.operations, settings.difficulty]);

  const handleCorrect = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    const newScore = scoreRef.current + 1;
    const newStreak = streakRef.current + 1;
    const newMaxStreak = Math.max(maxStreakRef.current, newStreak);

    scoreRef.current = newScore;
    streakRef.current = newStreak;
    maxStreakRef.current = newMaxStreak;

    setScore(newScore);
    setStreak(newStreak);
    setMaxStreak(newMaxStreak);

    const op = question.op;
    const prev = correctByOpRef.current[op] ?? 0;
    correctByOpRef.current = { ...correctByOpRef.current, [op]: prev + 1 };
    setCorrectByOp({ ...correctByOpRef.current });

    setIsTransitioning(true);

    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 80, useNativeDriver: false }),
      Animated.timing(flashAnim, { toValue: 0, duration: 220, useNativeDriver: false }),
    ]).start();

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.12, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    setTimeout(nextQuestion, 300);
  }, [question, flashAnim, scaleAnim, nextQuestion]);

  const handleWrong = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    streakRef.current = 0;
    setStreak(0);

    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (isTransitioning || gameOver) return;

      if (key === "del") {
        setInput((v) => v.slice(0, -1));
        return;
      }

      const newInput = input + key;

      if (newInput.length > 3) return;

      setInput(newInput);

      const numVal = parseInt(newInput, 10);
      if (numVal === question.answer) {
        handleCorrect();
      } else if (
        newInput.length >= String(question.answer).length &&
        numVal !== question.answer
      ) {
        handleWrong();
      }
    },
    [input, question, isTransitioning, gameOver, handleCorrect, handleWrong]
  );

  useEffect(() => {
    if (timeLeft <= 0 || gameOver) return;
    const timer = setTimeout(() => {
      if (timeLeft === 1) {
        setGameOver(true);
        const result = {
          score: scoreRef.current,
          correctByOp: correctByOpRef.current,
          maxStreak: maxStreakRef.current,
          operations: settings.operations,
          timeLimit: settings.timeLimit,
          difficulty: settings.difficulty,
        };
        const newAchievements = saveSession(result);
        setLastSession({ ...result, newAchievements } as any);
        router.replace("/results");
      } else {
        setTimeLeft((t) => t - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameOver, settings, saveSession, setLastSession]);

  const flashBg = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, colors.success + "33"],
  });

  const inputBg = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.card, colors.success + "55"],
  });

  const inputBorderColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.success],
  });

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeDisplay =
    settings.timeLimit >= 60
      ? `${mins}:${secs.toString().padStart(2, "0")}`
      : `${timeLeft}s`;

  return (
    <Animated.View
      style={[styles.root, { backgroundColor: flashBg, paddingTop: topPad }]}
    >
      {/* Timer section */}
      <View style={styles.topBar}>
        <TimerBar timeLeft={timeLeft} totalTime={settings.timeLimit} />
        <View style={styles.topRow}>
          <Text style={[styles.timerText, { color: colors.mutedForeground }]}>
            {timeDisplay}
          </Text>
          <Animated.Text
            style={[
              styles.scoreText,
              { color: colors.primary, transform: [{ scale: scaleAnim }] },
            ]}
          >
            {score}
          </Animated.Text>
          {streak >= 3 && (
            <View style={[styles.streakBadge, { backgroundColor: colors.gold + "22" }]}>
              <Text style={[styles.streakText, { color: colors.gold }]}>
                🔥 {streak}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Question */}
      <View style={styles.questionArea}>
        <Text style={[styles.questionText, { color: colors.foreground }]}>
          {question.display}
        </Text>
        <Text style={[styles.equalsText, { color: colors.mutedForeground }]}>= ?</Text>
      </View>

      {/* Answer Input */}
      <Animated.View
        style={[
          styles.inputBox,
          {
            backgroundColor: inputBg,
            borderColor: inputBorderColor,
            transform: [{ translateX: shakeAnim }],
          },
        ]}
      >
        <Text
          style={[
            styles.inputText,
            {
              color: input ? colors.foreground : colors.mutedForeground,
            },
          ]}
        >
          {input || "—"}
        </Text>
      </Animated.View>

      {/* Number Pad */}
      <View style={[styles.padArea, { paddingBottom: bottomPad + 12 }]}>
        <NumberPad onPress={handleKeyPress} disabled={isTransitioning || gameOver} />
      </View>

      {/* Quit */}
      <TouchableOpacity
        style={styles.quitBtn}
        onPress={() => router.replace("/")}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.quitText, { color: colors.mutedForeground }]}>
          Quit
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  topBar: { gap: 8, paddingTop: 12 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timerText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    minWidth: 48,
  },
  scoreText: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
  },
  streakBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 56,
    alignItems: "center",
  },
  streakText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  questionArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  questionText: {
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -1,
  },
  equalsText: {
    fontSize: 28,
    fontFamily: "Inter_500Medium",
  },
  inputBox: {
    borderRadius: 20,
    borderWidth: 2,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 16,
    minHeight: 80,
    justifyContent: "center",
  },
  inputText: {
    fontSize: 44,
    fontFamily: "Inter_700Bold",
    letterSpacing: 4,
  },
  padArea: { paddingTop: 4 },
  quitBtn: {
    position: "absolute",
    top: 12,
    left: 20,
    padding: 4,
  },
  quitText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
