import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  type ImageSourcePropType,
  type ImageStyle,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { usePathname } from "expo-router";
import {
  CLASSROOM_BACKGROUND,
  getClassroomCharacterAsset,
  getClassroomItemAsset,
  getClassroomStudentAsset,
} from "@/constants/classroomAssets";
import { SHOP_ITEMS } from "@/constants/shopItems";
import { UI_ASSETS } from "@/constants/uiAssets";
import type { ClassroomItemLayout } from "@/context/GameContext";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
export const CLASSROOM_SCENE_W = SCREEN_W - 40;
export const CLASSROOM_SCENE_H = Math.min(CLASSROOM_SCENE_W * 0.68, 280);
const FULL_EDITOR_W = SCREEN_W;
const FULL_EDITOR_H = Math.min(SCREEN_W * 0.66, SCREEN_H - 220);
const CLASSROOM_META_ID = "__classroomMeta";

type ClassroomLayoutMap = Record<string, ClassroomItemLayout>;
type ClassroomBox = { x: number; y: number; w: number; h: number };
type ClassroomBorder = ClassroomBox & { id: string; rotation: number };
type SceneMode = "view" | "edit";
type EditorTool = "arrange" | "borders";
type TrayItem = { id: string; asset: ImageSourcePropType };
type EditableLayer = {
  id: string;
  asset: ImageSourcePropType;
  baseStyle?: ImageStyle;
  layout: ClassroomItemLayout;
  zIndex: number;
};

const MIN_ITEM_SCALE = 0.65;
const MAX_ITEM_SCALE = 1.9;
const HANDLE_SIZE = 18;
const DEFAULT_GRAVITY_AMOUNT = 0;
const DEFAULT_GRAVITY_ANGLE = 90;

const ITEM_BASE_SIZE: Record<string, { w: number; h: number }> = {
  computer: { w: 0.086, h: 0.118 },
  fox: { w: 0.061, h: 0.116 },
  cactus: { w: 0.054, h: 0.12 },
  calculator_gold: { w: 0.058, h: 0.108 },
  chemistry: { w: 0.076, h: 0.113 },
  microscope: { w: 0.053, h: 0.13 },
  rocket_model: { w: 0.05, h: 0.132 },
  clock: { w: 0.054, h: 0.094 },
  bookshelf: { w: 0.14, h: 0.34 },
  globe: { w: 0.086, h: 0.17 },
  space_poster: { w: 0.065, h: 0.112 },
  map: { w: 0.07, h: 0.108 },
  star_banner: { w: 0.05, h: 0.08 },
  rainbow: { w: 0.058, h: 0.1 },
  neon: { w: 0.056, h: 0.088 },
  solar_system: { w: 0.124, h: 0.16 },
  plant: { w: 0.075, h: 0.155 },
  aquarium: { w: 0.13, h: 0.19 },
  easel: { w: 0.095, h: 0.205 },
  musical: { w: 0.21, h: 0.31 },
  robot: { w: 0.088, h: 0.208 },
  trophy: { w: 0.105, h: 0.18 },
  telescope: { w: 0.125, h: 0.23 },
  student: { w: 0.21, h: 0.405 },
  hat: { w: 0.115, h: 0.09 },
  accessory: { w: 0.09, h: 0.09 },
};

