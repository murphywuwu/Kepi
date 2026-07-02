/** Cross-layer shared types. */

export type ScenePhase =
  | "prep"
  | "opening_buff"
  | "battle"
  | "settlement"
  | "pawn_shop"
  | "campfire"
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
  BattleOpeningBuffState,
  CampfireRuntime,
} from "./game";

export type {
  JourneyDefinition,
  JourneyNode,
  JourneyNodeType,
} from "./journey";
