import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NumberPad from "@/components/NumberPad";
import TimerBar from "@/components/TimerBar";
import { OIL_RIG_FRAMES } from "@/constants/drillAnimationAssets";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { playGameSound } from "@/utils/gameAudio";
import { generateQuestion, type Question } from "@/utils/mathUtils";
import type { DrillQuestionAnalyticsEntry, Operation } from "@/constants/achievements";

const roundCurrency = (value: number) => Math.round(value * 100) / 100;
const formatEarned = (value: number) => value.toFixed(2);
const getQuestionKey = (q: Question) => `${q.op}:${q.a}:${q.b}`;

export default function GameScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, setLastSession, saveSession, addDrillTickRewards, getPassiveRate } = useGame();

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
  const [correctByOp, setCorrectByOp] = useState<
    Partial<Record<Operation, number>>
  >({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [passivePointsEarned, setPassivePointsEarned] = useState(0);
  const [passiveStarCoinsEarned, setPassiveStarCoinsEarned] = useState(0);
  const [animationFrame, setAnimationFrame] = useState(0);

  const flashAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const maxStreakRef = useRef(0);
  const correctByOpRef = useRef<Partial<Record<Operation, number>>>({});
  const elapsedSecondsRef = useRef(0);
  const passivePointsEarnedRef = useRef(0);
  const passiveStarCoinsEarnedRef = useRef(0);
  const passiveRateRef = useRef(0);
  const questionStartMsRef = useRef(Date.now());
  const questionAnalyticsRef = useRef<DrillQuestionAnalyticsEntry[]>([]);
  const nextQuestionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    passiveRateRef.current = getPassiveRate();
  }, [getPassiveRate]);

  useEffect(() => {
    return () => {
      if (nextQuestionTimeoutRef.current) {
        clearTimeout(nextQuestionTimeoutRef.current);
      }
    };
  }, []);

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion(settings.operations, settings.difficulty));
    questionStartMsRef.current = Date.now();
    setInput("");
    setIsTransitioning(false);
  }, [settings.operations, settings.difficulty]);

  useEffect(() => {
    if (gameOver) return;
    const animationTimer = setInterval(() => {
      setAnimationFrame((frame) => (frame + 1) % OIL_RIG_FRAMES.length);
    }, 190);
    return () => clearInterval(animationTimer);
  }, [gameOver]);

  const handleCorrect = useCallback(() => {
    if (settings.hapticsEnabled && Platform.OS !== "web") {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});
    }
    playGameSound("correct", settings.soundEnabled, settings.soundVolume);
    questionAnalyticsRef.current = [
      ...questionAnalyticsRef.current,
      {
        questionKey: getQuestionKey(question),
        display: question.display,
        op: question.op,
        difficulty: settings.difficulty,
        answer: question.answer,
        correct: true,
        responseMs: Date.now() - questionStartMsRef.current,
      },
    ];

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
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: false,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.12,
        duration: 80,
        useNativeDriver: false,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();

    if (nextQuestionTimeoutRef.current) {
      clearTimeout(nextQuestionTimeoutRef.current);
    }
    nextQuestionTimeoutRef.current = setTimeout(() => {
      nextQuestionTimeoutRef.current = null;
      nextQuestion();
    }, 300);
  }, [question, flashAnim, scaleAnim, nextQuestion, settings.difficulty, settings.hapticsEnabled, settings.soundEnabled, settings.soundVolume]);

  const handleWrong = useCallback(() => {
    if (settings.hapticsEnabled && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    playGameSound("wrong", settings.soundEnabled, settings.soundVolume);
    questionAnalyticsRef.current = [
      ...questionAnalyticsRef.current,
      {
        questionKey: getQuestionKey(question),
        display: question.display,
        op: question.op,
        difficulty: settings.difficulty,
        answer: question.answer,
        correct: false,
      },
    ];
    streakRef.current = 0;
    setStreak(0);

    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 50,
        useNativeDriver: false,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 50,
        useNativeDriver: false,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 50,
        useNativeDriver: false,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: false,
      }),
    ]).start();
  }, [question, shakeAnim, settings.difficulty, settings.hapticsEnabled, settings.soundEnabled, settings.soundVolume]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (isTransitioning || gameOver) return;

      if (key === "del") {
        setInput((v) => v.slice(0, -1));
        return;
      }

      const newInput = input + key;
      const maxAnswerLength = Math.max(1, String(question.answer).length);
      if (newInput.length > maxAnswerLength) return;

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
      elapsedSecondsRef.current += 1;
      const passiveRatePerMinute = passiveRateRef.current;
      if (passiveRatePerMinute > 0) {
        const tickReward = roundCurrency(passiveRatePerMinute / 60);
        if (tickReward > 0) {
          passivePointsEarnedRef.current = roundCurrency(
            passivePointsEarnedRef.current + tickReward
          );
          passiveStarCoinsEarnedRef.current = roundCurrency(
            passiveStarCoinsEarnedRef.current + tickReward
          );
          setPassivePointsEarned(passivePointsEarnedRef.current);
          setPassiveStarCoinsEarned(passiveStarCoinsEarnedRef.current);
          addDrillTickRewards(tickReward, tickReward);
        }
      }
      if (timeLeft === 1) {
        setGameOver(true);
        const result = {
          score: scoreRef.current,
          correctByOp: correctByOpRef.current,
          maxStreak: maxStreakRef.current,
          operations: settings.operations,
          timeLimit: settings.timeLimit,
          difficulty: settings.difficulty,
          totalGames: 0,
          durationSeconds: elapsedSecondsRef.current,
          questionAnalytics: questionAnalyticsRef.current,
        };
        const { newAchievements, pointsEarned, starCoinsEarned, planetGemsEarned } = saveSession(result);
        setLastSession({
          ...result,
          newAchievements,
          pointsEarned: roundCurrency(pointsEarned + passivePointsEarnedRef.current),
          starCoinsEarned: roundCurrency(starCoinsEarned + passiveStarCoinsEarnedRef.current),
          planetGemsEarned,
        });
        router.replace("/results");
      } else {
        setTimeLeft((t) => t - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameOver, settings, saveSession, setLastSession, addDrillTickRewards]);

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
            <View
              style={[
                styles.streakBadge,
                { backgroundColor: colors.gold + "22" },
              ]}
            >
              <Text style={[styles.streakText, { color: colors.gold }]}>
                🔥 {streak}
              </Text>
            </View>
          )}
        </View>
        {passiveRateRef.current > 0 && (
          <View style={styles.liveEarnRow}>
            <Text style={[styles.liveEarnText, { color: colors.gold }]}>
              +{formatEarned(passivePointsEarned)} Points
            </Text>
            <Text style={[styles.liveEarnText, { color: "#00B4D8" }]}>
              +{formatEarned(passiveStarCoinsEarned)} Star Coins
            </Text>
          </View>
        )}
      </View>

      <View style={styles.questionArea}>
        <Image
          source={OIL_RIG_FRAMES[animationFrame]}
          style={styles.drillAnimation}
          resizeMode="contain"
        />
        <Text style={[styles.questionText, { color: colors.foreground }]}>
          {question.display}
        </Text>
        <Text style={[styles.equalsText, { color: colors.mutedForeground }]}>
          = ?
        </Text>
      </View>

      <Animated.View style={[styles.inputShakeLayer, { transform: [{ translateX: shakeAnim }] }]}>
        <Animated.View
          style={[
            styles.inputBox,
            {
              backgroundColor: inputBg,
              borderColor: inputBorderColor,
            },
          ]}
        >
          <Text
            style={[
              styles.inputText,
              { color: input ? colors.foreground : colors.mutedForeground },
            ]}
          >
            {input || "—"}
          </Text>
        </Animated.View>
      </Animated.View>

      <View style={[styles.padArea, { paddingBottom: bottomPad + 12 }]}>
        <NumberPad
          onPress={handleKeyPress}
          disabled={isTransitioning || gameOver}
        />
      </View>

      <TouchableOpacity
        style={[styles.quitBtn, { top: topPad + 8 }]}
        onPress={() => router.replace("/")}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.quitText, { color: colors.mutedForeground }]}>
          Quit
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.settingsBtn, { top: topPad + 8, backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push("/settings" as any)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="settings" size={22} color={colors.foreground} />
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
  liveEarnRow: { flexDirection: "row", justifyContent: "center", gap: 14, minHeight: 20 },
  liveEarnText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  timerText: { fontSize: 16, fontFamily: "Inter_500Medium", minWidth: 48 },
  scoreText: { fontSize: 48, fontFamily: "Inter_700Bold" },
  streakBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 56,
    alignItems: "center",
  },
  streakText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  questionArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  drillAnimation: { width: 106, height: 86, marginBottom: 2 },
  questionText: {
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: 0,
  },
  equalsText: { fontSize: 28, fontFamily: "Inter_500Medium" },
  inputBox: {
    borderRadius: 20,
    borderWidth: 2,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    minHeight: 80,
    justifyContent: "center",
  },
  inputShakeLayer: { marginBottom: 16 },
  inputText: {
    fontSize: 44,
    fontFamily: "Inter_700Bold",
    letterSpacing: 4,
  },
  padArea: { paddingTop: 4 },
  quitBtn: { position: "absolute", top: 12, left: 20, padding: 4 },
  settingsBtn: {
    position: "absolute",
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  quitText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