const DEFAULT_ITEM_LAYOUT: ClassroomLayoutMap = {
  computer: { x: 0.298, y: 0.481, scale: 1, rotation: 0 },
  fox: { x: 0.392, y: 0.481, scale: 1, rotation: 0 },
  cactus: { x: 0.458, y: 0.477, scale: 1, rotation: 0 },
  calculator_gold: { x: 0.52, y: 0.485, scale: 1, rotation: 0 },
  chemistry: { x: 0.583, y: 0.482, scale: 1, rotation: 0 },
  microscope: { x: 0.664, y: 0.468, scale: 1, rotation: 0 },
  rocket_model: { x: 0.724, y: 0.468, scale: 1, rotation: 0 },
  clock: { x: 0.057, y: 0.205, scale: 1, rotation: 0 },
  bookshelf: { x: 0.124, y: 0.208, scale: 1, rotation: 0 },
  globe: { x: 0.715, y: 0.625, scale: 1, rotation: 0 },
  space_poster: { x: 0.742, y: 0.252, scale: 1, rotation: 0 },
  map: { x: 0.813, y: 0.254, scale: 1, rotation: 0 },
  star_banner: { x: 0.745, y: 0.372, scale: 1, rotation: 0 },
  rainbow: { x: 0.818, y: 0.374, scale: 1, rotation: 0 },
  neon: { x: 0.824, y: 0.492, scale: 1, rotation: 0 },
  solar_system: { x: 0.439, y: 0.042, scale: 1, rotation: 0 },
  plant: { x: 0.03, y: 0.79, scale: 1, rotation: 0 },
  aquarium: { x: 0.136, y: 0.555, scale: 1, rotation: 0 },
  easel: { x: 0.12, y: 0.764, scale: 1, rotation: 0 },
  musical: { x: 0.28, y: 0.675, scale: 1, rotation: 0 },
  robot: { x: 0.621, y: 0.752, scale: 1, rotation: 0 },
  trophy: { x: 0.745, y: 0.805, scale: 1, rotation: 0 },
  telescope: { x: 0.865, y: 0.735, scale: 1, rotation: 0 },
  student: { x: 0.395, y: 0.582, scale: 1, rotation: 0 },
  hat: { x: 0.452, y: 0.588, scale: 1, rotation: 0 },
  accessory: { x: 0.495, y: 0.765, scale: 1, rotation: 0 },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeAngle(angle: number) {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function snapGravityAngle(angle: number) {
  const normalized = normalizeAngle(angle);
  const snapPoints = [0, 90, 180, 270, 360];
  const nearest = snapPoints.reduce((best, point) => {
    const bestDelta = Math.abs(shortestAngleDelta(normalized, best));
    const pointDelta = Math.abs(shortestAngleDelta(normalized, point));
    return pointDelta < bestDelta ? point : best;
  }, 0);
  return Math.abs(shortestAngleDelta(normalized, nearest)) <= 10 ? normalizeAngle(nearest) : normalized;
}

function angleFromPoint(x: number, y: number, centerX: number, centerY: number) {
  return (Math.atan2(y - centerY, x - centerX) * 180) / Math.PI;
}

function shortestAngleDelta(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}

function distanceFromPoint(x: number, y: number, centerX: number, centerY: number) {
  return Math.max(1, Math.hypot(x - centerX, y - centerY));
}

function getSceneMeta(layoutMap: ClassroomLayoutMap) {
  const meta = layoutMap[CLASSROOM_META_ID];
  return {
    gravityAmount: clamp(meta?.gravityAmount ?? DEFAULT_GRAVITY_AMOUNT, 0, 1),
    gravityAngle: normalizeAngle(meta?.gravityAngle ?? DEFAULT_GRAVITY_ANGLE),
    showBorders: Boolean(meta?.showBorders),
    customBorders: (meta?.customBorders ?? []).map((border) => ({
      ...border,
      x: clamp(border.x, 0, 1),
      y: clamp(border.y, 0, 1),
      w: clamp(border.w, 0.01, 1),
      h: clamp(border.h, 0.006, 0.16),
      rotation: normalizeAngle(border.rotation),
    })),
  };
}

function withSceneMeta(layoutMap: ClassroomLayoutMap, meta: ReturnType<typeof getSceneMeta>) {
  return {
    ...layoutMap,
    [CLASSROOM_META_ID]: {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      gravityAmount: meta.gravityAmount,
      gravityAngle: meta.gravityAngle,
      showBorders: meta.showBorders,
      customBorders: meta.customBorders,
    },
  };
}

function getDefaultLayout(itemId: string): ClassroomItemLayout {
  if (itemId.startsWith("hat:")) return DEFAULT_ITEM_LAYOUT.hat;
  if (itemId.startsWith("accessory:")) return DEFAULT_ITEM_LAYOUT.accessory;
  return DEFAULT_ITEM_LAYOUT[itemId] ?? { x: 0.45, y: 0.45, scale: 1, rotation: 0 };
}

function getItemSize(itemId: string, layout: ClassroomItemLayout) {
  const size =
    itemId.startsWith("hat:")
      ? ITEM_BASE_SIZE.hat
      : itemId.startsWith("accessory:")
        ? ITEM_BASE_SIZE.accessory
        : ITEM_BASE_SIZE[itemId] ?? { w: 0.065, h: 0.12 };
  return { w: size.w * layout.scale, h: size.h * layout.scale };
}

function clampLayout(itemId: string, layout: ClassroomItemLayout): ClassroomItemLayout {
  const scale = clamp(layout.scale, MIN_ITEM_SCALE, MAX_ITEM_SCALE);
  const size = getItemSize(itemId, { ...layout, scale });
  return {
    x: clamp(layout.x, 0.01, 0.99 - size.w),
    y: clamp(layout.y, 0.015, 0.985 - size.h),
    scale,
    rotation: layout.rotation,
    inTray: layout.inTray,
  };
}

function normalizeLayout(layout: ClassroomItemLayout): ClassroomItemLayout {
  return {
    x: clamp(layout.x, -1, 2),
    y: clamp(layout.y, -1, 2),
    scale: clamp(layout.scale, MIN_ITEM_SCALE, MAX_ITEM_SCALE),
    rotation: layout.rotation,
    inTray: layout.inTray,
  };
}

function boxFor(itemId: string, layout: ClassroomItemLayout): ClassroomBox {
  const size = getItemSize(itemId, layout);
  return { x: layout.x, y: layout.y, w: size.w, h: size.h };
}

function boxesOverlap(a: ClassroomBox, b: ClassroomBox) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function isNearlySameLayout(a: ClassroomItemLayout, b: ClassroomItemLayout) {
  return (
    a.inTray === b.inTray &&
    Math.abs(a.x - b.x) < 0.0006 &&
    Math.abs(a.y - b.y) < 0.0006 &&
    Math.abs(a.scale - b.scale) < 0.0001 &&
    Math.abs(a.rotation - b.rotation) < 0.0001
  );
}

function borderAabb(border: ClassroomBorder): ClassroomBox {
  const radians = (border.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const w = border.w * cos + border.h * sin;
  const h = border.w * sin + border.h * cos;
  return { x: border.x + border.w / 2 - w / 2, y: border.y + border.h / 2 - h / 2, w, h };
}

function resolveBorderCollisions(
  itemId: string,
  layout: ClassroomItemLayout,
  dx: number,
  dy: number,
  borders: ClassroomBorder[]
) {
  let next = layout;
  const cushion = 0.00015;
  for (const border of borders) {
    const box = boxFor(itemId, next);
    const borderBox = borderAabb(border);
    if (!boxesOverlap(box, borderBox)) continue;
    if (Math.abs(dx) >= Math.abs(dy)) {
      next = {
        ...next,
        x: dx >= 0 ? borderBox.x - box.w - cushion : borderBox.x + borderBox.w + cushion,
      };
    } else {
      next = {
        ...next,
        y: dy >= 0 ? borderBox.y - box.h - cushion : borderBox.y + borderBox.h + cushion,
      };
    }
  }
  return next;
}

function getPlacedAssetStyle(itemId: string, layout: ClassroomItemLayout): ViewStyle {
  const size = getItemSize(itemId, layout);
  return {
    left: `${layout.x * 100}%`,
    top: `${layout.y * 100}%`,
    width: `${size.w * 100}%`,
    height: `${size.h * 100}%`,
    transform: [{ rotate: `${layout.rotation}deg` }],
  };
}

function getWearablePlacement(itemId: string | undefined, fallback: ImageStyle) {
  return itemId && wearablePlacement[itemId as keyof typeof wearablePlacement]
    ? wearablePlacement[itemId as keyof typeof wearablePlacement]
    : fallback;
}

function PlacedClassroomItem({
  itemId,
  asset,
  baseStyle,
  layout,
  mode,
  sceneWidth,
  sceneHeight,
  isSelected,
  zIndex,
  onSelect,
  onGestureActiveChange,
  getSceneFrame,
  applyLayout,
  onCommit,
}: {
  itemId: string;
  asset: ImageSourcePropType;
  baseStyle?: ImageStyle;
  layout: ClassroomItemLayout;
  mode: SceneMode;
  sceneWidth: number;
  sceneHeight: number;
  isSelected: boolean;
  zIndex: number;
  onSelect?: (id: string) => void;
  onGestureActiveChange?: (id: string | null) => void;
  getSceneFrame?: () => { x: number; y: number; w: number; h: number };
  applyLayout?: (updater: (prev: ClassroomLayoutMap) => ClassroomLayoutMap) => void;
  onCommit?: () => void;
}) {
  const itemRef = useRef<View>(null);
  const startLayout = useRef(layout);
  const gestureActive = useRef(false);
  const gestureStart = useRef({
    rotation: 0,
    scale: 1,
    angle: 0,
    distance: 1,
    centerX: 0,
    centerY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  useEffect(() => {
    if (!gestureActive.current) startLayout.current = layout;
  }, [layout]);

  const commit = useCallback(() => {
    gestureActive.current = false;
    onGestureActiveChange?.(null);
    if (mode !== "edit") onCommit?.();
  }, [mode, onGestureActiveChange, onCommit]);

  const setGestureCenter = useCallback((pageX: number, pageY: number) => {
    const size = getItemSize(itemId, startLayout.current);
    gestureStart.current = {
      ...gestureStart.current,
      centerX: pageX - size.w * sceneWidth,
      centerY: pageY + size.h * sceneHeight,
    };
    itemRef.current?.measureInWindow((x, y, width, height) => {
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      gestureStart.current = {
        ...gestureStart.current,
        centerX,
        centerY,
        angle: angleFromPoint(pageX, pageY, centerX, centerY),
        distance: distanceFromPoint(pageX, pageY, centerX, centerY),
      };
    });
  }, [itemId, sceneHeight, sceneWidth]);

  const dragResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => mode === "edit",
        onMoveShouldSetPanResponder: () => mode === "edit",
        onPanResponderGrant: (event) => {
          gestureActive.current = true;
          startLayout.current = layout;
          const frame = getSceneFrame?.() ?? { x: 0, y: 0, w: sceneWidth, h: sceneHeight };
          gestureStart.current = {
            ...gestureStart.current,
            offsetX: event.nativeEvent.pageX - (frame.x + layout.x * frame.w),
            offsetY: event.nativeEvent.pageY - (frame.y + layout.y * frame.h),
          };
          onSelect?.(itemId);
          onGestureActiveChange?.(itemId);
        },
        onPanResponderMove: (event) => {
          if (mode !== "edit" || !applyLayout) return;
          const frame = getSceneFrame?.() ?? { x: 0, y: 0, w: sceneWidth, h: sceneHeight };
          const nextLayout = {
            ...startLayout.current,
            x: (event.nativeEvent.pageX - frame.x - gestureStart.current.offsetX) / frame.w,
            y: (event.nativeEvent.pageY - frame.y - gestureStart.current.offsetY) / frame.h,
          };
          applyLayout((prev) => ({ ...prev, [itemId]: normalizeLayout(nextLayout) }));
        },
        onPanResponderRelease: commit,
        onPanResponderTerminate: commit,
        onPanResponderTerminationRequest: () => false,
      }),
    [applyLayout, commit, getSceneFrame, itemId, layout, mode, onGestureActiveChange, onSelect, sceneHeight, sceneWidth]
  );

  const rotateResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => mode === "edit",
        onMoveShouldSetPanResponder: () => mode === "edit",
        onPanResponderGrant: (event) => {
          gestureActive.current = true;
          startLayout.current = layout;
          onSelect?.(itemId);
          onGestureActiveChange?.(itemId);
          gestureStart.current = {
            ...gestureStart.current,
            rotation: layout.rotation,
            scale: layout.scale,
          };
          setGestureCenter(event.nativeEvent.pageX, event.nativeEvent.pageY);
        },
        onPanResponderMove: (event) => {
          if (mode !== "edit" || !applyLayout) return;
          const currentAngle = angleFromPoint(
            event.nativeEvent.pageX,
            event.nativeEvent.pageY,
            gestureStart.current.centerX,
            gestureStart.current.centerY
          );
          const rotation = normalizeAngle(
            gestureStart.current.rotation + shortestAngleDelta(gestureStart.current.angle, currentAngle)
          );
          applyLayout((prev) => {
            const nextLayout = { ...startLayout.current, rotation };
            return { ...prev, [itemId]: normalizeLayout(nextLayout) };
          });
        },
        onPanResponderRelease: commit,
        onPanResponderTerminate: commit,
        onPanResponderTerminationRequest: () => false,
      }),
    [applyLayout, commit, itemId, layout, mode, onGestureActiveChange, onSelect, sceneHeight, sceneWidth, setGestureCenter]
  );

  const resizeResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => mode === "edit",
        onMoveShouldSetPanResponder: () => mode === "edit",
        onPanResponderGrant: (event) => {
          gestureActive.current = true;
          startLayout.current = layout;
          onSelect?.(itemId);
          onGestureActiveChange?.(itemId);
          gestureStart.current = {
            ...gestureStart.current,
            rotation: layout.rotation,
            scale: layout.scale,
          };
          setGestureCenter(event.nativeEvent.pageX, event.nativeEvent.pageY);
        },
        onPanResponderMove: (event) => {
          if (mode !== "edit" || !applyLayout) return;
          const currentDistance = distanceFromPoint(
            event.nativeEvent.pageX,
            event.nativeEvent.pageY,
            gestureStart.current.centerX,
            gestureStart.current.centerY
          );
          const startSize = getItemSize(itemId, startLayout.current);
          const nextScale = gestureStart.current.scale * (currentDistance / gestureStart.current.distance);
          const nextSize = getItemSize(itemId, { ...startLayout.current, scale: clamp(nextScale, MIN_ITEM_SCALE, MAX_ITEM_SCALE) });
          const nextLayout = normalizeLayout({
            ...startLayout.current,
            x: startLayout.current.x + (startSize.w - nextSize.w) / 2,
            y: startLayout.current.y + (startSize.h - nextSize.h) / 2,
            scale: nextScale,
          });
          applyLayout((prev) => ({ ...prev, [itemId]: nextLayout }));
        },
        onPanResponderRelease: commit,
        onPanResponderTerminate: commit,
        onPanResponderTerminationRequest: () => false,
      }),
    [applyLayout, commit, itemId, layout, mode, onGestureActiveChange, onSelect, sceneHeight, sceneWidth, setGestureCenter]
  );

  return (
    <View
      ref={itemRef}
      style={[
        styles.placedAsset,
        getPlacedAssetStyle(itemId, layout),
        { zIndex: isSelected ? 1000 : zIndex },
        mode === "edit" && isSelected && styles.editableItem,
      ]}
      {...(mode === "edit" ? dragResponder.panHandlers : {})}
    >
      <Image source={asset} style={[styles.placedAssetImage, baseStyle]} resizeMode="contain" />
      {mode === "edit" && isSelected && (
        <>
          <View style={[styles.handle, styles.rotateHandle]} {...rotateResponder.panHandlers} />
          <View style={[styles.handle, styles.resizeHandle]} {...resizeResponder.panHandlers} />
        </>
      )}
    </View>
  );
}

