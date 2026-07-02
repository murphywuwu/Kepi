import type {
  GestureIntentType,
  GesturePoint,
} from "./types";

export const POINTER_GESTURE_DEFAULTS = {
  swipeThreshold: 48,
  longPressMs: 850,
  longPressMoveTolerance: 12,
} as const;

export function gestureDistance(a: GesturePoint, b: GesturePoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function swipeIntentFromDelta(
  deltaX: number,
  threshold = POINTER_GESTURE_DEFAULTS.swipeThreshold,
): Extract<GestureIntentType, "SWIPE_LEFT" | "SWIPE_RIGHT"> | null {
  if (Math.abs(deltaX) < threshold) return null;
  return deltaX < 0 ? "SWIPE_LEFT" : "SWIPE_RIGHT";
}

export function holdProgressFromElapsed(
  elapsedMs: number,
  longPressMs = POINTER_GESTURE_DEFAULTS.longPressMs,
): number {
  if (longPressMs <= 0) return 1;
  return Math.max(0, Math.min(1, elapsedMs / longPressMs));
}

export function isLongPressWithinMoveTolerance(
  start: GesturePoint,
  current: GesturePoint,
  tolerance = POINTER_GESTURE_DEFAULTS.longPressMoveTolerance,
): boolean {
  return gestureDistance(start, current) <= tolerance;
}
