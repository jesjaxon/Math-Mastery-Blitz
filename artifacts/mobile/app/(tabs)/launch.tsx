import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EARTH_BODY, SOLAR_SYSTEM, SUN_BODY } from "@/constants/planets";
import { useGame } from "@/context/GameContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: W, height: H } = Dimensions.get("window");

const IDLE_ORBIT_R = 160;  // world units from Earth where rocket sits when aiming
const DRAG_SCALE = 0.1;    // world/tick per screen pixel of slingshot drag
const MAX_DRAG = 90;       // max slingshot pull in screen pixels
const AIM_ZOOM = 0.4;      // camera zoom when in aiming mode
const TRAIL_MAX = 80;
const ZOOM_MIN = 0.025;
const ZOOM_MAX = 2.0;
const ZOOM_FACTOR = 1.5;

type Phase = "select" | "aim" | "flying" | "win" | "crash" | "lost";

interface Cam { x: number; y: number; zoom: number; }

// ─── Deterministic star field in world coordinates ────────────────────────────

const STAR_FIELD = Array.from({ length: 90 }, (_, i) => ({
  wx: ((i * 173 + 13) % 97) / 97 * 28000 - 14000,
  wy: ((i * 89 + 7) % 97) / 97 * 28000 - 14000,
  size: i % 8 === 0 ? 3 : i % 4 === 0 ? 2 : 1.5,
  opacity: 0.18 + (i % 7) * 0.08,
}));

// ─── Physics & camera helpers ─────────────────────────────────────────────────

function w2s(wx: number, wy: number, cam: Cam) {
  return { x: (wx - cam.x) * cam.zoom + W / 2, y: (wy - cam.y) * cam.zoom + H / 2 };
}

function calcTrajectory(sx: number, sy: number, vx: number, vy: number) {
  const pts: Array<{ x: number; y: number }> = [];
  let px = sx, py = sy, pvx = vx, pvy = vy;
  for (let i = 0; i < 600; i++) {
    for (const body of SOLAR_SYSTEM) {
      const dx = body.x - px, dy = body.y - py;
      const r2 = dx * dx + dy * dy;
      const r = Math.sqrt(r2);
      if (r > body.soi || r < 2) continue;
      const a = body.mu / r2;
      pvx += (dx / r) * a;
      pvy += (dy / r) * a;
    }
    px += pvx;
    py += pvy;
    const sdx = px - SUN_BODY.x, sdy = py - SUN_BODY.y;
    if (sdx * sdx + sdy * sdy < SUN_BODY.radius * SUN_BODY.radius) break;
    if (Math.abs(px) > 16000 || Math.abs(py) > 16000) break;
    if (i > 20) {
      const edx = px - EARTH_BODY.x, edy = py - EARTH_BODY.y;
      if (edx * edx + edy * edy < EARTH_BODY.captureRadius * EARTH_BODY.captureRadius) {
        pts.push({ x: px, y: py });
        break;
      }
    }
    if (i % 6 === 0) pts.push({ x: px, y: py });
  }
  return pts;
}

// ─── Rubber-band line helper ──────────────────────────────────────────────────