const ClassroomTraySlot = React.memo(function ClassroomTraySlot({
  item,
  onPlace,
  onDrop,
}: {
  item: TrayItem;
  onPlace: (id: string) => void;
  onDrop: (id: string, pageX: number, pageY: number) => void;
}) {
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dy) > 8 || Math.abs(gesture.dx) > 8,
        onPanResponderRelease: (_event, gesture) => {
          onDrop(item.id, gesture.moveX, gesture.moveY);
        },
        onPanResponderTerminate: () => undefined,
        onPanResponderTerminationRequest: () => false,
      }),
    [item.id, onDrop]
  );

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.traySlot}
      onPress={() => onPlace(item.id)}
      {...responder.panHandlers}
    >
      <Image source={item.asset} style={styles.trayAsset} resizeMode="contain" />
    </TouchableOpacity>
  );
});

const ClassroomTray = React.memo(function ClassroomTray({
  items,
  onPlace,
  onDrop,
}: {
  items: TrayItem[];
  onPlace: (id: string) => void;
  onDrop: (id: string, pageX: number, pageY: number) => void;
}) {
  if (items.length === 0) return null;

  return (
    <View style={styles.tray}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trayContent}
      >
        {items.map((item) => (
          <ClassroomTraySlot key={item.id} item={item} onPlace={onPlace} onDrop={onDrop} />
        ))}
      </ScrollView>
    </View>
  );
});

