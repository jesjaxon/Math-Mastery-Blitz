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
  ScrollView,
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

const IDLE_ORBIT_R = 160;
const DRAG_SCALE  = 0.1;
const MAX_DRAG    = 90;
const TRAIL_MAX   = 60;
const ZOOM_MIN    = 0.025;
const ZOOM_MAX    = 2.0;
const ZOOM_FACTOR = 1.5;
const THRUST_POWER = 0.45;
const TRAJ_INTERVAL = 14;
const MAX_ROCKETS   = 5;

// Orbit-launch constants
const V_ESC = Math.sqrt(2 * EARTH_BODY.mu / IDLE_ORBIT_R); // ~7.9 wu/tick

type ScreenPhase = "select" | "aim" | "flying";
type RocketStatus = "flying" | "win" | "crash" | "lost";
type ThrustDir   = "U" | "D" | "L" | "R";

interface Cam { x: number; y: number; zoom: number; }

interface RocketState {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  trail: Array<{ x: number; y: number }>;
  visited: Set<string>;
  inZone: Set<string>;
  minedIds: string[];
  status: RocketStatus;
  flightTraj: Array<{ x: number; y: number }>;
  tickCount: number;
}

// ─── Star field ───────────────────────────────────────────────────────────────

const STAR_FIELD = Array.from({ length: 90 }, (_, i) => ({
  wx: ((i * 173 + 13) % 97) / 97 * 28000 - 14000,
  wy: ((i * 89 + 7) % 97) / 97 * 28000 - 14000,
  size: i % 8 === 0 ? 3 : i % 4 === 0 ? 2 : 1.5,
  opacity: 0.18 + (i % 7) * 0.08,
}));

const ROCKET_COLORS = ["#7C6FFF", "#FF9F43", "#00D9A3", "#FF6B9D", "#7FD8E8"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function w2s(wx: number, wy: number, cam: Cam) {
  return { x: (wx - cam.x) * cam.zoom + W / 2, y: (wy - cam.y) * cam.zoom + H / 2 };
}

function calcTrajectory(sx: number, sy: number, vx: number, vy: number) {
  const pts: Array<{ x: number; y: number }> = [];
  let px = sx, py = sy, pvx = vx, pvy = vy;
  for (let i = 0; i < 1200; i++) {
    for (const body of SOLAR_SYSTEM) {
      const dx = body.x - px, dy = body.y - py;
      const r2 = dx * dx + dy * dy, r = Math.sqrt(r2);
      if (r > body.soi || r < 2) continue;
      const a = body.mu / r2;
      pvx += (dx / r) * a;
      pvy += (dy / r) * a;
    }
    px += pvx; py += pvy;
    const sdx = px - SUN_BODY.x, sdy = py - SUN_BODY.y;
    if (sdx * sdx + sdy * sdy < SUN_BODY.radius * SUN_BODY.radius) break;
    if (Math.abs(px) > 18000 || Math.abs(py) > 18000) break;
    if (i > 20) {
      const edx = px - EARTH_BODY.x, edy = py - EARTH_BODY.y;
      if (edx * edx + edy * edy < EARTH_BODY.captureRadius * EARTH_BODY.captureRadius) {
        pts.push({ x: px, y: py }); break;
      }
    }
    if (i % 4 === 0) pts.push({ x: px, y: py });
  }
  return pts;
}

function calcNavPath(fromX: number, fromY: number, toX: number, toY: number) {
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const cx = (fromX + toX) / 2 + (SUN_BODY.x - (fromX + toX) / 2) * 0.35;
    const cy = (fromY + toY) / 2 + (SUN_BODY.y - (fromY + toY) / 2) * 0.35;
    pts.push({
      x: (1 - t) * (1 - t) * fromX + 2 * (1 - t) * t * cx + t * t * toX,
      y: (1 - t) * (1 - t) * fromY + 2 * (1 - t) * t * cy + t * t * toY,
    });
  }
  return pts;
}

function getEdgeArrow(targetWx: number, targetWy: number, cam: Cam) {
  const ts = w2s(targetWx, targetWy, cam);
  const cx = W / 2, cy = H * 0.48;
  const dx = ts.x - cx, dy = ts.y - cy;
  const angle = Math.atan2(dy, dx);
  const mH = 36, mV = 90;
  const onScreen = ts.x > mH && ts.x < W - mH && ts.y > mV && ts.y < H - 120;
  if (onScreen) return { sx: ts.x, sy: ts.y, angle, offScreen: false };
  const scaleX = dx !== 0 ? (dx > 0 ? (W - mH - cx) : (cx - mH)) / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? (dy > 0 ? (H - 120 - cy) : (cy - mV)) / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);
  return {
    sx: Math.max(mH, Math.min(W - mH, cx + dx * scale)),
    sy: Math.max(mV, Math.min(H - 120, cy + dy * scale)),
    angle, offScreen: true,
  };
}