function LineView({
  x1, y1, x2, y2, color, thickness = 2.5, opacity = 1,
}: {
  x1: number; y1: number; x2: number; y2: number;
  color: string; thickness?: number; opacity?: number;
}) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return null;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: (x1 + x2) / 2 - len / 2,
        top: (y1 + y2) / 2 - thickness / 2,
        width: len,
        height: thickness,
        backgroundColor: color,
        borderRadius: thickness / 2,
        opacity,
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function LaunchScreen() {
  const insets = useSafeAreaInsets();
  const { completeLaunch, addPlanetGem, spendStarCoins, gameData, settings } = useGame();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // ── State ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("select");
  const [cam, setCam] = useState<Cam>({ x: EARTH_BODY.x, y: EARTH_BODY.y, zoom: 1.2 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slingshotDrag, setSlingshotDrag] = useState<{ dx: number; dy: number } | null>(null);
  const [minedPlanets, setMinedPlanets] = useState<string[]>([]);
  const [renderTick, setRenderTick] = useState(0);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const phaseRef = useRef<Phase>("select");
  const rocketRef = useRef({ x: EARTH_BODY.x + IDLE_ORBIT_R, y: EARTH_BODY.y, vx: 0, vy: 0 });
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);
  const visitedRef = useRef(new Set<string>());
  const camRef = useRef<Cam>({ x: EARTH_BODY.x, y: EARTH_BODY.y, zoom: 1.2 });
  const slingshotDragRef = useRef<{ dx: number; dy: number } | null>(null);
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const panRef = useRef({ lastX: 0, lastY: 0, totalDist: 0 });

  useEffect(() => { camRef.current = cam; }, [cam]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedPlanet = useMemo(
    () => SOLAR_SYSTEM.find((b) => b.id === selectedId) ?? null,
    [selectedId]
  );
  const canAfford = selectedPlanet
    ? settings.devUnlimitedMoney || gameData.starCoins >= selectedPlanet.launchCost
    : false;

  const trajectoryPoints = useMemo(() => {
    if (!slingshotDrag) return [];
    const mag = Math.sqrt(slingshotDrag.dx ** 2 + slingshotDrag.dy ** 2);
    if (mag < 5) return [];
    return calcTrajectory(
      EARTH_BODY.x + IDLE_ORBIT_R, EARTH_BODY.y,
      -slingshotDrag.dx * DRAG_SCALE,
      -slingshotDrag.dy * DRAG_SCALE
    );
  }, [slingshotDrag]);

  // ── Game actions ───────────────────────────────────────────────────────────

  const endGame = useCallback(
    (result: "win" | "crash" | "lost") => {
      if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null; }
      phaseRef.current = result;
      setPhase(result);
      if (result === "win") {
        completeLaunch();
        visitedRef.current.forEach((id) => addPlanetGem(id));
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    },
    [completeLaunch, addPlanetGem]
  );
  const endGameRef = useRef(endGame);
  useEffect(() => { endGameRef.current = endGame; }, [endGame]);

  const doLaunch = useCallback((vx: number, vy: number) => {
    rocketRef.current = { x: EARTH_BODY.x + IDLE_ORBIT_R, y: EARTH_BODY.y, vx, vy };
    trailRef.current = [];
    visitedRef.current = new Set<string>();
    phaseRef.current = "flying";
    setPhase("flying");
    setMinedPlanets([]);
    const startZoom = Math.min(0.6, camRef.current.zoom);
    const next: Cam = { x: rocketRef.current.x, y: rocketRef.current.y, zoom: startZoom };
    setCam(next);
    camRef.current = next;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }, []);
  const doLaunchRef = useRef(doLaunch);
  useEffect(() => { doLaunchRef.current = doLaunch; }, [doLaunch]);

  const boostTowardEarth = useCallback(() => {
    const r = rocketRef.current;
    const dx = EARTH_BODY.x - r.x, dy = EARTH_BODY.y - r.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) { r.vx += (dx / dist) * 22; r.vy += (dy / dist) * 22; }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }, []);

  const adjustZoom = useCallback((zoomIn: boolean) => {
    setCam((prev) => {
      const next = { ...prev, zoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev.zoom * (zoomIn ? ZOOM_FACTOR : 1 / ZOOM_FACTOR))) };
      camRef.current = next;
      return next;
    });
  }, []);

  const handleTap = useCallback((sx: number, sy: number) => {
    const c = camRef.current;
    for (const body of SOLAR_SYSTEM) {
      if (body.isEarth || body.isSun) continue;
      const bs = w2s(body.x, body.y, c);
      const dist = Math.sqrt((sx - bs.x) ** 2 + (sy - bs.y) ** 2);
      if (dist < Math.max(body.captureRadius * c.zoom, 28)) {
        setSelectedId((prev) => (prev === body.id ? null : body.id));
        return;
      }
    }
    setSelectedId(null);
  }, []);
  const handleTapRef = useRef(handleTap);
  useEffect(() => { handleTapRef.current = handleTap; }, [handleTap]);

  const startMission = useCallback(() => {
    if (!selectedId) return;
    const planet = SOLAR_SYSTEM.find((b) => b.id === selectedId);
    if (!planet) return;
    if (!spendStarCoins(planet.launchCost)) return;
    phaseRef.current = "aim";
    setPhase("aim");
    const next: Cam = { x: EARTH_BODY.x, y: EARTH_BODY.y, zoom: AIM_ZOOM };
    setCam(next);
    camRef.current = next;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [selectedId, spendStarCoins]);

  const resetGame = useCallback(() => {
    if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null; }
    rocketRef.current = { x: EARTH_BODY.x + IDLE_ORBIT_R, y: EARTH_BODY.y, vx: 0, vy: 0 };
    trailRef.current = [];
    visitedRef.current = new Set<string>();
    phaseRef.current = "select";
    setPhase("select");
    setMinedPlanets([]);
    setSlingshotDrag(null);
    slingshotDragRef.current = null;
    setSelectedId(null);
    const next: Cam = { x: EARTH_BODY.x, y: EARTH_BODY.y, zoom: 1.2 };
    setCam(next);
    camRef.current = next;
  }, []);

  // ── PanResponder (handlersRef pattern for fresh closures) ─────────────────
  const handlersRef = useRef<{
    onGrant: (e: GestureResponderEvent, gs: PanResponderGestureState) => void;
    onMove: (e: GestureResponderEvent, gs: PanResponderGestureState) => void;
    onRelease: (e: GestureResponderEvent, gs: PanResponderGestureState) => void;
  }>({ onGrant: () => {}, onMove: () => {}, onRelease: () => {} });

  // Updated every render so handlers always have fresh state/callbacks
  handlersRef.current.onGrant = (evt, _gs) => {
    panRef.current.lastX = evt.nativeEvent.pageX;
    panRef.current.lastY = evt.nativeEvent.pageY;
    panRef.current.totalDist = 0;
  };
  handlersRef.current.onMove = (evt, gs) => {
    if (phaseRef.current === "aim") {
      const mag = Math.sqrt(gs.dx * gs.dx + gs.dy * gs.dy);
      const clamped = mag > MAX_DRAG
        ? { dx: (gs.dx / mag) * MAX_DRAG, dy: (gs.dy / mag) * MAX_DRAG }
        : { dx: gs.dx, dy: gs.dy };
      slingshotDragRef.current = clamped;
      setSlingshotDrag({ ...clamped });
    } else if (phaseRef.current === "select") {
      const tx = evt.nativeEvent.pageX, ty = evt.nativeEvent.pageY;
      const ddx = tx - panRef.current.lastX, ddy = ty - panRef.current.lastY;
      panRef.current.lastX = tx;
      panRef.current.lastY = ty;
      panRef.current.totalDist += Math.sqrt(ddx * ddx + ddy * ddy);
      const z = camRef.current.zoom;
      setCam((prev) => {
        const next = { ...prev, x: prev.x - ddx / z, y: prev.y - ddy / z };
        camRef.current = next;
        return next;
      });
    }
  };
  handlersRef.current.onRelease = (_evt, gs) => {
    if (phaseRef.current === "aim") {
      const drag = slingshotDragRef.current;
      if (drag && Math.sqrt(drag.dx * drag.dx + drag.dy * drag.dy) > 10) {
        doLaunchRef.current(-drag.dx * DRAG_SCALE, -drag.dy * DRAG_SCALE);
      }
      slingshotDragRef.current = null;
      setSlingshotDrag(null);
    } else if (panRef.current.totalDist < 8 && phaseRef.current === "select") {
      handleTapRef.current(gs.x0, gs.y0);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, gs) => handlersRef.current.onGrant(e, gs),
      onPanResponderMove: (e, gs) => handlersRef.current.onMove(e, gs),
      onPanResponderRelease: (e, gs) => handlersRef.current.onRelease(e, gs),
    })
  ).current;

  // ── Physics game loop ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "flying") return;
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);

    gameLoopRef.current = setInterval(() => {
      const r = rocketRef.current;

      for (const body of SOLAR_SYSTEM) {
        const dx = body.x - r.x, dy = body.y - r.y;
        const r2 = dx * dx + dy * dy, d = Math.sqrt(r2);
        if (d > body.soi || d < 2) continue;
        r.vx += (dx / d) * (body.mu / r2);
        r.vy += (dy / d) * (body.mu / r2);
      }
      r.x += r.vx;
      r.y += r.vy;

      trailRef.current.push({ x: r.x, y: r.y });
      if (trailRef.current.length > TRAIL_MAX) trailRef.current.shift();

      for (const body of SOLAR_SYSTEM) {
        const dx = body.x - r.x, dy = body.y - r.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < body.radius + 5) { endGameRef.current("crash"); return; }
        if (!body.isEarth && !body.isSun && body.gem && !visitedRef.current.has(body.id) && dist < body.captureRadius) {
          visitedRef.current.add(body.id);
          setMinedPlanets((prev) => [...prev, body.id]);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
        if (body.isEarth && visitedRef.current.size > 0 && dist < body.captureRadius) { endGameRef.current("win"); return; }
      }

      if (Math.abs(r.x) > 16000 || Math.abs(r.y) > 16000) { endGameRef.current("lost"); return; }

      setCam((prev) => {
        const next = { ...prev, x: prev.x + (r.x - prev.x) * 0.06, y: prev.y + (r.y - prev.y) * 0.06 };
        camRef.current = next;
        return next;
      });
      setRenderTick((t) => t + 1);
    }, 33);

    return () => { if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null; } };
  }, [phase]);

  // ── Render values ──────────────────────────────────────────────────────────
  const r = rocketRef.current;
  const trail = trailRef.current;
  const rocketScreenPos = phase === "aim" ? w2s(EARTH_BODY.x + IDLE_ORBIT_R, EARTH_BODY.y, cam) : w2s(r.x, r.y, cam);
  const rocketAngle = phase === "flying" ? Math.atan2(r.vy, r.vx) * (180 / Math.PI) + 90 : 0;
  const slingshotPower = slingshotDrag ? Math.round(Math.sqrt(slingshotDrag.dx ** 2 + slingshotDrag.dy ** 2) / MAX_DRAG * 100) : 0;
  const isOver = phase === "win" || phase === "crash" || phase === "lost";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root} {...panResponder.panHandlers}>

      {/* Stars */}
      {STAR_FIELD.map((star, i) => {
        const ss = w2s(star.wx, star.wy, cam);
        if (ss.x < -10 || ss.x > W + 10 || ss.y < -10 || ss.y > H + 10) return null;
        return (
          <View key={`s${i}`} pointerEvents="none" style={{
            position: "absolute", left: ss.x - star.size / 2, top: ss.y - star.size / 2,
            width: star.size, height: star.size, borderRadius: star.size / 2,
            backgroundColor: `rgba(255,255,255,${star.opacity})`,
          }} />
        );
      })}

      {/* Solar system bodies */}
      {SOLAR_SYSTEM.map((body) => {
        const bs = w2s(body.x, body.y, cam);
        const margin = body.radius * cam.zoom + 130;
        if (bs.x < -margin || bs.x > W + margin || bs.y < -margin || bs.y > H + margin) return null;
        const rScr = Math.max(10, body.radius * cam.zoom);
        const isSelected = selectedId === body.id;
        const isMined = minedPlanets.includes(body.id);
        const emojiSize = Math.min(rScr * 1.9, 52);
        const showLabel = cam.zoom > 0.1 && !body.isSun;
        return (
          <View key={body.id} pointerEvents="none">
            <View style={{
              position: "absolute",
              left: bs.x - rScr * 2.2, top: bs.y - rScr * 2.2,
              width: rScr * 4.4, height: rScr * 4.4, borderRadius: rScr * 2.2,
              backgroundColor: isSelected ? body.color + "22" : body.color + "0A",
              borderWidth: isSelected ? 1.5 : 0, borderColor: body.color + "90",
            }} />
            <View style={{
              position: "absolute",
              left: bs.x - rScr, top: bs.y - rScr,
              width: rScr * 2, height: rScr * 2, borderRadius: rScr,
              alignItems: "center", justifyContent: "center",
              borderWidth: isMined ? 2 : 0, borderColor: "#00D9A3",
            }}>
              <Text style={{ fontSize: emojiSize, lineHeight: emojiSize + 4 }}>{body.emoji}</Text>
            </View>
            {showLabel && (
              <View style={{ position: "absolute", left: bs.x - 55, top: bs.y + rScr + 3, width: 110, alignItems: "center" }}>
                <Text style={{ color: isSelected ? "#fff" : body.color, fontSize: 10, fontFamily: "Inter_600SemiBold", textAlign: "center" }}>
                  {body.name}{body.gem ? `  ${body.gem}` : ""}
                </Text>
                {isMined && <Text style={{ color: "#00D9A3", fontSize: 9, fontFamily: "Inter_400Regular" }}>✓ Mined</Text>}
              </View>
            )}
          </View>
        );
      })}

      {/* Orbit ring dots (aim mode) */}
      {phase === "aim" && Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const os = w2s(EARTH_BODY.x + IDLE_ORBIT_R * Math.cos(a), EARTH_BODY.y + IDLE_ORBIT_R * Math.sin(a), cam);
        return (
          <View key={`od${i}`} pointerEvents="none" style={{
            position: "absolute", left: os.x - 2, top: os.y - 2, width: 4, height: 4, borderRadius: 2,
            backgroundColor: i % 2 === 0 ? "rgba(100,150,255,0.5)" : "rgba(100,150,255,0.2)",
          }} />
        );
      })}

      {/* Trajectory preview */}
      {trajectoryPoints.map((pt, i) => {
        const ts = w2s(pt.x, pt.y, cam);
        return (
          <View key={`tp${i}`} pointerEvents="none" style={{
            position: "absolute", left: ts.x - 3, top: ts.y - 3, width: 6, height: 6, borderRadius: 3,
            backgroundColor: `rgba(80,200,255,${0.1 + (i / trajectoryPoints.length) * 0.6})`,
          }} />
        );
      })}

      {/* Trail */}
      {trail.map((pt, i) => {
        const ts = w2s(pt.x, pt.y, cam);
        return (
          <View key={`tr${i}`} pointerEvents="none" style={{
            position: "absolute", left: ts.x - 2.5, top: ts.y - 2.5, width: 5, height: 5, borderRadius: 2.5,
            backgroundColor: `rgba(80,190,255,${(i / trail.length) * 0.55})`,
          }} />
        );
      })}

      {/* Slingshot rubber band + arrow */}
      {phase === "aim" && slingshotDrag && (() => {
        const rx = rocketScreenPos.x, ry = rocketScreenPos.y;
        const mag = Math.sqrt(slingshotDrag.dx ** 2 + slingshotDrag.dy ** 2);
        const nx = mag > 0 ? slingshotDrag.dx / mag : 0, ny = mag > 0 ? slingshotDrag.dy / mag : 0;
        return (
          <>
            <LineView x1={rx} y1={ry} x2={rx + slingshotDrag.dx} y2={ry + slingshotDrag.dy} color="#FF9F43" thickness={3} opacity={0.9} />
            <LineView x1={rx} y1={ry} x2={rx - nx * mag * 0.65} y2={ry - ny * mag * 0.65} color="#7C6FFF" thickness={2.5} opacity={0.85} />
            <View pointerEvents="none" style={{
              position: "absolute", left: rx + slingshotDrag.dx - 9, top: ry + slingshotDrag.dy - 9,
              width: 18, height: 18, borderRadius: 9, backgroundColor: "#FF9F43", opacity: 0.9,
            }} />
          </>
        );
      })()}

      {/* Rocket */}
      {phase !== "select" && (
        <View pointerEvents="none" style={{
          position: "absolute", left: rocketScreenPos.x - 14, top: rocketScreenPos.y - 14,
          width: 28, height: 28, alignItems: "center", justifyContent: "center",
          transform: [{ rotate: `${rocketAngle}deg` }], zIndex: 5,
        }}>
          <Text style={{ fontSize: 22 }}>🚀</Text>
        </View>
      )}

      {/* HUD: top bar */}
      <View style={[styles.hudTop, { paddingTop: topPad + 6 }]} pointerEvents="box-none">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.coinBalance}>🪙 {gameData.starCoins.toLocaleString()}</Text>
      </View>

      {/* Zoom buttons */}
      {(phase === "select" || phase === "flying") && (
        <View style={[styles.zoomBtns, { top: topPad + 56 }]} pointerEvents="box-none">
          <TouchableOpacity style={styles.zoomBtn} onPress={() => adjustZoom(true)}>
            <Text style={styles.zoomBtnText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomBtn} onPress={() => adjustZoom(false)}>
            <Text style={styles.zoomBtnText}>−</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Select: planet info card */}
      {phase === "select" && (
        <View style={[styles.bottomCard, { paddingBottom: bottomPad + 16 }]} pointerEvents="box-none">
          {selectedPlanet ? (
            <>
              <View style={styles.planetRow}>
                <Text style={styles.planetEmojiLg}>{selectedPlanet.emoji}</Text>
                <View style={styles.planetInfo}>
                  <Text style={styles.planetNameText}>{selectedPlanet.name}</Text>
                  {selectedPlanet.gem && (
                    <Text style={styles.planetGemText}>{selectedPlanet.gem} {selectedPlanet.gemName}</Text>
                  )}
                  <Text style={styles.planetSubText}>
                    🪙 {selectedPlanet.launchCost.toLocaleString()}  ·  ⏱ {selectedPlanet.travelHint}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.launchMissionBtn, !canAfford && styles.launchMissionBtnOff]}
                onPress={startMission}
                activeOpacity={0.8}
                disabled={!canAfford}
              >
                <Text style={[styles.launchMissionText, !canAfford && { color: "#555" }]}>
                  {canAfford
                    ? `🚀 Launch Mission  ·  🪙 ${selectedPlanet.launchCost.toLocaleString()}`
                    : `Need 🪙 ${selectedPlanet.launchCost.toLocaleString()} (have ${gameData.starCoins.toLocaleString()})`}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.selectHint}>🔭  Zoom out with − to see all planets  ·  Tap one to select</Text>
          )}
        </View>
      )}

      {/* Aim: slingshot instructions */}
      {phase === "aim" && !isOver && (
        <View style={[styles.aimCard, { paddingBottom: bottomPad + 14 }]} pointerEvents="box-none">
          <Text style={styles.aimTitle}>
            {slingshotDrag
              ? `⚡ Power ${slingshotPower}%  ·  Release to launch!`
              : "Drag anywhere to aim your slingshot · Release to fire 🚀"}
          </Text>
          {selectedPlanet && (
            <Text style={styles.aimTarget}>Target: {selectedPlanet.emoji} {selectedPlanet.name}  ·  {selectedPlanet.travelHint}</Text>
          )}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => { phaseRef.current = "select"; setPhase("select"); setSlingshotDrag(null); slingshotDragRef.current = null; }}
          >
            <Text style={styles.cancelBtnText}>✕ Cancel Mission</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Flying: mined gems + return boost */}
      {phase === "flying" && (
        <View style={[styles.flyingBar, { paddingBottom: bottomPad + 14 }]} pointerEvents="box-none">
          {minedPlanets.length > 0 ? (
            <>
              <Text style={styles.minedText}>
                Mined: {minedPlanets.map((id) => SOLAR_SYSTEM.find((b) => b.id === id)?.gem ?? "").join("  ")}
              </Text>
              <TouchableOpacity style={styles.returnBtn} onPress={boostTowardEarth} activeOpacity={0.8}>
                <Text style={styles.returnBtnText}>🌍 Return Home Boost</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.flyingHint}>Fly to a planet to mine gems · Return to Earth to win!</Text>
          )}
        </View>
      )}

      {/* End-game overlay */}
      {isOver && (
        <View style={[styles.resultOverlay, { paddingBottom: bottomPad + 16 }]} pointerEvents="box-none">
          <Text style={{ fontSize: 52 }}>{phase === "win" ? "🎉" : phase === "crash" ? "💥" : "🌌"}</Text>
          <Text style={[styles.resultTitle, { color: phase === "win" ? "#00D9A3" : "#FF4757" }]}>
            {phase === "win" ? "Mission Complete!" : phase === "crash" ? "Crashed!" : "Lost in Space!"}
          </Text>
          {phase === "win" && minedPlanets.length > 0 && (
            <View style={styles.gemsBox}>
              <Text style={styles.gemsTitle}>Gems collected:</Text>
              <Text style={{ fontSize: 28, letterSpacing: 4, marginVertical: 4 }}>
                {minedPlanets.map((id) => SOLAR_SYSTEM.find((b) => b.id === id)?.gem ?? "").join("  ")}
              </Text>
              <Text style={styles.gemNames}>
                {minedPlanets.map((id) => SOLAR_SYSTEM.find((b) => b.id === id)?.gemName ?? "").join(" · ")}
              </Text>
            </View>
          )}
          {phase !== "win" && (
            <Text style={styles.resultBody}>
              {phase === "crash" ? "Your rocket collided with a celestial body." : "Your rocket drifted beyond the solar system."}
            </Text>
          )}
          <TouchableOpacity style={[styles.resultBtn, { backgroundColor: "#7C6FFF" }]} onPress={resetGame}>
            <Text style={styles.resultBtnText}>🔄 Fly Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resultBtn, { borderWidth: 1, borderColor: "#444" }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.resultBtnText, { color: "#888" }]}>🏠 Return to Base</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#02020E" },
  hudTop: {
    position: "absolute", top: 0, left: 16, right: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 20,
  },
  backBtn: { paddingHorizontal: 6, paddingVertical: 6 },
  backBtnText: { color: "#aaa", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  coinBalance: { color: "#FFD166", fontSize: 14, fontFamily: "Inter_700Bold" },
  zoomBtns: { position: "absolute", right: 14, gap: 6, zIndex: 20 },
  zoomBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  zoomBtnText: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 26 },
  bottomCard: {
    position: "absolute", bottom: 0, left: 14, right: 14,
    backgroundColor: "rgba(8,8,24,0.94)", borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(100,120,255,0.22)",
    padding: 16, gap: 10, zIndex: 20,
  },
  planetRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  planetEmojiLg: { fontSize: 40 },
  planetInfo: { flex: 1, gap: 2 },
  planetNameText: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  planetGemText: { color: "#FFD166", fontSize: 13, fontFamily: "Inter_400Regular" },
  planetSubText: { color: "#777", fontSize: 12, fontFamily: "Inter_400Regular" },
  launchMissionBtn: { backgroundColor: "#7C6FFF", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  launchMissionBtnOff: { backgroundColor: "rgba(60,60,80,0.6)" },
  launchMissionText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  selectHint: { color: "#555", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 10 },
  aimCard: {
    position: "absolute", bottom: 0, left: 14, right: 14,
    backgroundColor: "rgba(8,8,24,0.94)", borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(124,111,255,0.4)",
    padding: 16, gap: 8, zIndex: 20, alignItems: "center",
  },
  aimTitle: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  aimTarget: { color: "#FFD166", fontSize: 12, fontFamily: "Inter_400Regular" },
  cancelBtn: { backgroundColor: "rgba(255,255,255,0.09)", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 22 },
  cancelBtnText: { color: "#999", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  flyingBar: { position: "absolute", bottom: 0, left: 14, right: 14, gap: 8, zIndex: 20, alignItems: "center" },
  flyingHint: { color: "#444", fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  minedText: { color: "#00D9A3", fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  returnBtn: { backgroundColor: "#1B4A2A", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, borderWidth: 1, borderColor: "#1B6B3A" },
  returnBtnText: { color: "#00D9A3", fontSize: 15, fontFamily: "Inter_700Bold" },
  resultOverlay: {
    position: "absolute", bottom: 0, left: 18, right: 18,
    backgroundColor: "rgba(5,5,18,0.97)", borderRadius: 22,
    borderWidth: 1.5, borderColor: "rgba(100,120,255,0.3)",
    padding: 22, gap: 10, zIndex: 30, alignItems: "center",
  },
  resultTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  resultBody: { color: "#777", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  gemsBox: { alignItems: "center", gap: 2 },
  gemsTitle: { color: "#888", fontSize: 12, fontFamily: "Inter_400Regular" },
  gemNames: { color: "#FFD166", fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  resultBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, width: "100%", alignItems: "center" },
  resultBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