function BorderEditorLayer({
  borders,
  selectedId,
  brushSize,
  sceneWidth,
  sceneHeight,
  onChange,
  onSelect,
}: {
  borders: ClassroomBorder[];
  selectedId: string | null;
  brushSize: number;
  sceneWidth: number;
  sceneHeight: number;
  onChange: (borders: ClassroomBorder[]) => void;
  onSelect: (id: string | null) => void;
}) {
  const bordersRef = useRef(borders);
  const selectedRef = useRef(selectedId);
  const gesture = useRef<{
    mode: "draw" | "move" | "rotate";
    id: string;
    startX: number;
    startY: number;
    initial?: ClassroomBorder;
    startAngle?: number;
  } | null>(null);

  useEffect(() => {
    bordersRef.current = borders;
  }, [borders]);

  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  const hitBorder = useCallback((x: number, y: number) => {
    for (let i = bordersRef.current.length - 1; i >= 0; i -= 1) {
      const border = bordersRef.current[i];
      const box = borderAabb(border);
      const pad = 0.018;
      if (x >= box.x - pad && x <= box.x + box.w + pad && y >= box.y - pad && y <= box.y + box.h + pad) {
        return border;
      }
    }
    return undefined;
  }, []);

  const hitRotateHandle = useCallback((x: number, y: number) => {
    const selected = bordersRef.current.find((border) => border.id === selectedRef.current);
    if (!selected) return false;
    const hx = selected.x + selected.w;
    const hy = selected.y;
    return Math.hypot(x - hx, y - hy) < 0.05;
  }, []);

  const updateBorder = useCallback(
    (id: string, updater: (border: ClassroomBorder) => ClassroomBorder) => {
      onChange(bordersRef.current.map((border) => (border.id === id ? updater(border) : border)));
    },
    [onChange]
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const x = clamp(event.nativeEvent.locationX / sceneWidth, 0, 1);
          const y = clamp(event.nativeEvent.locationY / sceneHeight, 0, 1);
          if (hitRotateHandle(x, y)) {
            const selected = bordersRef.current.find((border) => border.id === selectedRef.current);
            if (selected) {
              onSelect(selected.id);
              gesture.current = {
                mode: "rotate",
                id: selected.id,
                startX: x,
                startY: y,
                initial: selected,
                startAngle: angleFromPoint(x, y, selected.x + selected.w / 2, selected.y + selected.h / 2),
              };
              return;
            }
          }
          const hit = hitBorder(x, y);
          if (hit) {
            onSelect(hit.id);
            gesture.current = { mode: "move", id: hit.id, startX: x, startY: y, initial: hit };
            return;
          }
          const id = `border-${Date.now()}`;
          onSelect(id);
          gesture.current = { mode: "draw", id, startX: x, startY: y };
          const h = brushSize / sceneHeight;
          const fresh = { id, x, y: y - h / 2, w: 0.012, h, rotation: 0 };
          onChange([...bordersRef.current, fresh]);
        },
        onPanResponderMove: (event) => {
          if (!gesture.current) return;
          const x = clamp(event.nativeEvent.locationX / sceneWidth, 0, 1);
          const y = clamp(event.nativeEvent.locationY / sceneHeight, 0, 1);
          const current = gesture.current;
          if (current.mode === "draw") {
            const dx = x - current.startX;
            const dy = y - current.startY;
            const length = Math.max(0.012, Math.hypot(dx, dy));
            const rotation = normalizeAngle((Math.atan2(dy, dx) * 180) / Math.PI);
            const h = brushSize / sceneHeight;
            updateBorder(current.id, () => ({
              id: current.id,
              x: current.startX,
              y: current.startY - h / 2,
              w: length,
              h,
              rotation,
            }));
            return;
          }
          if (current.mode === "move" && current.initial) {
            const dx = x - current.startX;
            const dy = y - current.startY;
            updateBorder(current.id, (border) => ({
              ...border,
              x: clamp((current.initial?.x ?? border.x) + dx, 0, 1 - border.w),
              y: clamp((current.initial?.y ?? border.y) + dy, 0, 1 - border.h),
            }));
            return;
          }
          if (current.mode === "rotate" && current.initial && current.startAngle !== undefined) {
            const cx = current.initial.x + current.initial.w / 2;
            const cy = current.initial.y + current.initial.h / 2;
            const nextAngle = angleFromPoint(x, y, cx, cy);
            updateBorder(current.id, () => ({
              ...current.initial!,
              rotation: normalizeAngle(current.initial!.rotation + shortestAngleDelta(current.startAngle!, nextAngle)),
            }));
          }
        },
        onPanResponderRelease: () => {
          gesture.current = null;
        },
        onPanResponderTerminate: () => {
          gesture.current = null;
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [brushSize, hitBorder, hitRotateHandle, onChange, onSelect, sceneHeight, sceneWidth, updateBorder]
  );

  return (
    <View style={StyleSheet.absoluteFill} {...responder.panHandlers}>
      {borders.map((border) => (
        <View
          key={border.id}
          pointerEvents="none"
          style={[
            styles.drawnBorder,
            selectedId === border.id && styles.drawnBorderSelected,
            {
              left: `${border.x * 100}%`,
              top: `${border.y * 100}%`,
              width: `${border.w * 100}%`,
              height: Math.max(6, border.h * sceneHeight),
              transform: [{ rotate: `${border.rotation}deg` }],
            },
          ]}
        >
          {selectedId === border.id && <View style={styles.borderRotateDot} />}
        </View>
      ))}
    </View>
  );
}

