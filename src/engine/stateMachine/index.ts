import type { GameAction, GameSnapshot, ScenePhase } from "@/types";

const PREP_ACTIONS = new Set<GameAction["type"]>([
  "BUY_PIECE",
  "SELL_PIECE",
  "MOVE_PIECE",
  "REFRESH_SHOP",
  "BUY_POPULATION",
  "PAWN_KEBI",
  "BORROW_AGAINST_RETURN",
  "START_BATTLE",
]);

const OPENING_BUFF_ACTIONS = new Set<GameAction["type"]>([
  "CATCH_OPENING_BUFF",
  "SKIP_OPENING_BUFF",
]);

const BATTLE_ACTIONS = new Set<GameAction["type"]>(["BATTLE_TICK", "END_BATTLE"]);

const SETTLEMENT_ACTIONS = new Set<GameAction["type"]>([
  "ADVANCE_STAGE",
  "ADVANCE_JOURNEY",
  "APPLY_HOME_REPAIR",
]);

const PAWN_SHOP_ACTIONS = new Set<GameAction["type"]>([
  "PAWN_KEBI",
  "BORROW_AGAINST_RETURN",
  "LEAVE_PAWN_SHOP",
]);

const CAMPFIRE_ACTIONS = new Set<GameAction["type"]>(["PICK_CAMPFIRE_CHOICE"]);

export function canApplyAction(
  snapshot: GameSnapshot,
  action: GameAction,
): boolean {
  if (action.type === "LOAD_SNAPSHOT") return true;

  const phase = snapshot.phase;
  if (phase === "prep") return PREP_ACTIONS.has(action.type);
  if (phase === "opening_buff") return OPENING_BUFF_ACTIONS.has(action.type);
  if (phase === "battle") return BATTLE_ACTIONS.has(action.type);
  if (phase === "settlement") return SETTLEMENT_ACTIONS.has(action.type);
  if (phase === "pawn_shop") return PAWN_SHOP_ACTIONS.has(action.type);
  if (phase === "campfire") return CAMPFIRE_ACTIONS.has(action.type);
  return false;
}

export function transitionPhase(
  snapshot: GameSnapshot,
  phase: ScenePhase,
): GameSnapshot {
  return { ...snapshot, phase };
}

export function cloneSnapshot(snapshot: GameSnapshot): GameSnapshot {
  return structuredClone(snapshot);
}
