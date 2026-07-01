/** Cross-layer shared types. */

export type ScenePhase =
  | "prep"
  | "battle"
  | "settlement"
  | "ending"
  | "settings";

export type {
  BattleEvent,
  BattleInput,
  BattleResult,
  BattleSnapshot,
  BoardPosition,
  Enemy,
  EnemyType,
  GameAction,
  EndingType,
  GameResult,
  GameSnapshot,
  GameState,
  HomeRepairMilestone,
  HomeRepairTier,
  Piece,
  PieceStar,
  PieceType,
  RangeType,
  SettlementSummary,
  ShopState,
  TulouBattleBuffs,
  WaterGuestBattleState,
} from "./game";