function BorderToolPanel({
  brushSize,
  borderCount,
  onBrushChange,
  onUndo,
  onSave,
  onArrange,
}: {
  brushSize: number;
  borderCount: number;
  onBrushChange: (size: number) => void;
  onUndo: () => void;
  onSave: () => void;
  onArrange: () => void;
}) {
  return (
    <View style={styles.borderPanel}>
      <Text style={styles.borderPanelTitle}>Draw Borders</Text>
      <View style={styles.borderPanelRow}>
        <TouchableOpacity style={styles.borderPanelButton} onPress={() => onBrushChange(Math.max(6, brushSize - 4))}>
          <Text style={styles.borderPanelText}>Brush -</Text>
        </TouchableOpacity>
        <Text style={styles.brushText}>{brushSize}px</Text>
        <TouchableOpacity style={styles.borderPanelButton} onPress={() => onBrushChange(Math.min(42, brushSize + 4))}>
          <Text style={styles.borderPanelText}>Brush +</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.borderPanelButton} onPress={onUndo}>
          <Text style={styles.borderPanelText}>Undo</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.borderPanelRow}>
        <Text style={styles.borderHint}>{borderCount} saved lines</Text>
        <TouchableOpacity style={[styles.borderPanelButton, styles.saveBorderButton]} onPress={onSave}>
          <Text style={styles.saveBorderText}>Save Borders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.borderPanelButton} onPress={onArrange}>
          <Text style={styles.borderPanelText}>Arrange</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GravityPanel({
  amount,
  angle,
  showBorders,
  customBorders,
  onEditBorders,
  onChange,
}: {
  amount: number;
  angle: number;
  showBorders: boolean;
  customBorders: ClassroomBorder[];
  onEditBorders: () => void;
  onChange: (meta: ReturnType<typeof getSceneMeta>) => void;
}) {
  const dialRef = useRef<View>(null);
  const sliderRef = useRef<View>(null);
  const dialCenter = useRef({ x: 0, y: 0 });
  const sliderLeft = useRef(0);
  const sliderWidth = useRef(1);

  const commit = useCallback(
    (next: Partial<{ gravityAmount: number; gravityAngle: number; showBorders: boolean }>) => {
      onChange({
        gravityAmount: next.gravityAmount ?? amount,
        gravityAngle: snapGravityAngle(next.gravityAngle ?? angle),
        showBorders: next.showBorders ?? showBorders,
        customBorders,
      });
    },
    [amount, angle, customBorders, onChange, showBorders]
  );

  const dialResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          dialRef.current?.measureInWindow((x, y, width, height) => {
            dialCenter.current = { x: x + width / 2, y: y + height / 2 };
            commit({
              gravityAngle: angleFromPoint(
                event.nativeEvent.pageX,
                event.nativeEvent.pageY,
                dialCenter.current.x,
                dialCenter.current.y
              ),
            });
          });
        },
        onPanResponderMove: (event) => {
          commit({
            gravityAngle: angleFromPoint(
              event.nativeEvent.pageX,
              event.nativeEvent.pageY,
              dialCenter.current.x,
              dialCenter.current.y
            ),
          });
        },
      }),
    [commit]
  );

  const sliderResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          sliderRef.current?.measureInWindow((x, _y, width) => {
            sliderLeft.current = x;
            sliderWidth.current = Math.max(1, width);
            commit({ gravityAmount: clamp((event.nativeEvent.pageX - x) / Math.max(1, width), 0, 1) });
          });
        },
        onPanResponderMove: (event) => {
          commit({ gravityAmount: clamp((event.nativeEvent.pageX - sliderLeft.current) / sliderWidth.current, 0, 1) });
        },
      }),
    [commit]
  );

  return (
    <View style={styles.gravityPanel}>
      <View ref={dialRef} style={styles.gravityDial} {...dialResponder.panHandlers}>
        <Image source={UI_ASSETS.gravityControllerShell} style={styles.gravityShellAsset} resizeMode="contain" />
        <Image source={UI_ASSETS.gravityControllerDial} style={styles.gravityDialAsset} resizeMode="contain" />
        <View style={[styles.gravityArmContainer, { transform: [{ rotate: `${angle}deg` }] }]}>
          <Image source={UI_ASSETS.gravityControllerArm} style={styles.gravityArmAsset} resizeMode="contain" />
        </View>
      </View>
      <View style={styles.gravityMiddle}>
        <View style={styles.gravityTitleRow}>
          <Text style={styles.gravityTitle}>Gravity</Text>
          <TouchableOpacity activeOpacity={0.82} style={styles.borderToggle} onPress={onEditBorders}>
            <Text style={styles.borderToggleText}>Draw</Text>
          </TouchableOpacity>
        </View>
        <View ref={sliderRef} style={styles.gravitySlider} {...sliderResponder.panHandlers}>
          <View style={[styles.gravitySliderFill, { width: `${amount * 100}%` }]} />
        </View>
      </View>
      <Text style={styles.gravityAmount}>{Math.round(amount * 100)}</Text>
    </View>
  );
}

