export type GestureInputMode = "pointer" | "gesture";

export type GestureCameraStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable"
  | "failed";

export type GestureIntentType =
  | "SWIPE_LEFT"
  | "SWIPE_RIGHT"
  | "AIM"
  | "GRAB"
  | "HOLD_START"
  | "HOLD_PROGRESS"
  | "HOLD_COMPLETE";

export type GesturePoint = {
  x: number;
  y: number;
};

export type GestureIntent = {
  type: GestureIntentType;
  point?: GesturePoint;
  progress?: number;
};

export type PointerGestureOptions = {
  disabled?: boolean;
  swipeThreshold?: number;
  longPressMs?: number;
  longPressMoveTolerance?: number;
  onIntent: (intent: GestureIntent) => void;
};