/** Compute position + velocity for a transfer-orbit launch toward target planet */
function calcOrbitLaunch(targetX: number, targetY: number): { x: number; y: number; vx: number; vy: number } {
  const ex = EARTH_BODY.x, ey = EARTH_BODY.y;
  const dx = targetX - ex, dy = targetY - ey;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Speed: escape-fraction + distance boost, capped at near-max slingshot
  const speed = Math.min(9.2, V_ESC * 0.72 + dist * 0.00022 + 1.8);

  // Direction: toward target, rotated away from Sun for orbital arc
  const directAngle = Math.atan2(dy, dx);
  // Which side of Earth→Target line is the Sun on?
  const sunSide = dx * (SUN_BODY.y - ey) - dy * (SUN_BODY.x - ex);
  const rotDir = sunSide >= 0 ? -1 : 1;
  const launchAngle = directAngle + rotDir * (Math.PI / 5.5); // ~33° offset

  const vx = Math.cos(launchAngle) * speed;
  const vy = Math.sin(launchAngle) * speed;

  // Start at IDLE_ORBIT_R from Earth, perpendicular to launch direction
  const perpAngle = launchAngle - Math.PI / 2;
  return {
    x: ex + Math.cos(perpAngle) * IDLE_ORBIT_R,
    y: ey + Math.sin(perpAngle) * IDLE_ORBIT_R,
    vx, vy,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LineView({ x1, y1, x2, y2, color, thickness = 2.5, opacity = 1 }: {
  x1: number; y1: number; x2: number; y2: number;
  color: string; thickness?: number; opacity?: number;
}) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return null;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return (
    <View pointerEvents="none" style={{
      position: "absolute",
      left: (x1 + x2) / 2 - len / 2, top: (y1 + y2) / 2 - thickness / 2,
      width: len, height: thickness,
      backgroundColor: color, borderRadius: thickness / 2, opacity,
      transform: [{ rotate: `${angle}deg` }],
    }} />
  );
}

function ThrusterBtn({ label, onIn, onOut }: { label: string; onIn: () => void; onOut: () => void }) {
  return (
    <TouchableOpacity onPressIn={onIn} onPressOut={onOut} activeOpacity={0.6} style={styles.thrusterBtn}>
      <Text style={styles.thrusterBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LaunchScreen() {
  const insets = useSafeAreaInsets();
  const { completeLaunch, addPlanetGem, spendStarCoins, gameData, settings } = useGame();
  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // ── UI state ──────────────────────────────────────────────────────────────
  const [phase, setPhase]         = useState<ScreenPhase>("select");
  const [loopRunning, setLoopRunning] = useState(false);
  const [cam, setCam]             = useState<Cam>({ x: EARTH_BODY.x, y: EARTH_BODY.y, zoom: 1.2 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag]           = useState<{ dx: number; dy: number } | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [renderTick, setRenderTick] = useState(0);
  const [rocketCount, setRocketCount] = useState(0); // for switcher re-renders

  // ── Refs ──────────────────────────────────────────────────────────────────
  const phaseRef      = useRef<ScreenPhase>("select");
  const camRef        = useRef<Cam>({ x: EARTH_BODY.x, y: EARTH_BODY.y, zoom: 1.2 });
  const dragRef       = useRef<{ dx: number; dy: number } | null>(null);
  const activeIdxRef  = useRef(0);
  const rocketsRef    = useRef<RocketState[]>([]);
  const gameLoopRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const thrustersRef  = useRef<Set<ThrustDir>>(new Set());
  const panRef        = useRef({ lastX: 0, lastY: 0, totalDist: 0 });
  const nextIdRef     = useRef(1);

  useEffect(() => { camRef.current = cam; }, [cam]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedPlanet = useMemo(() => SOLAR_SYSTEM.find((b) => b.id === selectedId) ?? null, [selectedId]);
  const canAfford = selectedPlanet
    ? settings.devUnlimitedMoney || gameData.starCoins >= selectedPlanet.launchCost
    : false;

  const aimTraj = useMemo(() => {
    if (!drag) return [];
    const mag = Math.sqrt(drag.dx ** 2 + drag.dy ** 2);
    if (mag < 5) return [];
    return calcTrajectory(
      EARTH_BODY.x + IDLE_ORBIT_R, EARTH_BODY.y,
      -drag.dx * DRAG_SCALE, -drag.dy * DRAG_SCALE
    );
  }, [drag]);

  const slingshotPower = drag ? Math.round(Math.sqrt(drag.dx ** 2 + drag.dy ** 2) / MAX_DRAG * 100) : 0;
  const activeRocket   = rocketsRef.current[activeIdxRef.current] ?? null;
  const navDistWu      = activeRocket && selectedPlanet
    ? Math.round(Math.sqrt((selectedPlanet.x - activeRocket.x) ** 2 + (selectedPlanet.y - activeRocket.y) ** 2))
    : null;
  const flightSpeed    = activeRocket
    ? Math.round(Math.sqrt(activeRocket.vx ** 2 + activeRocket.vy ** 2) * 10) / 10
    : 0;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const makeRocket = useCallback((x: number, y: number, vx: number, vy: number): RocketState => ({
    id: nextIdRef.current++,
    x, y, vx, vy,
    trail: [], visited: new Set(), inZone: new Set(), minedIds: [],
    status: "flying", flightTraj: [], tickCount: 0,
  }), []);

  const stopLoop = useCallback(() => {
    if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null; }
  }, []);

  const startLoop = useCallback(() => {
    stopLoop();
    setLoopRunning(true);
  }, [stopLoop]);

  // ── End game for one rocket ────────────────────────────────────────────────
  const finishRocket = useCallback((idx: number, result: "win" | "crash" | "lost") => {
    const rockets = rocketsRef.current;
    if (idx < 0 || idx >= rockets.length) return;
    const r = rockets[idx];
    if (r.status !== "flying") return;
    r.status = result;
    if (result === "win") {
      completeLaunch();
      r.visited.forEach((id) => addPlanetGem(id));
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
    // If all rockets done, stop loop & return to select
    if (rockets.every((rk) => rk.status !== "flying")) {
      stopLoop();
      setLoopRunning(false);
    }
    setRocketCount((c) => c + 1); // force re-render of switcher
  }, [completeLaunch, addPlanetGem, stopLoop]);

  const finishRocketRef = useRef(finishRocket);
  useEffect(() => { finishRocketRef.current = finishRocket; }, [finishRocket]);

  // ── Launch (slingshot) ─────────────────────────────────────────────────────
  const doLaunch = useCallback((vx: number, vy: number) => {
    const rocket = makeRocket(EARTH_BODY.x + IDLE_ORBIT_R, EARTH_BODY.y, vx, vy);
    rocketsRef.current.push(rocket);
    const newIdx = rocketsRef.current.length - 1;
    activeIdxRef.current = newIdx;
    setActiveIdx(newIdx);
    setRocketCount(rocketsRef.current.length);

    phaseRef.current = "flying";
    setPhase("flying");
    dragRef.current = null;
    setDrag(null);

    const startZoom = Math.min(0.6, camRef.current.zoom);
    const next: Cam = { x: rocket.x, y: rocket.y, zoom: startZoom };
    setCam(next); camRef.current = next;

    // Only start the loop if it isn't already running — the existing interval
    // will pick up the new rocket from rocketsRef automatically on the next tick.
    if (!gameLoopRef.current) startLoop();
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }, [makeRocket, startLoop]);

  const doLaunchRef = useRef(doLaunch);
  useEffect(() => { doLaunchRef.current = doLaunch; }, [doLaunch]);

  // ── Orbit launch ──────────────────────────────────────────────────────────
  const launchOrbit = useCallback(() => {
    if (!selectedPlanet || !canAfford) return;
    if (!spendStarCoins(selectedPlanet.launchCost)) return;
    if (rocketsRef.current.length >= MAX_ROCKETS) return;

    const { x, y, vx, vy } = calcOrbitLaunch(selectedPlanet.x, selectedPlanet.y);
    const rocket = makeRocket(x, y, vx, vy);
    rocketsRef.current.push(rocket);
    const newIdx = rocketsRef.current.length - 1;
    activeIdxRef.current = newIdx;
    setActiveIdx(newIdx);
    setRocketCount(rocketsRef.current.length);

    phaseRef.current = "flying";
    setPhase("flying");

    const startZoom = Math.min(0.55, camRef.current.zoom);
    const next: Cam = { x: rocket.x, y: rocket.y, zoom: startZoom };
    setCam(next); camRef.current = next;

    if (!gameLoopRef.current) startLoop();
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }, [selectedPlanet, canAfford, spendStarCoins, makeRocket, startLoop]);

  // ── Add another rocket (enter aim while flying) ────────────────────────────
  const addRocketAim = useCallback(() => {
    if (rocketsRef.current.length >= MAX_ROCKETS) return;
    if (!selectedPlanet || !canAfford) return;
    if (!spendStarCoins(selectedPlanet.launchCost)) return;
    phaseRef.current = "aim";
    setPhase("aim");
    const next: Cam = { x: EARTH_BODY.x, y: EARTH_BODY.y, zoom: 0.4 };
    setCam(next); camRef.current = next;
  }, [selectedPlanet, canAfford, spendStarCoins]);

  // ── Start initial mission (aim mode) ──────────────────────────────────────
  const startMission = useCallback(() => {
    if (!selectedPlanet || !canAfford) return;
    if (!spendStarCoins(selectedPlanet.launchCost)) return;
    phaseRef.current = "aim";
    setPhase("aim");
    const next: Cam = { x: EARTH_BODY.x, y: EARTH_BODY.y, zoom: 0.4 };
    setCam(next); camRef.current = next;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [selectedPlanet, canAfford, spendStarCoins]);

  const cancelAim = useCallback(() => {
    const hadRockets = rocketsRef.current.some((r) => r.status === "flying");
    phaseRef.current = hadRockets ? "flying" : "select";
    setPhase(hadRockets ? "flying" : "select");
    dragRef.current = null; setDrag(null);
  }, []);

  const boostToEarth = useCallback(() => {
    const r = rocketsRef.current[activeIdxRef.current];
    if (!r) return;
    const dx = EARTH_BODY.x - r.x, dy = EARTH_BODY.y - r.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > 0) { r.vx += (dx / d) * 22; r.vy += (dy / d) * 22; }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }, []);

  const adjustZoom = useCallback((zoomIn: boolean) => {
    setCam((prev) => {
      const next = { ...prev, zoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev.zoom * (zoomIn ? ZOOM_FACTOR : 1 / ZOOM_FACTOR))) };
      camRef.current = next;
      return next;
    });
  }, []);

  const switchRocket = useCallback((idx: number) => {
    activeIdxRef.current = idx;
    setActiveIdx(idx);
    const r = rocketsRef.current[idx];
    if (r) {
      setCam((prev) => {
        const next = { ...prev, x: r.x, y: r.y };
        camRef.current = next;
        return next;
      });
    }
  }, []);

  const resetAll = useCallback(() => {
    stopLoop();
    rocketsRef.current = [];
    nextIdRef.current = 1;
    thrustersRef.current.clear();
    activeIdxRef.current = 0;
    setActiveIdx(0);
    setRocketCount(0);
    setLoopRunning(false);
    phaseRef.current = "select";
    setPhase("select");
    dragRef.current = null; setDrag(null);
    setSelectedId(null);
    const next: Cam = { x: EARTH_BODY.x, y: EARTH_BODY.y, zoom: 1.2 };
    setCam(next); camRef.current = next;
  }, [stopLoop]);

  // ── Tap handler ───────────────────────────────────────────────────────────
  const handleTap = useCallback((sx: number, sy: number) => {
    const c = camRef.current;
    for (const body of SOLAR_SYSTEM) {
      if (body.isEarth || body.isSun) continue;
      const bs = w2s(body.x, body.y, c);
      const dist = Math.sqrt((sx - bs.x) ** 2 + (sy - bs.y) ** 2);
      if (dist < Math.max(body.captureRadius * c.zoom, 28)) {
        setSelectedId((prev) => prev === body.id ? null : body.id);
        return;
      }
    }
    setSelectedId(null);
  }, []);
  const handleTapRef = useRef(handleTap);
  useEffect(() => { handleTapRef.current = handleTap; }, [handleTap]);

  // ── Thrusters ─────────────────────────────────────────────────────────────
  const addThrust    = useCallback((d: ThrustDir) => { thrustersRef.current.add(d); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); }, []);
  const removeThrust = useCallback((d: ThrustDir) => { thrustersRef.current.delete(d); }, []);

  // ── PanResponder ──────────────────────────────────────────────────────────
  const handlersRef = useRef<{
    onGrant: (e: GestureResponderEvent, gs: PanResponderGestureState) => void;
    onMove:  (e: GestureResponderEvent, gs: PanResponderGestureState) => void;
    onEnd:   (e: GestureResponderEvent, gs: PanResponderGestureState) => void;
  }>({ onGrant: () => {}, onMove: () => {}, onEnd: () => {} });

  handlersRef.current.onGrant = (evt) => {
    panRef.current = { lastX: evt.nativeEvent.pageX, lastY: evt.nativeEvent.pageY, totalDist: 0 };
  };
  handlersRef.current.onMove = (evt, gs) => {
    if (phaseRef.current === "aim") {
      const mag = Math.sqrt(gs.dx * gs.dx + gs.dy * gs.dy);
      const clamped = mag > MAX_DRAG ? { dx: (gs.dx / mag) * MAX_DRAG, dy: (gs.dy / mag) * MAX_DRAG } : { dx: gs.dx, dy: gs.dy };
      dragRef.current = clamped;
      setDrag({ ...clamped });
    } else {
      const tx = evt.nativeEvent.pageX, ty = evt.nativeEvent.pageY;
      const ddx = tx - panRef.current.lastX, ddy = ty - panRef.current.lastY;
      panRef.current.lastX = tx; panRef.current.lastY = ty;
      panRef.current.totalDist += Math.sqrt(ddx * ddx + ddy * ddy);
      const z = camRef.current.zoom;
      setCam((prev) => { const next = { ...prev, x: prev.x - ddx / z, y: prev.y - ddy / z }; camRef.current = next; return next; });
    }
  };
  handlersRef.current.onEnd = (_evt, gs) => {
    if (phaseRef.current === "aim") {
      const d = dragRef.current;
      if (d && Math.sqrt(d.dx * d.dx + d.dy * d.dy) > 10) {
        doLaunchRef.current(-d.dx * DRAG_SCALE, -d.dy * DRAG_SCALE);
      } else {
        dragRef.current = null; setDrag(null);
      }
    } else if (panRef.current.totalDist < 8 && phaseRef.current === "select") {
      handleTapRef.current(gs.x0, gs.y0);
    }
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e, gs) => handlersRef.current.onGrant(e, gs),
    onPanResponderMove:  (e, gs) => handlersRef.current.onMove(e, gs),
    onPanResponderRelease: (e, gs) => handlersRef.current.onEnd(e, gs),
  })).current;

  // ── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loopRunning) return;
    stopLoop();

    gameLoopRef.current = setInterval(() => {
      const rockets = rocketsRef.current;
      let anyStillFlying = false;

      rockets.forEach((r, idx) => {
        if (r.status !== "flying") return;
        anyStillFlying = true;

        // Thrusters (only for active rocket)
        if (idx === activeIdxRef.current && thrustersRef.current.size > 0) {
          for (const d of thrustersRef.current) {
            if (d === "U") r.vy -= THRUST_POWER;
            else if (d === "D") r.vy += THRUST_POWER;
            else if (d === "L") r.vx -= THRUST_POWER;
            else if (d === "R") r.vx += THRUST_POWER;
          }
        }

        // Gravity
        for (const body of SOLAR_SYSTEM) {
          const dx = body.x - r.x, dy = body.y - r.y;
          const r2 = dx * dx + dy * dy, d = Math.sqrt(r2);
          if (d > body.soi || d < 2) continue;
          r.vx += (dx / d) * (body.mu / r2);
          r.vy += (dy / d) * (body.mu / r2);
        }
        r.x += r.vx; r.y += r.vy;

        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > TRAIL_MAX) r.trail.shift();

        // Update flight trajectory for active rocket
        r.tickCount++;
        if (idx === activeIdxRef.current && r.tickCount % TRAJ_INTERVAL === 0) {
          r.flightTraj = calcTrajectory(r.x, r.y, r.vx, r.vy);
        }

        // Captures & crashes
        let done = false;
        for (const body of SOLAR_SYSTEM) {
          const dx = body.x - r.x, dy = body.y - r.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < body.radius + 5) { finishRocketRef.current(idx, "crash"); done = true; break; }
          if (!body.isEarth && !body.isSun && body.gem) {
            const inside = dist < body.captureRadius;
            const wasInside = r.inZone.has(body.id);
            if (inside && !wasInside) {
              r.inZone.add(body.id);
              r.visited.add(body.id);
              r.minedIds.push(body.id);
              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            } else if (!inside && wasInside) {
              r.inZone.delete(body.id);
            }
          }
          if (body.isEarth && r.visited.size > 0 && dist < body.captureRadius) {
            finishRocketRef.current(idx, "win"); done = true; break;
          }
        }
        if (done) return;
        if (Math.abs(r.x) > 18000 || Math.abs(r.y) > 18000) { finishRocketRef.current(idx, "lost"); return; }
      });

      if (!anyStillFlying) { stopLoop(); setLoopRunning(false); return; }

      // Camera: follow active rocket (lerp)
      const ar = rockets[activeIdxRef.current];
      if (ar?.status === "flying") {
        setCam((prev) => {
          const next = { ...prev, x: prev.x + (ar.x - prev.x) * 0.06, y: prev.y + (ar.y - prev.y) * 0.06 };
          camRef.current = next;
          return next;
        });
      }
      setRenderTick((t) => t + 1);
    }, 33);

    return () => stopLoop();
  }, [loopRunning, stopLoop]);

  // ── Render values ─────────────────────────────────────────────────────────
  const rockets = rocketsRef.current;
  const ar = rockets[activeIdx] ?? null;
  const arPos = ar ? w2s(ar.x, ar.y, cam) : null;
  const aimRocketPos = w2s(EARTH_BODY.x + IDLE_ORBIT_R, EARTH_BODY.y, cam);
  const anyFinished = rockets.some((r) => r.status !== "flying");
  const allDone = rockets.length > 0 && rockets.every((r) => r.status !== "flying");

  return (
    <View style={styles.root} {...panResponder.panHandlers}>

      {/* Stars */}
      {STAR_FIELD.map((star, i) => {
        const ss = w2s(star.wx, star.wy, cam);
        if (ss.x < -10 || ss.x > W + 10 || ss.y < -10 || ss.y > H + 10) return null;
        return <View key={`s${i}`} pointerEvents="none" style={{
          position: "absolute", left: ss.x - star.size / 2, top: ss.y - star.size / 2,
          width: star.size, height: star.size, borderRadius: star.size / 2,
          backgroundColor: `rgba(255,255,255,${star.opacity})`,
        }} />;
      })}

      {/* Solar system bodies */}
      {SOLAR_SYSTEM.map((body) => {
        const bs = w2s(body.x, body.y, cam);
        const margin = body.radius * cam.zoom + 130;
        if (bs.x < -margin || bs.x > W + margin || bs.y < -margin || bs.y > H + margin) return null;
        const rScr = Math.max(10, body.radius * cam.zoom);
        const isSelected = selectedId === body.id;
        const emojiSize = Math.min(rScr * 1.9, 52);
        const showLabel = cam.zoom > 0.1 && !body.isSun;
        const anyMined = rockets.some((r) => r.minedIds.includes(body.id));
        return (
          <View key={body.id} pointerEvents="none">
            <View style={{
              position: "absolute", left: bs.x - rScr * 2.2, top: bs.y - rScr * 2.2,
              width: rScr * 4.4, height: rScr * 4.4, borderRadius: rScr * 2.2,
              backgroundColor: isSelected ? body.color + "22" : body.color + "0A",
              borderWidth: isSelected ? 1.5 : 0, borderColor: body.color + "90",
            }} />
            <View style={{
              position: "absolute", left: bs.x - rScr, top: bs.y - rScr,
              width: rScr * 2, height: rScr * 2, borderRadius: rScr,
              alignItems: "center", justifyContent: "center",
              borderWidth: anyMined ? 2 : 0, borderColor: "#00D9A3",
            }}>
              <Text style={{ fontSize: emojiSize, lineHeight: emojiSize + 4 }}>{body.emoji}</Text>
            </View>
            {showLabel && (
              <View style={{ position: "absolute", left: bs.x - 55, top: bs.y + rScr + 3, width: 110, alignItems: "center" }}>
                <Text style={{ color: isSelected ? "#fff" : body.color, fontSize: 10, fontFamily: "Inter_600SemiBold", textAlign: "center" }}>
                  {body.name}{body.gem ? `  ${body.gem}` : ""}
                </Text>
                {anyMined && <Text style={{ color: "#00D9A3", fontSize: 9, fontFamily: "Inter_400Regular" }}>✓ Mined</Text>}
              </View>
            )}
          </View>
        );
      })}

      {/* Orbit ring (aim) */}
      {phase === "aim" && Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const os = w2s(EARTH_BODY.x + IDLE_ORBIT_R * Math.cos(a), EARTH_BODY.y + IDLE_ORBIT_R * Math.sin(a), cam);
        return <View key={`od${i}`} pointerEvents="none" style={{
          position: "absolute", left: os.x - 2, top: os.y - 2, width: 4, height: 4, borderRadius: 2,
          backgroundColor: i % 2 === 0 ? "rgba(100,150,255,0.5)" : "rgba(100,150,255,0.2)",
        }} />;
      })}

      {/* Aim trajectory */}
      {phase === "aim" && aimTraj.map((pt, i) => {
        const ts = w2s(pt.x, pt.y, cam);
        return <View key={`tp${i}`} pointerEvents="none" style={{
          position: "absolute", left: ts.x - 3, top: ts.y - 3, width: 6, height: 6, borderRadius: 3,
          backgroundColor: `rgba(80,200,255,${0.1 + (i / aimTraj.length) * 0.6})`,
        }} />;
      })}

      {/* All rocket trails */}
      {rockets.map((rk, ri) => {
        const isActive = ri === activeIdx;
        const col = ROCKET_COLORS[ri % ROCKET_COLORS.length];
        return rk.trail.map((pt, i) => {
          const ts = w2s(pt.x, pt.y, cam);
          if (ts.x < -8 || ts.x > W + 8 || ts.y < -8 || ts.y > H + 8) return null;
          return <View key={`tr${ri}_${i}`} pointerEvents="none" style={{
            position: "absolute", left: ts.x - 2.5, top: ts.y - 2.5, width: 5, height: 5, borderRadius: 2.5,
            backgroundColor: isActive
              ? `rgba(80,190,255,${(i / rk.trail.length) * 0.6})`
              : `${col}${Math.round((i / rk.trail.length) * 55).toString(16).padStart(2, "0")}`,
          }} />;
        });
      })}

      {/* Active rocket: flight trajectory forecast (green dots) */}
      {phase === "flying" && ar?.status === "flying" && ar.flightTraj.map((pt, i) => {
        const ts = w2s(pt.x, pt.y, cam);
        if (ts.x < -6 || ts.x > W + 6 || ts.y < -6 || ts.y > H + 6) return null;
        return <View key={`ft${i}`} pointerEvents="none" style={{
          position: "absolute", left: ts.x - 3, top: ts.y - 3, width: 6, height: 6, borderRadius: 3,
          backgroundColor: `rgba(120,220,100,${0.06 + (i / ar.flightTraj.length) * 0.5})`,
        }} />;
      })}

      {/* Nav path guide (gold dashed curve to target) */}
      {phase === "flying" && ar?.status === "flying" && selectedPlanet && (() => {
        return calcNavPath(ar.x, ar.y, selectedPlanet.x, selectedPlanet.y).map((pt, i) => {
          const ts = w2s(pt.x, pt.y, cam);
          if (ts.x < -6 || ts.x > W + 6 || ts.y < -6 || ts.y > H + 6) return null;
          if (Math.floor(i / 3) % 2 !== 0) return null;
          return <View key={`np${i}`} pointerEvents="none" style={{
            position: "absolute", left: ts.x - 2.5, top: ts.y - 2.5, width: 5, height: 5, borderRadius: 2.5,
            backgroundColor: `rgba(255,215,0,${0.1 + (i / 40) * 0.52})`,
          }} />;
        });
      })()}

      {/* Slingshot rubber band */}
      {phase === "aim" && drag && (() => {
        const rx = aimRocketPos.x, ry = aimRocketPos.y;
        const mag = Math.sqrt(drag.dx ** 2 + drag.dy ** 2);
        const nx = mag > 0 ? drag.dx / mag : 0, ny = mag > 0 ? drag.dy / mag : 0;
        return (
          <>
            <LineView x1={rx} y1={ry} x2={rx + drag.dx} y2={ry + drag.dy} color="#FF9F43" thickness={3} opacity={0.9} />
            <LineView x1={rx} y1={ry} x2={rx - nx * mag * 0.65} y2={ry - ny * mag * 0.65} color="#7C6FFF" thickness={2.5} opacity={0.85} />
            <View pointerEvents="none" style={{
              position: "absolute", left: rx + drag.dx - 9, top: ry + drag.dy - 9,
              width: 18, height: 18, borderRadius: 9, backgroundColor: "#FF9F43", opacity: 0.9,
            }} />
          </>
        );
      })()}

      {/* All rockets (emoji) */}
      {(phase === "aim" || phase === "flying") && (() => {
        const items: React.ReactNode[] = [];
        // Aim-mode rocket at Earth orbit
        if (phase === "aim") {
          items.push(
            <View key="aim_rocket" pointerEvents="none" style={{
              position: "absolute", left: aimRocketPos.x - 14, top: aimRocketPos.y - 14,
              width: 28, height: 28, alignItems: "center", justifyContent: "center", zIndex: 5,
            }}>
              <Text style={{ fontSize: 22 }}>🚀</Text>
            </View>
          );
        }
        // Flying rockets
        rockets.forEach((rk, ri) => {
          const rPos = w2s(rk.x, rk.y, cam);
          const rAngle = Math.atan2(rk.vy, rk.vx) * (180 / Math.PI) + 90;
          const isActive = ri === activeIdx;
          const col = ROCKET_COLORS[ri % ROCKET_COLORS.length];
          const statusEmoji = rk.status === "win" ? "✅" : rk.status === "crash" ? "💥" : rk.status === "lost" ? "🌌" : null;
          items.push(
            <View key={`rk${ri}`} pointerEvents="none" style={{
              position: "absolute", left: rPos.x - 16, top: rPos.y - 16,
              width: 32, height: 32, alignItems: "center", justifyContent: "center",
              transform: [{ rotate: `${rAngle}deg` }], zIndex: 5,
            }}>
              <Text style={{ fontSize: statusEmoji ? 18 : 22 }}>{statusEmoji ?? "🚀"}</Text>
            </View>
          );
          // Number badge (non-active, or when multiple)
          if (rockets.length > 1) {
            items.push(
              <View key={`badge${ri}`} pointerEvents="none" style={{
                position: "absolute",
                left: rPos.x + (isActive ? 10 : 8),
                top: rPos.y - (isActive ? 18 : 16),
                width: 16, height: 16, borderRadius: 8,
                backgroundColor: isActive ? "#FFD700" : col,
                alignItems: "center", justifyContent: "center", zIndex: 6,
              }}>
                <Text style={{ fontSize: 9, fontFamily: "Inter_700Bold", color: "#000" }}>{ri + 1}</Text>
              </View>
            );
          }
        });
        return items;
      })()}

      {/* Nav arrows (edge arrows to planets) during flight */}
      {phase === "flying" && ar?.status === "flying" && SOLAR_SYSTEM.map((body) => {
        if (body.isEarth || body.isSun) return null;
        const isMined = ar.minedIds.includes(body.id);
        const isTarget = selectedId === body.id;
        const arrow = getEdgeArrow(body.x, body.y, cam);
        const arrowColor = isTarget ? "#FFD700" : isMined ? "#00D9A3" : body.color;
        const sz = isTarget ? 18 : 13;
        return (
          <View key={`nav${body.id}`} pointerEvents="none" style={{
            position: "absolute", left: arrow.sx - sz / 2, top: arrow.sy - sz / 2,
            width: sz, height: sz, alignItems: "center", justifyContent: "center",
            transform: [{ rotate: `${arrow.angle * 180 / Math.PI + 90}deg` }],
            opacity: arrow.offScreen ? 0.9 : (isTarget ? 0.6 : 0.35),
          }}>
            <Text style={{ fontSize: sz, color: arrowColor, lineHeight: sz + 2 }}>▲</Text>
          </View>
        );
      })}

      {/* Earth nav arrow when gems collected */}
      {phase === "flying" && ar?.status === "flying" && ar.minedIds.length > 0 && (() => {
        const arrow = getEdgeArrow(EARTH_BODY.x, EARTH_BODY.y, cam);
        if (!arrow.offScreen) return null;
        return (
          <View pointerEvents="none" style={{
            position: "absolute", left: arrow.sx - 11, top: arrow.sy - 11,
            width: 22, height: 22, alignItems: "center", justifyContent: "center",
            transform: [{ rotate: `${arrow.angle * 180 / Math.PI + 90}deg` }], opacity: 0.95,
          }}>
            <Text style={{ fontSize: 18, lineHeight: 20 }}>🌍</Text>
          </View>
        );
      })()}

      {/* ── HUD: top bar ─────────────────────────────────────────────────── */}
      <View style={[styles.hudTop, { paddingTop: topPad + 6 }]} pointerEvents="box-none">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.coinBalance}>🪙 {gameData.starCoins.toLocaleString()}</Text>
      </View>

      {/* Rocket switcher (shown when flying or all done) */}
      {(phase === "flying" || (allDone && rockets.length > 0)) && (
        <View style={[styles.switcherRow, { top: topPad + 50 }]} pointerEvents="box-none">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcherInner}>
            {rockets.map((rk, ri) => {
              const col = ROCKET_COLORS[ri % ROCKET_COLORS.length];
              const isActive = ri === activeIdx;
              const statusColor = rk.status === "win" ? "#00D9A3" : rk.status === "crash" || rk.status === "lost" ? "#FF4757" : col;
              return (
                <TouchableOpacity
                  key={`sw${ri}`}
                  style={[styles.switcherBtn, {
                    borderColor: isActive ? "#FFD700" : statusColor + "66",
                    backgroundColor: isActive ? "#FFD70022" : statusColor + "18",
                  }]}
                  onPress={() => switchRocket(ri)}
                >
                  <Text style={{ fontSize: 13 }}>🚀</Text>
                  <Text style={[styles.switcherLabel, { color: statusColor }]}>
                    {ri + 1}{rk.status === "win" ? "✓" : rk.status === "crash" ? "✕" : rk.status === "lost" ? "~" : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {/* Fly Again when all done */}
            {allDone && (
              <TouchableOpacity style={[styles.switcherBtn, { borderColor: "#7C6FFF66", backgroundColor: "#7C6FFF22" }]} onPress={resetAll}>
                <Text style={{ fontSize: 13 }}>🔄</Text>
                <Text style={[styles.switcherLabel, { color: "#7C6FFF" }]}>Reset</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* Zoom buttons */}
      {!allDone && (
        <View style={[styles.zoomBtns, { top: topPad + (phase === "flying" ? 100 : 56) }]} pointerEvents="box-none">
          <TouchableOpacity style={styles.zoomBtn} onPress={() => adjustZoom(true)}>
            <Text style={styles.zoomBtnText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomBtn} onPress={() => adjustZoom(false)}>
            <Text style={styles.zoomBtnText}>−</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Phase-specific bottom cards ───────────────────────────────────── */}

      {/* SELECT: planet info + Launch + Orbit buttons */}
      {phase === "select" && (
        <View style={[styles.bottomCard, { paddingBottom: bottomPad + 16 }]} pointerEvents="box-none">
          {selectedPlanet ? (
            <>
              <View style={styles.planetRow}>
                <Text style={styles.planetEmojiLg}>{selectedPlanet.emoji}</Text>
                <View style={styles.planetInfo}>
                  <Text style={styles.planetNameText}>{selectedPlanet.name}</Text>
                  {selectedPlanet.gem && <Text style={styles.planetGemText}>{selectedPlanet.gem} {selectedPlanet.gemName}</Text>}
                  <Text style={styles.planetSubText}>🪙 {selectedPlanet.launchCost.toLocaleString()}  ·  ⏱ {selectedPlanet.travelHint}</Text>
                </View>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnPrimary, !canAfford && styles.actionBtnOff]}
                  onPress={startMission} disabled={!canAfford} activeOpacity={0.8}
                >
                  <Text style={[styles.actionBtnText, !canAfford && { color: "#555" }]}>🎯 Aim & Launch</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnOrbit, !canAfford && styles.actionBtnOff]}
                  onPress={launchOrbit} disabled={!canAfford} activeOpacity={0.8}
                >
                  <Text style={[styles.actionBtnText, !canAfford && { color: "#555" }]}>🪐 Auto Orbit</Text>
                </TouchableOpacity>
              </View>
              {!canAfford && (
                <Text style={styles.cantAffordText}>Need 🪙 {selectedPlanet.launchCost.toLocaleString()} · Have {gameData.starCoins.toLocaleString()}</Text>
              )}
            </>
          ) : (
            <Text style={styles.selectHint}>🔭  Zoom out with − to see all planets  ·  Tap one to select</Text>
          )}
        </View>
      )}

      {/* AIM: slingshot instructions */}
      {phase === "aim" && (
        <View style={[styles.aimCard, { paddingBottom: bottomPad + 14 }]} pointerEvents="box-none">
          <Text style={styles.aimTitle}>
            {drag ? `⚡ Power ${slingshotPower}%  ·  Release to launch!`
                  : "Drag anywhere to aim · Use +/− to zoom · Release to fire 🚀"}
          </Text>
          {selectedPlanet && (
            <Text style={styles.aimTarget}>Target: {selectedPlanet.emoji} {selectedPlanet.name}  ·  {selectedPlanet.travelHint}</Text>
          )}
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelAim}>
            <Text style={styles.cancelBtnText}>✕ Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FLYING: nav bar + add rocket */}
      {phase === "flying" && ar && (
        <View style={[styles.flyingBottom, { bottom: bottomPad + 14 }]} pointerEvents="box-none">
          {/* Nav bar */}
          <View style={styles.navBar}>
            {selectedPlanet ? (
              <View style={styles.navBarInner}>
                <Text style={{ fontSize: 24 }}>{selectedPlanet.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.navBarTitle}>{selectedPlanet.name}</Text>
                  <Text style={styles.navBarSub}>
                    {navDistWu !== null ? `${navDistWu.toLocaleString()} wu` : "—"}  ·  {flightSpeed} wu/t
                  </Text>
                </View>
                {ar.minedIds.length > 0 && (
                  <TouchableOpacity style={styles.returnBtn} onPress={boostToEarth}>
                    <Text style={styles.returnBtnText}>🌍 Home</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.navBarInner}>
                <Text style={styles.navBarNoTarget}>
                  {ar.minedIds.length > 0
                    ? `${ar.minedIds.map((id) => SOLAR_SYSTEM.find((b) => b.id === id)?.gem ?? "").join(" ")} Mined!`
                    : `🚀 ${flightSpeed} wu/t  ·  Select a planet to see nav`}
                </Text>
                {ar.minedIds.length > 0 && (
                  <TouchableOpacity style={styles.returnBtn} onPress={boostToEarth}>
                    <Text style={styles.returnBtnText}>🌍 Home</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Add Rocket button */}
          {rockets.length < MAX_ROCKETS && rockets.filter((r) => r.status === "flying").length < MAX_ROCKETS && selectedPlanet && canAfford && (
            <TouchableOpacity style={styles.addRocketBtn} onPress={addRocketAim} activeOpacity={0.8}>
              <Text style={styles.addRocketText}>＋ Add Rocket  🪙{selectedPlanet.launchCost.toLocaleString()}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* FLYING: thruster d-pad */}
      {phase === "flying" && ar?.status === "flying" && (
        <View style={[styles.thrusterPad, { bottom: bottomPad + 14 }]} pointerEvents="box-none">
          <View style={styles.thrusterRow}>
            <ThrusterBtn label="▲" onIn={() => addThrust("U")} onOut={() => removeThrust("U")} />
          </View>
          <View style={styles.thrusterRow}>
            <ThrusterBtn label="◀" onIn={() => addThrust("L")} onOut={() => removeThrust("L")} />
            <View style={styles.thrusterCenter}><Text style={styles.thrusterDot}>✦</Text></View>
            <ThrusterBtn label="▶" onIn={() => addThrust("R")} onOut={() => removeThrust("R")} />
          </View>
          <View style={styles.thrusterRow}>
            <ThrusterBtn label="▼" onIn={() => addThrust("D")} onOut={() => removeThrust("D")} />
          </View>
        </View>
      )}

      {/* ALL DONE overlay */}
      {allDone && rockets.length > 0 && (
        <View style={[styles.resultOverlay, { paddingBottom: bottomPad + 16 }]} pointerEvents="box-none">
          <Text style={{ fontSize: 44 }}>
            {rockets.every((r) => r.status === "win") ? "🎉" : rockets.some((r) => r.status === "win") ? "🏅" : "💥"}
          </Text>
          <Text style={[styles.resultTitle, {
            color: rockets.some((r) => r.status === "win") ? "#00D9A3" : "#FF4757"
          }]}>
            {rockets.every((r) => r.status === "win") ? "All Missions Complete!"
              : rockets.some((r) => r.status === "win") ? `${rockets.filter((r) => r.status === "win").length} of ${rockets.length} Succeeded`
              : "All Rockets Lost"}
          </Text>
          {/* Gem summary */}
          {rockets.some((r) => r.minedIds.length > 0) && (
            <View style={styles.gemsBox}>
              <Text style={styles.gemsTitle}>Gems collected:</Text>
              <Text style={{ fontSize: 26, letterSpacing: 3, marginVertical: 4 }}>
                {rockets.flatMap((r) => r.minedIds).map((id) => SOLAR_SYSTEM.find((b) => b.id === id)?.gem ?? "").join("  ")}
              </Text>
            </View>
          )}
          <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
            <TouchableOpacity style={[styles.resultBtn, { backgroundColor: "#7C6FFF", flex: 1 }]} onPress={resetAll}>
              <Text style={styles.resultBtnText}>🔄 Fly Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.resultBtn, { borderWidth: 1, borderColor: "#444", flex: 1 }]} onPress={() => router.back()}>
              <Text style={[styles.resultBtnText, { color: "#888" }]}>🏠 Base</Text>
            </TouchableOpacity>
          </View>
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
  // Rocket switcher
  switcherRow: { position: "absolute", left: 0, right: 0, zIndex: 20 },
  switcherInner: { paddingHorizontal: 14, gap: 6, flexDirection: "row", alignItems: "center" },
  switcherBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1.5,
  },
  switcherLabel: { fontSize: 12, fontFamily: "Inter_700Bold" },
  // Zoom
  zoomBtns: { position: "absolute", right: 14, gap: 6, zIndex: 20 },
  zoomBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  zoomBtnText: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 26 },
  // Select card
  bottomCard: {
    position: "absolute", bottom: 0, left: 14, right: 14,
    backgroundColor: "rgba(8,8,24,0.94)", borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(100,120,255,0.22)",
    padding: 16, gap: 12, zIndex: 20,
  },
  planetRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  planetEmojiLg: { fontSize: 40 },
  planetInfo: { flex: 1, gap: 2 },
  planetNameText: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  planetGemText: { color: "#FFD166", fontSize: 13, fontFamily: "Inter_400Regular" },
  planetSubText: { color: "#777", fontSize: 12, fontFamily: "Inter_400Regular" },
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  actionBtnPrimary: { backgroundColor: "#7C6FFF" },
  actionBtnOrbit:   { backgroundColor: "#1B4A3A", borderWidth: 1, borderColor: "#00D9A344" },
  actionBtnOff: { backgroundColor: "rgba(60,60,80,0.6)" },
  actionBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  cantAffordText: { color: "#555", fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  selectHint: { color: "#555", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 10 },
  // Aim card
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
  // Flying
  flyingBottom: { position: "absolute", left: 14, right: 100, gap: 8, zIndex: 20 },
  navBar: {
    backgroundColor: "rgba(6,6,20,0.88)", borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(100,120,255,0.2)",
    padding: 10,
  },
  navBarInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  navBarTitle: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  navBarSub: { color: "#666", fontSize: 11, fontFamily: "Inter_400Regular" },
  navBarNoTarget: { flex: 1, color: "#555", fontSize: 12, fontFamily: "Inter_400Regular" },
  returnBtn: {
    backgroundColor: "#1B4A2A", borderRadius: 10,
    paddingVertical: 7, paddingHorizontal: 10,
    borderWidth: 1, borderColor: "#1B6B3A",
  },
  returnBtnText: { color: "#00D9A3", fontSize: 11, fontFamily: "Inter_700Bold" },
  addRocketBtn: {
    backgroundColor: "rgba(124,111,255,0.18)", borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(124,111,255,0.45)",
    paddingVertical: 9, alignItems: "center",
  },
  addRocketText: { color: "#7C6FFF", fontSize: 12, fontFamily: "Inter_700Bold" },
  // Thruster pad
  thrusterPad: { position: "absolute", right: 14, gap: 2, zIndex: 20, alignItems: "center" },
  thrusterRow: { flexDirection: "row", gap: 2, alignItems: "center", justifyContent: "center" },
  thrusterBtn: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: "rgba(80,120,255,0.22)",
    borderWidth: 1, borderColor: "rgba(80,120,255,0.45)",
    alignItems: "center", justifyContent: "center",
  },
  thrusterBtnText: { color: "#8AB4FF", fontSize: 16, fontFamily: "Inter_700Bold" },
  thrusterCenter: { width: 42, height: 42, alignItems: "center", justifyContent: "center", opacity: 0.3 },
  thrusterDot: { color: "#8AB4FF", fontSize: 14 },
  // Result overlay
  resultOverlay: {
    position: "absolute", bottom: 0, left: 18, right: 18,
    backgroundColor: "rgba(5,5,18,0.97)", borderRadius: 22,
    borderWidth: 1.5, borderColor: "rgba(100,120,255,0.3)",
    padding: 22, gap: 10, zIndex: 30, alignItems: "center",
  },
  resultTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  gemsBox: { alignItems: "center", gap: 2 },
  gemsTitle: { color: "#888", fontSize: 12, fontFamily: "Inter_400Regular" },
  resultBtn: { borderRadius: 14, paddingVertical: 13, paddingHorizontal: 20, alignItems: "center" },
  resultBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
