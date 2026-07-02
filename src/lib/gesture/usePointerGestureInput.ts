"use client";

import { useCallback, useRef, useState } from "react";
import type React from "react";
import type {
  GesturePoint,
  PointerGestureOptions,
} from "./types";
import {
  holdProgressFromElapsed,
  isLongPressWithinMoveTolerance,
  POINTER_GESTURE_DEFAULTS,
  swipeIntentFromDelta,
} from "./pointerIntent";

const HOLD_PROGRESS_INTERVAL_MS = 50;

function pointFromEvent(event: React.PointerEvent<HTMLElement>): GesturePoint {
  return { x: event.clientX, y: event.clientY };
}

export function usePointerGestureInput({
  disabled = false,
  swipeThreshold = POINTER_GESTURE_DEFAULTS.swipeThreshold,
  longPressMs = POINTER_GESTURE_DEFAULTS.longPressMs,
  longPressMoveTolerance = POINTER_GESTURE_DEFAULTS.longPressMoveTolerance,
  onIntent,
}: PointerGestureOptions) {
  const startPointRef = useRef<GesturePoint | null>(null);
  const holdStartedRef = useRef(false);
  const holdCompletedRef = useRef(false);
  const holdStartMsRef = useRef(0);
  const holdTimerRef = useRef<number | null>(null);
  const holdProgressRef = useRef<number | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [activePoint, setActivePoint] = useState<GesturePoint | null>(null);

  const clearHoldTimers = useCallback(() => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdProgressRef.current) {
      window.clearInterval(holdProgressRef.current);
      holdProgressRef.current = null;
    }
  }, []);

  const resetHold = useCallback(() => {
    clearHoldTimers();
    holdStartedRef.current = false;
    holdCompletedRef.current = false;
    holdStartMsRef.current = 0;
    setHoldProgress(0);
    setIsHolding(false);
  }, [clearHoldTimers]);

  const cancelIfMovedTooFar = useCallback(
    (point: GesturePoint) => {
      const startPoint = startPointRef.current;
      if (!startPoint || holdCompletedRef.current) return;
      if (isLongPressWithinMoveTolerance(startPoint, point, longPressMoveTolerance)) {
        return;
      }
      clearHoldTimers();
      holdStartedRef.current = false;
      setHoldProgress(0);
      setIsHolding(false);
    },
    [clearHoldTimers, longPressMoveTolerance],
  );

  const bind = {
    onPointerDown: useCallback(
      (event: React.PointerEvent<HTMLElement>) => {
        if (disabled) return;
        const point = pointFromEvent(event);
        startPointRef.current = point;
        setActivePoint(point);
        resetHold();
        event.currentTarget.setPointerCapture(event.pointerId);

        holdStartMsRef.current = window.performance.now();
        holdStartedRef.current = true;
        setIsHolding(true);
        onIntent({ type: "HOLD_START", point, progress: 0 });

        holdProgressRef.current = window.setInterval(() => {
          const elapsed = window.performance.now() - holdStartMsRef.current;
          const progress = holdProgressFromElapsed(elapsed, longPressMs);
          setHoldProgress(progress);
          onIntent({ type: "HOLD_PROGRESS", point, progress });
        }, HOLD_PROGRESS_INTERVAL_MS);

        holdTimerRef.current = window.setTimeout(() => {
          holdCompletedRef.current = true;
          setHoldProgress(1);
          clearHoldTimers();
          onIntent({ type: "HOLD_COMPLETE", point, progress: 1 });
        }, longPressMs);
      },
      [clearHoldTimers, disabled, longPressMs, onIntent, resetHold],
    ),
    onPointerMove: useCallback(
      (event: React.PointerEvent<HTMLElement>) => {
        if (disabled) return;
        const point = pointFromEvent(event);
        setActivePoint(point);
        onIntent({ type: "AIM", point });
        cancelIfMovedTooFar(point);
      },
      [cancelIfMovedTooFar, disabled, onIntent],
    ),
    onPointerUp: useCallback(
      (event: React.PointerEvent<HTMLElement>) => {
        if (disabled || !startPointRef.current) return;
        const point = pointFromEvent(event);
        const startPoint = startPointRef.current;
        const deltaX = point.x - startPoint.x;
        const swipeIntent = swipeIntentFromDelta(deltaX, swipeThreshold);
        const wasHoldCompleted = holdCompletedRef.current;
        clearHoldTimers();

        if (swipeIntent) {
          onIntent({
            type: swipeIntent,
            point,
          });
        } else if (!wasHoldCompleted) {
          onIntent({ type: "GRAB", point });
        }

        startPointRef.current = null;
        holdStartedRef.current = false;
        holdCompletedRef.current = false;
        setHoldProgress(0);
        setIsHolding(false);
      },
      [clearHoldTimers, disabled, onIntent, swipeThreshold],
    ),
    onPointerCancel: useCallback(() => {
      startPointRef.current = null;
      setActivePoint(null);
      resetHold();
    }, [resetHold]),
    onPointerLeave: useCallback(() => {
      setActivePoint(null);
    }, []),
  };

  return {
    bind,
    activePoint,
    holdProgress,
    isHolding,
  };
}
