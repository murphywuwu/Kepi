import type { ScenePhase } from "./index";

export type GameResult = "playing" | "win" | "lose" | null;

/** V2.0 three endings — set when phase becomes `ending`. */
export type EndingType =
  | "perfect_homecoming"
  | "regretful_stay"
  | "storm_rescue";

export type PieceType =
  | "farmer"
  | "guard"
  | "teacher"
  | "fengshui"
  | "patriarch"
  | "shuike"
  | "xiangxian";

export type PieceStar = 1 | 2;

export type EnemyType =
  | "qianhaibei"
  | "luyinguanli"
  | "zhuzaiqi"
  | "ehushan"
  | "hongtouchuan"
  | "xiedouhuo";

export type RangeType = "melee" | "mid" | "ranged";

export type BoardPosition = { x: number; y: number };

export type HomeRepairTier = 0 | 1 | 2 | 3;

export type HomeRepairMilestone = 33 | 66 | 99;

export type GameState = {
  stage: number;
  totalStages: number;
  survival: number;
  kebi: number;
  kebiThreshold: number;
  sangzi: number;
  homeRepair: number;
  /** Derived from homeRepair thresholds (0=破败 … 3=焕然). */
  homeRepairTier: HomeRepairTier;
  gold: number;
  population: number;
  /** UI display only — no longer affects gold income in V2.0. */
  winStreak: number;
  /** UI display only — no longer affects gold income in V2.0. */
  loseStreak: number;
  /** Cumulative letters pawned for gold (Feature B). */
  pawnedKebi: number;
  /** Letters pawned during the current prep→battle round (Feature H). */
  roundPawnCount: number;
  result: GameResult;
  /** Explicit ending branch when `phase === "ending"`. */
  endingType: EndingType | null;
};

export type WaterGuestBattleState = {
  pieceId: string | null;
  deployed: boolean;
  survived: boolean;
  died: boolean;
};

export type SettlementSummary = {
  won: boolean;
  kebiGained: number;
  sangziGained: number;
  sangziConsumed: number;
  homeRepairBefore: number;
  homeRepairGained: number;
  homeRepairAfter: number;
  survivalLost: number;
  waterGuestDeployed: boolean;
  waterGuestSurvived: boolean;
  waterGuestDied: boolean;
  xiangxianBonusApplied: boolean;
  /** Crossed 33 / 66 / 99 repair threshold this settlement, if any. */
  homeRepairMilestone: HomeRepairMilestone | null;
};

export type Piece = {
  id: string;
  type: PieceType;
  cost: number;
  star: PieceStar;
  hp: number;
  maxHp: number;
  atk: number;
  atkSpeed: number;
  armor: number;
  range: RangeType;
  clan: string;
  position: BoardPosition | null;
};

export type Enemy = {
  id: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  atk: number;
  atkSpeed: number;
  armor: number;
  range: RangeType;
  position: BoardPosition;
};

export type BattleEvent =
  | { type: "attack"; sourceId: string; targetId: string; damage: number }
  | { type: "kill"; unitId: string }
  | { type: "skill"; sourceId: string; skillId: string }
  | { type: "roundEnd" }
  | { type: "waterGuestSurvived" }
  | { type: "waterGuestDied" };

export type TulouBattleBuffs = {
  tier: HomeRepairTier;
  shieldHp: Record<string, number>;
  cheatDeathAvailable: string[];
  invincibleUntil: Record<string, number>;
};

export type BattleSnapshot = {
  tick: number;
  elapsedMs: number;
  allies: Piece[];
  enemies: Enemy[];
  events: BattleEvent[];
  cooldowns?: Record<string, number>;
  finished?: boolean;
  waterGuest: WaterGuestBattleState;
  tulouBuffs: TulouBattleBuffs;
};

export type BattleResult = {
  won: boolean;
  tick: number;
  elapsedMs: number;
  events: BattleEvent[];
  alliesRemaining: number;
  enemiesRemaining: number;
  allyHpPercent: number;
  enemyHpPercent: number;
  waterGuest: WaterGuestBattleState;
};

export type BattleInput = {
  stage: number;
  allies: Piece[];
  enemies?: Enemy[];
  homeRepairTier?: HomeRepairTier;
};

export type ShopState = {
  slots: PieceType[];
  refreshCost: number;
};

export type GameSnapshot = {
  version: number;
  phase: ScenePhase;
  state: GameState;
  board: Piece[];
  shop: ShopState;
  battle?: BattleSnapshot | null;
  lastBattleResult?: BattleResult | null;
  settlement?: SettlementSummary | null;
};

export type GameAction =
  | { type: "BUY_PIECE"; pieceType: PieceType }
  | { type: "SELL_PIECE"; pieceId: string }
  | { type: "MOVE_PIECE"; pieceId: string; position: BoardPosition }
  | { type: "REFRESH_SHOP" }
  | { type: "BUY_POPULATION" }
  | { type: "PAWN_KEBI" }
  | { type: "START_BATTLE" }
  | { type: "BATTLE_TICK" }
  | { type: "END_BATTLE" }
  | { type: "APPLY_HOME_REPAIR" }
  | { type: "ADVANCE_STAGE" }
  | { type: "LOAD_SNAPSHOT"; snapshot: GameSnapshot };