export function ClassroomScene({
  ownedItems,
  equippedItems,
  avatar,
  savedLayout,
  onLayoutChange,
  onDone,
  mode = "view",
}: {
  ownedItems: string[];
  equippedItems: Record<string, string>;
  avatar?: string | null;
  savedLayout: ClassroomLayoutMap;
  onLayoutChange?: (layout: ClassroomLayoutMap) => void;
  onDone?: () => void;
  mode?: SceneMode;
}) {
  const pathname = usePathname();
  const sceneWidth = mode === "edit" ? FULL_EDITOR_W : CLASSROOM_SCENE_W;
  const sceneHeight = mode === "edit" ? FULL_EDITOR_H : CLASSROOM_SCENE_H;
  const [layout, setLayout] = useState<ClassroomLayoutMap>(() => ({ ...DEFAULT_ITEM_LAYOUT, ...savedLayout }));
  const sceneHostRef = useRef<View>(null);
  const sceneFrameRef = useRef({ x: 0, y: 0, w: sceneWidth, h: sceneHeight });
  const layoutRef = useRef(layout);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const activeGestureIdRef = useRef<string | null>(null);
  const [editorTool, setEditorTool] = useState<EditorTool>("arrange");
  const [selectedBorderId, setSelectedBorderId] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(14);
  const sceneMeta = getSceneMeta(layout);
  const sceneMetaRef = useRef(sceneMeta);
  const editableLayersRef = useRef<EditableLayer[]>([]);
  const ownedClassroomItems = useMemo(
    () => SHOP_ITEMS.filter((item) => item.category === "classroom" && ownedItems.includes(item.id)),
    [ownedItems]
  );
  const visibleClassroomItems = useMemo(
    () => ownedClassroomItems.filter((item) => !layout[item.id]?.inTray),
    [layout, ownedClassroomItems]
  );
  const traySignature = useMemo(
    () => ownedClassroomItems.map((item) => `${item.id}:${layout[item.id]?.inTray ? 1 : 0}`).join("|"),
    [layout, ownedClassroomItems]
  );
  const trayItems = useMemo<TrayItem[]>(
    () =>
      ownedClassroomItems.flatMap((item) => {
        if (!layout[item.id]?.inTray) return [];
        const asset = getClassroomItemAsset(item.id);
        return asset ? [{ id: item.id, asset }] : [];
      }),
    [ownedClassroomItems, traySignature]
  );
  const hatAsset = getClassroomStudentAsset(equippedItems.hat);
  const accessoryAsset = getClassroomStudentAsset(equippedItems.accessory);
  const backpackAsset = equippedItems.accessory === "backpack" ? accessoryAsset : undefined;
  const frontAccessoryAsset = equippedItems.accessory === "backpack" ? undefined : accessoryAsset;
  const characterAsset = getClassroomCharacterAsset(avatar);
  const hatLayerId = equippedItems.hat ? `hat:${equippedItems.hat}` : undefined;
  const backpackLayerId = equippedItems.accessory === "backpack" ? `accessory:${equippedItems.accessory}` : undefined;
  const frontAccessoryLayerId =
    equippedItems.accessory && equippedItems.accessory !== "backpack"
      ? `accessory:${equippedItems.accessory}`
      : undefined;

  useEffect(() => {
    const nextLayout = { ...DEFAULT_ITEM_LAYOUT, ...savedLayout };
    setLayout(nextLayout);
    layoutRef.current = nextLayout;
  }, [savedLayout]);

  const editableLayers = useMemo<EditableLayer[]>(() => {
    const layers: EditableLayer[] = visibleClassroomItems.flatMap((item) => {
      const asset = getClassroomItemAsset(item.id);
      if (!asset) return [];
      return [{
        id: item.id,
        asset,
        layout: layout[item.id] ?? getDefaultLayout(item.id),
        zIndex: 30,
      }];
    });

    if (mode === "edit" || mode === "view") {
      if (backpackAsset && backpackLayerId) {
        layers.push({
          id: backpackLayerId,
          asset: backpackAsset,
          layout: layout[backpackLayerId] ?? getDefaultLayout(backpackLayerId),
          zIndex: 88,
        });
      }
      layers.push({
        id: "student",
        asset: characterAsset,
        layout: layout.student ?? getDefaultLayout("student"),
        zIndex: 90,
      });
      if (hatAsset && hatLayerId) {
        layers.push({
          id: hatLayerId,
          asset: hatAsset,
          layout: layout[hatLayerId] ?? getDefaultLayout(hatLayerId),
          zIndex: 122,
        });
      }
      if (frontAccessoryAsset && frontAccessoryLayerId) {
        layers.push({
          id: frontAccessoryLayerId,
          asset: frontAccessoryAsset,
          layout: layout[frontAccessoryLayerId] ?? getDefaultLayout(frontAccessoryLayerId),
          zIndex: 123,
        });
      }
    }

    return layers;
  }, [
    backpackAsset,
    backpackLayerId,
    characterAsset,
    frontAccessoryAsset,
    frontAccessoryLayerId,
    hatAsset,
    hatLayerId,
    layout,
    mode,
    visibleClassroomItems,
  ]);
  useEffect(() => {
    sceneMetaRef.current = sceneMeta;
    editableLayersRef.current = editableLayers;
  }, [editableLayers, sceneMeta]);

  const applyLayout = useCallback((updater: (prev: ClassroomLayoutMap) => ClassroomLayoutMap) => {
    setLayout((prev) => {
      const next = updater(prev);
      layoutRef.current = next;
      return next;
    });
  }, []);

  const setActiveGestureId = useCallback((id: string | null) => {
    activeGestureIdRef.current = id;
  }, []);

  const commitLayout = useCallback(() => {
    if (!onLayoutChange) return;
    const trimmed: ClassroomLayoutMap = {};
    const savedIds = [...ownedClassroomItems.map((item) => item.id), "student"];
    if (hatLayerId) savedIds.push(hatLayerId);
    if (backpackLayerId) savedIds.push(backpackLayerId);
    if (frontAccessoryLayerId) savedIds.push(frontAccessoryLayerId);
    for (const id of savedIds) {
      trimmed[id] = normalizeLayout(layoutRef.current[id] ?? getDefaultLayout(id));
    }
    trimmed[CLASSROOM_META_ID] = layoutRef.current[CLASSROOM_META_ID] ?? withSceneMeta({}, getSceneMeta(layoutRef.current))[CLASSROOM_META_ID];
    onLayoutChange({ ...savedLayout, ...trimmed });
  }, [backpackLayerId, frontAccessoryLayerId, hatLayerId, onLayoutChange, ownedClassroomItems, savedLayout]);

  const updateSceneMeta = useCallback(
    (meta: ReturnType<typeof getSceneMeta>) => {
      applyLayout((prev) => withSceneMeta(prev, meta));
      if (mode !== "edit") requestAnimationFrame(commitLayout);
    },
    [applyLayout, commitLayout, mode]
  );

  const updateCustomBorders = useCallback(
    (customBorders: ClassroomBorder[]) => {
      updateSceneMeta({ ...getSceneMeta(layoutRef.current), customBorders, showBorders: true });
    },
    [updateSceneMeta]
  );

  useEffect(() => {
    if (mode !== "view" || pathname.includes("classroom-edit") || sceneMeta.gravityAmount <= 0) return;
    const interval = setInterval(() => {
      const meta = sceneMetaRef.current;
      const angleRad = (meta.gravityAngle * Math.PI) / 180;
      const gravityStrength = Math.pow(meta.gravityAmount, 1.2);
      const step = 0.0008 + gravityStrength * 0.061;
      const dx = Math.cos(angleRad) * step;
      const dy = Math.sin(angleRad) * step;
      applyLayout((prev) => {
        let next = prev;
        const layers = editableLayersRef.current;
        for (const layer of layers) {
          const current = next[layer.id] ?? getDefaultLayout(layer.id);
          if (current.inTray) continue;
          const attempted = clampLayout(layer.id, { ...current, x: current.x + dx, y: current.y + dy });
          const moved = resolveBorderCollisions(
            layer.id,
            attempted,
            dx,
            dy,
            meta.customBorders
          );
          if (isNearlySameLayout(moved, current)) continue;
          next = { ...next, [layer.id]: moved };
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [
    applyLayout,
    mode,
    pathname,
    sceneMeta.gravityAmount,
    sceneMeta.gravityAngle,
  ]);

  useEffect(() => {
    if (mode !== "view" || pathname.includes("classroom-edit") || sceneMeta.gravityAmount <= 0 || !onLayoutChange) return;
    const interval = setInterval(commitLayout, 1000);
    return () => clearInterval(interval);
  }, [commitLayout, mode, onLayoutChange, pathname, sceneMeta.gravityAmount]);

  const placeFromTray = useCallback(
    (id: string, x = 0.42, y = 0.48) => {
      const placed = clampLayout(id, {
        ...getDefaultLayout(id),
        x,
        y,
        inTray: false,
      });
      applyLayout((prev) => ({ ...prev, [id]: placed }));
      setSelectedLayerId(id);
      if (mode !== "edit") setTimeout(commitLayout, 80);
    },
    [applyLayout, commitLayout, mode]
  );

  const saveAndDone = useCallback(() => {
    commitLayout();
    onDone?.();
  }, [commitLayout, onDone]);

  const dropFromTray = useCallback(
    (id: string, pageX: number, pageY: number) => {
      const frame = sceneFrameRef.current;
      const overScene =
        pageX >= frame.x &&
        pageX <= frame.x + frame.w &&
        pageY >= frame.y &&
        pageY <= frame.y + frame.h;
      if (!overScene) return;
      const itemSize = getItemSize(id, getDefaultLayout(id));
      const x = clamp((pageX - frame.x) / frame.w - itemSize.w / 2, 0.01, 0.99 - itemSize.w);
      const y = clamp((pageY - frame.y) / frame.h - itemSize.h / 2, 0.015, 0.985 - itemSize.h);
      placeFromTray(id, x, y);
    },
    [placeFromTray]
  );

  const getSceneFrame = useCallback(() => sceneFrameRef.current, []);

  const scene = (
    <View
      ref={sceneHostRef}
      onLayout={() => {
        sceneHostRef.current?.measureInWindow((x, y, w, h) => {
          sceneFrameRef.current = { x, y, w, h };
        });
      }}
    >
      <ImageBackground
        source={CLASSROOM_BACKGROUND}
        style={[
          styles.scene,
          mode === "edit" ? styles.fullScene : styles.cardScene,
          { width: sceneWidth, height: sceneHeight },
        ]}
        imageStyle={mode === "edit" ? undefined : styles.sceneImage}
        resizeMode="cover"
      >
        {editorTool !== "borders" &&
          editableLayers.map((layer) => (
            <PlacedClassroomItem
              key={layer.id}
              itemId={layer.id}
              asset={layer.asset}
              baseStyle={layer.baseStyle}
              layout={layer.layout}
              mode={mode}
              sceneWidth={sceneWidth}
              sceneHeight={sceneHeight}
              isSelected={selectedLayerId === layer.id}
              zIndex={layer.zIndex}
              onSelect={setSelectedLayerId}
              onGestureActiveChange={setActiveGestureId}
              getSceneFrame={getSceneFrame}
              applyLayout={applyLayout}
              onCommit={mode === "edit" ? undefined : commitLayout}
            />
          ))}
        {mode === "edit" && editorTool === "borders" && (
          <BorderEditorLayer
            borders={sceneMeta.customBorders}
            selectedId={selectedBorderId}
            brushSize={brushSize}
            sceneWidth={sceneWidth}
            sceneHeight={sceneHeight}
            onChange={updateCustomBorders}
            onSelect={setSelectedBorderId}
          />
        )}
      </ImageBackground>
    </View>
  );

  if (mode === "edit") {
    return (
      <View style={styles.editorWrap}>
        {scene}
        {editorTool === "arrange" ? (
          <>
            <ClassroomTray items={trayItems} onPlace={placeFromTray} onDrop={dropFromTray} />
            <GravityPanel
              amount={sceneMeta.gravityAmount}
              angle={sceneMeta.gravityAngle}
              showBorders={sceneMeta.showBorders}
              customBorders={sceneMeta.customBorders}
              onEditBorders={() => {
                setSelectedLayerId(null);
                setEditorTool("borders");
              }}
              onChange={updateSceneMeta}
            />
          </>
        ) : (
          <BorderToolPanel
            brushSize={brushSize}
            borderCount={sceneMeta.customBorders.length}
            onBrushChange={setBrushSize}
            onUndo={() => updateCustomBorders(sceneMeta.customBorders.slice(0, -1))}
            onSave={() => {
              setEditorTool("arrange");
            }}
            onArrange={() => setEditorTool("arrange")}
          />
        )}
        {editorTool === "arrange" && (
          <TouchableOpacity style={styles.doneArrangeButton} activeOpacity={0.88} onPress={saveAndDone}>
            <Text style={styles.doneArrangeText}>Done Arranging</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return scene;
}

const styles = StyleSheet.create({
  scene: { overflow: "hidden", backgroundColor: "#18132F" },
  editorWrap: {
    width: FULL_EDITOR_W,
    alignItems: "center",
    gap: 10,
  },
  cardScene: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(124,111,255,0.26)",
  },
  fullScene: { borderRadius: 0 },
  sceneImage: { borderRadius: 24 },
  devBorder: {
    position: "absolute",
    backgroundColor: "rgba(0,217,163,0.18)",
    borderColor: "rgba(0,217,163,0.88)",
    borderWidth: 1,
    borderRadius: 3,
    zIndex: 18,
  },
  drawnBorder: {
    position: "absolute",
    backgroundColor: "rgba(0,217,163,0.62)",
    borderRadius: 999,
    zIndex: 150,
  },
  drawnBorderSelected: {
    backgroundColor: "rgba(255,205,83,0.8)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.76)",
  },
  borderRotateDot: {
    position: "absolute",
    right: -14,
    top: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(124,111,255,0.88)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },
  placedAsset: { position: "absolute", zIndex: 30 },
  placedAssetImage: { width: "100%", height: "100%" },
  editableItem: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  handle: {
    position: "absolute",
    top: -HANDLE_SIZE / 2,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    backgroundColor: "rgba(255,255,255,0.28)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
  },
  rotateHandle: { left: -HANDLE_SIZE / 2, borderRadius: HANDLE_SIZE / 2 },
  resizeHandle: { right: -HANDLE_SIZE / 2, borderRadius: 5 },
  tray: {
    width: "100%",
    height: 86,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(124,111,255,0.28)",
    backgroundColor: "rgba(8,8,24,0.92)",
    justifyContent: "center",
  },
  trayContent: {
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 10,
  },
  traySlot: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  trayAsset: { width: 52, height: 52 },
  doneArrangeButton: {
    minWidth: 220,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "#10D7A7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10D7A7",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  doneArrangeText: {
    color: "#03100D",
    fontSize: 18,
    fontWeight: "900",
  },
  gravityPanel: {
    width: "100%",
    minHeight: 82,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(8,8,24,0.95)",
    borderTopWidth: 1,
    borderColor: "rgba(124,111,255,0.28)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  gravityDial: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  gravityShellAsset: {
    position: "absolute",
    width: 78,
    height: 78,
  },
  gravityDialAsset: {
    position: "absolute",
    width: 52,
    height: 52,
  },
  gravityArmContainer: {
    position: "absolute",
    width: 52,
    height: 52,
  },
  gravityArmAsset: {
    position: "absolute",
    left: 20,
    top: 18,
    width: 38,
    height: 16,
  },
  gravityMiddle: { flex: 1, gap: 8 },
  gravityTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  gravityTitle: { color: "#F6F4FF", fontSize: 15, fontWeight: "800" },
  borderToggle: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  borderToggleOn: { borderColor: "#00D9A3", backgroundColor: "rgba(0,217,163,0.16)" },
  borderToggleText: { color: "#F6F4FF", fontSize: 12, fontWeight: "800" },
  gravitySlider: {
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  gravitySliderFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#7C6FFF",
  },
  gravityAmount: { width: 34, color: "#FFCD53", fontSize: 16, fontWeight: "900", textAlign: "right" },
  borderPanel: {
    width: "100%",
    minHeight: 140,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(8,8,24,0.96)",
    borderTopWidth: 1,
    borderColor: "rgba(124,111,255,0.28)",
    gap: 10,
  },
  borderPanelTitle: { color: "#F6F4FF", fontSize: 16, fontWeight: "900" },
  borderPanelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  borderPanelButton: {
    minHeight: 42,
    borderRadius: 13,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  borderPanelText: { color: "#F6F4FF", fontSize: 13, fontWeight: "900" },
  brushText: { minWidth: 48, color: "#FFCD53", fontSize: 14, fontWeight: "900", textAlign: "center" },
  borderHint: { flex: 1, color: "#A7A3C6", fontSize: 13, fontWeight: "800" },
  saveBorderButton: { backgroundColor: "#00D9A3", borderColor: "#00D9A3" },
  saveBorderText: { color: "#050512", fontSize: 13, fontWeight: "900" },
  studentAnchor: {
    position: "absolute",
    left: "39.5%",
    bottom: "1.25%",
    width: "21%",
    height: "40.5%",
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 90,
  },
  studentBase: { position: "absolute", left: 0, bottom: 0, width: "100%", height: "100%", zIndex: 2 },
  studentHat: { position: "absolute", left: "20%", top: "8%", width: "60%", height: "26%", zIndex: 4 },
  studentAccessory: { position: "absolute", left: "55%", top: "47%", width: "35%", height: "22%", zIndex: 5 },
});

const wearablePlacement = StyleSheet.create({
  top_hat: { left: "27%", top: "3%", width: "46%", height: "22%" },
  party_hat: { left: "36%", top: "-6%", width: "28%", height: "31%" },
  cowboy_hat: { left: "14%", top: "4%", width: "72%", height: "22%" },
  grad_cap: { left: "18%", top: "3%", width: "64%", height: "21%" },
  wizard_hat: { left: "24%", top: "-9%", width: "52%", height: "40%" },
  crown: { left: "31%", top: "1%", width: "38%", height: "20%" },
  sunglasses: { left: "29%", top: "31%", width: "42%", height: "13%" },
  headphones: { left: "22%", top: "20%", width: "56%", height: "31%" },
  star_badge: { left: "59%", top: "55%", width: "24%", height: "20%" },
  medal: { left: "56%", top: "50%", width: "28%", height: "27%" },
  backpack: { left: "4%", top: "43%", width: "45%", height: "38%", zIndex: 1 },
});
