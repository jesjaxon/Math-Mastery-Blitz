import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGame } from "@/context/GameContext";

const { width: W, height: H } = Dimensions.get("window");

const EARTH_R = 52;
const EARTH_MU = 320;
const MOON_R = 30;
const MOON_MU = 65;
const THRUST_POWER = 0.4;

type Phase = "idle" | "flying" | "moon_reached" | "returning" | "win" | "crash" | "lost";

// Deterministic star field
const STARS = Array.from({ length: 45 }, (_, i) => ({
  x: ((i * 137.508 * 3.7) % 1) * W,
  y: ((i * 97.341 * 2.3) % 1) * H,
  s: i % 7 === 0 ? 3 : i % 4 === 0 ? 2 : 1.5,
  o: 0.3 + ((i * 73) % 47) / 100,
}));

export default function LaunchScreen() {
  const insets = useSafeAreaInsets();
  const { completeLaunch, gameData } = useGame();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const earthPos = useMemo(() => ({ x: W * 0.22, y: H * 0.70 }), []);
  const moonPos = useMemo(() => ({ x: W * 0.78, y: H * 0.24 }), []);

  const rocketRef = useRef({ x: earthPos.x + 65, y: earthPos.y, vx: 1.0, vy: -2.5 });
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);
  const phaseRef = useRef<Phase>("idle");
  const visitedMoonRef = useRef(false);
  const boostCountRef = useRef(0);
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [rocketPos, setRocketPos] = useState({ x: earthPos.x + 65, y: earthPos.y, angle: -30 });
  const [trail, setTrail] = useState<Array<{ x: number; y: number }>>([]);
  const [boostCount, setBoostCount] = useState(0);
  const [visitedMoon, setVisitedMoon] = useState(false);
  const [launchWasComplete] = useState(gameData.launchComplete);

  const resetGame = useCallback(() => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    rocketRef.current = { x: earthPos.x + 65, y: earthPos.y, vx: 1.0, vy: -2.5 };
    trailRef.current = [];
    phaseRef.current = "idle";
    visitedMoonRef.current = false;
    boostCountRef.current = 0;
    setPhase("idle");
    setRocketPos({ x: earthPos.x + 65, y: earthPos.y, angle: -30 });
    setTrail([]);
    setBoostCount(0);
    setVisitedMoon(false);
  }, [earthPos]);

  const handleBoost = useCallback(() => {
    const p = phaseRef.current;
    if (p !== "flying" && p !== "returning" && p !== "moon_reached") return;
    const r = rocketRef.current;
    const speed = Math.sqrt(r.vx * r.vx + r.vy * r.vy);
    if (speed > 0.01) {
      r.vx += (r.vx / speed) * THRUST_POWER;
      r.vy += (r.vy / speed) * THRUST_POWER;
    }
    boostCountRef.current += 1;
    setBoostCount((c) => c + 1);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
  }, []);

  // Start / run the game loop
  useEffect(() => {
    if (phase !== "flying" && phase !== "moon_reached" && phase !== "returning") {
      return;
    }

    if (gameLoopRef.current) clearInterval(gameLoopRef.current);

    gameLoopRef.current = setInterval(() => {
      const r = rocketRef.current;
      const trail = trailRef.current;

      // Earth gravity
      const ex = earthPos.x - r.x;
      const ey = earthPos.y - r.y;
      const er = Math.sqrt(ex * ex + ey * ey);
      const eAccel = EARTH_MU / (er * er);
      r.vx += (ex / er) * eAccel;
      r.vy += (ey / er) * eAccel;

      // Moon gravity
      const mx = moonPos.x - r.x;
      const my = moonPos.y - r.y;
      const mr = Math.sqrt(mx * mx + my * my);
      const mAccel = MOON_MU / (mr * mr);
      r.vx += (mx / mr) * mAccel;
      r.vy += (my / mr) * mAccel;

      // Position update
      r.x += r.vx;
      r.y += r.vy;

      // Trail
      trail.push({ x: r.x, y: r.y });
      if (trail.length > 55) trail.shift();

      // Phase transitions
      let next = phaseRef.current;

      if (er < EARTH_R - 4) {
        next = "crash";
      } else if (mr < MOON_R - 4) {
        next = "crash";
      } else if (!visitedMoonRef.current && mr < MOON_R + 85) {
        visitedMoonRef.current = true;
        next = "moon_reached";
        setVisitedMoon(true);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
      } else if (visitedMoonRef.current && phaseRef.current === "moon_reached" && mr > MOON_R + 60) {
        next = "returning";
      } else if (visitedMoonRef.current && er < EARTH_R + 105) {
        next = "win";
      } else if (r.x < -250 || r.x > W + 250 || r.y < -250 || r.y > H + 250) {
        next = "lost";
      }

      if (next !== phaseRef.current) {
        phaseRef.current = next;
        setPhase(next);
        if (next === "win") {
          completeLaunch();
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          }
        } else if (next === "crash" || next === "lost") {
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          }
        }
      }

      const angle = Math.atan2(r.vy, r.vx) * (180 / Math.PI) + 90;
      setRocketPos({ x: r.x, y: r.y, angle });
      setTrail([...trail]);
    }, 33);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [phase, earthPos, moonPos, completeLaunch]);

  const isFlying = phase === "flying" || phase === "moon_reached" || phase === "returning";
  const isOver = phase === "win" || phase === "crash" || phase === "lost";

  const phaseLabel: Record<Phase, { emoji: string; text: string; color: string }> = {
    idle:          { emoji: "🌍", text: "Ready for launch", color: "#00B4D8" },
    flying:        { emoji: "🚀", text: "Escape Earth's orbit — BOOST!", color: "#7C6FFF" },
    moon_reached:  { emoji: "🌕", text: "Moon flyby! Return to Earth!", color: "#FFD166" },
    returning:     { emoji: "🔄", text: "Returning to Earth orbit...", color: "#00D9A3" },
    win:           { emoji: "🎉", text: "Mission Complete!",  color: "#00D9A3" },
    crash:         { emoji: "💥", text: "Crashed!",           color: "#FF4757" },
    lost:          { emoji: "🌌", text: "Lost in space!",     color: "#FF9F43" },
  };
  const info = phaseLabel[phase];

  return (
    <View style={styles.root}>
      {/* Stars */}
      {STARS.map((s, i) => (
        <View key={i} style={{
          position: "absolute",
          left: s.x,
          top: s.y,
          width: s.s,
          height: s.s,
          borderRadius: s.s,
          backgroundColor: `rgba(255,255,255,${s.o})`,
        }} />
      ))}

      {/* Trail */}
      {trail.map((p, i) => (
        <View key={i} style={{
          position: "absolute",
          left: p.x - 2.5,
          top: p.y - 2.5,
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: `rgba(80,190,255,${(i / trail.length) * 0.65})`,
        }} />
      ))}

      {/* Moon glow when visited */}
      {visitedMoon && (
        <View style={{
          position: "absolute",
          left: moonPos.x - MOON_R - 20,
          top: moonPos.y - MOON_R - 20,
          width: (MOON_R + 20) * 2,
          height: (MOON_R + 20) * 2,
          borderRadius: (MOON_R + 20),
          backgroundColor: "rgba(255,215,102,0.12)",
        }} />
      )}

      {/* Earth */}
      <View style={[styles.body, {
        left: earthPos.x - EARTH_R,
        top: earthPos.y - EARTH_R,
        width: EARTH_R * 2,
        height: EARTH_R * 2,
        borderRadius: EARTH_R,
        backgroundColor: "#0E2A52",
        borderColor: "#1B6B3A",
        borderWidth: 5,
      }]}>
        <Text style={{ fontSize: 42 }}>🌍</Text>
      </View>

      {/* Moon */}
      <View style={[styles.body, {
        left: moonPos.x - MOON_R,
        top: moonPos.y - MOON_R,
        width: MOON_R * 2,
        height: MOON_R * 2,
        borderRadius: MOON_R,
        backgroundColor: "#2A2A2A",
        borderColor: visitedMoon ? "#FFD166" : "#555",
        borderWidth: visitedMoon ? 3 : 2,
      }]}>
        <Text style={{ fontSize: 26 }}>🌕</Text>
      </View>

      {/* Labels */}
      <Text style={[styles.bodyLabel, { left: earthPos.x - 24, top: earthPos.y + EARTH_R + 6, color: "#2E7D32" }]}>
        Earth
      </Text>
      <Text style={[styles.bodyLabel, { left: moonPos.x - 18, top: moonPos.y + MOON_R + 4, color: visitedMoon ? "#FFD166" : "#888" }]}>
        Moon
      </Text>

      {/* Rocket */}
      {phase !== "idle" && (
        <View style={{
          position: "absolute",
          left: rocketPos.x - 14,
          top: rocketPos.y - 14,
          width: 28,
          height: 28,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ rotate: `${rocketPos.angle}deg` }],
          zIndex: 10,
        }}>
          <Text style={{ fontSize: 22 }}>🚀</Text>
        </View>
      )}

      {/* HUD: top */}
      <View style={[styles.hudTop, { paddingTop: topPad + 6 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={[styles.phasePill, { backgroundColor: info.color + "22", borderColor: info.color }]}>
          <Text style={[styles.phaseText, { color: info.color }]}>
            {info.emoji} {info.text}
          </Text>
        </View>
      </View>

      {/* Boost indicator */}
      {isFlying && (
        <View style={[styles.boostIndicator, { top: topPad + 60 }]}>
          <Text style={styles.boostIndicatorText}>⚡ {boostCount} boosts</Text>
        </View>
      )}

      {/* Idle instructions */}
      {phase === "idle" && (
        <View style={[styles.instructionsBox, { bottom: bottomPad + 150 }]}>
          <Text style={styles.instrTitle}>Gravity Slingshot</Text>
          <Text style={styles.instrBody}>
            {"Tap BOOST to fire your thrusters.\nEscape Earth's gravity → fly past the\nMoon → let it slingshot you back!"}
          </Text>
          <Text style={styles.instrHint}>Tip: Boost early and often to escape.</Text>
        </View>
      )}

      {/* Win overlay */}
      {phase === "win" && (
        <View style={[styles.resultBox, { bottom: bottomPad + 120, borderColor: "#00D9A3" }]}>
          <Text style={{ fontSize: 48 }}>🎉</Text>
          <Text style={[styles.resultTitle, { color: "#00D9A3" }]}>Mission Complete!</Text>
          <Text style={styles.resultBody}>
            You used gravity to slingshot around the Moon and returned safely to Earth.
            {!launchWasComplete ? "\n\n🏆 Astronaut achievement unlocked!" : ""}
          </Text>
          <TouchableOpacity
            style={[styles.resultBtn, { backgroundColor: "#00D9A3" }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.resultBtnText, { color: "#000" }]}>🏠 Return to Base</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resultBtn, { backgroundColor: "transparent", borderWidth: 1, borderColor: "#00D9A3" }]}
            onPress={resetGame}
          >
            <Text style={[styles.resultBtnText, { color: "#00D9A3" }]}>🔄 Fly Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Crash / Lost overlay */}
      {(phase === "crash" || phase === "lost") && (
        <View style={[styles.resultBox, { bottom: bottomPad + 120, borderColor: "#FF4757" }]}>
          <Text style={{ fontSize: 48 }}>{phase === "crash" ? "💥" : "🌌"}</Text>
          <Text style={[styles.resultTitle, { color: "#FF4757" }]}>
            {phase === "crash" ? "Crashed!" : "Lost in Space!"}
          </Text>
          <Text style={styles.resultBody}>
            {phase === "crash"
              ? "Your rocket collided with a celestial body."
              : "Your rocket drifted too far from the solar system."}
          </Text>
          <TouchableOpacity
            style={[styles.resultBtn, { backgroundColor: "#7C6FFF" }]}
            onPress={resetGame}
          >
            <Text style={[styles.resultBtnText, { color: "#fff" }]}>🔄 Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* HUD: bottom controls */}
      <View style={[styles.hudBottom, { paddingBottom: bottomPad + 16 }]}>
        {phase === "idle" && (
          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: "#7C6FFF" }]}
            onPress={() => { phaseRef.current = "flying"; setPhase("flying"); }}
            activeOpacity={0.85}
          >
            <Text style={styles.mainBtnText}>🚀  LAUNCH</Text>
          </TouchableOpacity>
        )}
        {isFlying && (
          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: "#FF9F43" }]}
            onPress={handleBoost}
            activeOpacity={0.72}
          >
            <Text style={styles.mainBtnText}>⚡  BOOST</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#02020E" },
  body: { position: "absolute", alignItems: "center", justifyContent: "center" },
  bodyLabel: { position: "absolute", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  hudTop: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 20,
  },
  backBtn: { paddingHorizontal: 6, paddingVertical: 6 },
  backBtnText: { color: "#aaa", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  phasePill: { flex: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  phaseText: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  boostIndicator: {
    position: "absolute",
    right: 16,
    zIndex: 20,
    backgroundColor: "rgba(255,159,67,0.2)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  boostIndicatorText: { color: "#FF9F43", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  instructionsBox: {
    position: "absolute",
    left: 24,
    right: 24,
    backgroundColor: "rgba(10,10,30,0.85)",
    borderRadius: 18,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(100,150,255,0.3)",
    alignItems: "center",
  },
  instrTitle: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  instrBody: { color: "#aaa", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  instrHint: { color: "#7C6FFF", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  resultBox: {
    position: "absolute",
    left: 24,
    right: 24,
    backgroundColor: "rgba(5,5,20,0.95)",
    borderRadius: 20,
    padding: 20,
    gap: 10,
    borderWidth: 1.5,
    alignItems: "center",
    zIndex: 30,
  },
  resultTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  resultBody: { color: "#aaa", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  resultBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, width: "100%", alignItems: "center" },
  resultBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  hudBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    zIndex: 20,
    alignItems: "center",
  },
  mainBtn: {
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 60,
    alignItems: "center",
  },
  mainBtnText: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 1 },
});
