import type {
  BattleEvent,
  BattleInput,
  BattleResult,
  BattleSnapshot,
  Enemy,
  EnemyType,
  HomeRepairTier,
  Piece,
  PieceType,
  TulouBattleBuffs,
} from "@/types";
import { BALANCE, ENEMIES, scaledEnemyStats } from "@/data";
import {
  ALLY_ROWS,
  BOARD_COLS,
  layoutEnemyPositions,
} from "@/lib/game/boardLayout";
import {
  BATTLE_DAMAGE_MULTIPLIER,
  BATTLE_ENEMY_HP_FACTOR,
  BATTLE_MAX_MS,
  BATTLE_TICK_MS,
  stageScaling,
} from "../constants";
import {
  applyTulouDamageToAlly,
  createTulouBattleBuffs,
  effectiveAllyAtkSpeed,
} from "../tulouBuff";
import {
  finalizeWaterGuestState,
  waterGuestAtBattleStart,
} from "../waterGuest";

type CombatUnit = {
  id: string;
  side: "ally" | "enemy";
  unitType: PieceType | EnemyType;
  hp: number;
  maxHp: number;
  atk: number;
  atkSpeed: number;
  armor: number;
};

type TulouRuntimeBuffs = ReturnType<typeof runtimeBuffsFromSnapshot>;

type BattleRuntime = {
  allyUnits: CombatUnit[];
  enemyUnits: CombatUnit[];
  allyPieces: Piece[];
  cooldowns: Map<string, number>;
  tulouBuffs: TulouRuntimeBuffs;
  openingBuffAtkMultiplier: number;
  leafFallActive: boolean;
  leafFallLifesteal: number;
};

export function calcDamage(atk: number, armor: number): number {
  return (atk * 100 * BATTLE_DAMAGE_MULTIPLIER) / (100 + armor);
}

/** Hakka clan synergy — 2/3/4 pieces → +10%/+20%/+30% ally atk. */
export function hakkaAtkMultiplier(allies: Piece[]): number {
  const count = allies.filter((piece) => piece.clan === "hakka").length;
  const { thresholds, atkBonus } = BALANCE.clanSynergy;
  let bonus = 0;
  for (let i = thresholds.length - 1; i >= 0; i -= 1) {
    if (count >= thresholds[i]!) {
      bonus = atkBonus[i]!;
      break;
    }
  }
  return 1 + bonus;
}

import { enemyTypesForBattle } from "./dynamicEnemies";

/** Stage enemy type lineup — stage 4 always includes xiedouhuo. */
export function enemyTypesForStage(stage: number): EnemyType[] {
  return enemyTypesForBattle(stage, []);
}

export function spawnEnemiesForStage(
  stage: number,
  allies: Piece[] = [],
  options?: { scalingOverride?: number; hpFactor?: number },
): Enemy[] {
  const types = enemyTypesForBattle(stage, allies);
  const scale = options?.scalingOverride ?? stageScaling(stage);
  const hpFactor = (options?.hpFactor ?? 1) * BATTLE_ENEMY_HP_FACTOR;
  const positions = layoutEnemyPositions(types.length);

  return types.map((type, index) => {
    const stats = scaledEnemyStats(type, scale);
    const scaledHp = Math.max(1, Math.round(stats.hp * hpFactor));

    return {
      id: `enemy_${stage}_${index}`,
      type,
      hp: scaledHp,
      maxHp: scaledHp,
      atk: stats.atk,
      atkSpeed: stats.atkSpeed,
      armor: stats.armor,
      range: stats.range,
      position: positions[index]!,
    };
  });
}

function isAssassinType(type: EnemyType): boolean {
  return ENEMIES[type].role === "assassin";
}

function allyBackRow(): number {
  return ALLY_ROWS[0]!;
}

function pickAssassinJumpTarget(allies: Piece[]): Piece | null {
  const living = allies.filter((piece) => piece.hp > 0);
  if (living.length === 0) return null;

  const shuike = living.find((piece) => piece.type === "shuike");
  if (shuike) return shuike;

  const withPosition = living.filter((piece) => piece.position);
  if (withPosition.length === 0) return living[0] ?? null;

  return withPosition.reduce((best, current) => {
    const bestRow = best.position?.y ?? ALLY_ROWS[ALLY_ROWS.length - 1]!;
    const currentRow = current.position?.y ?? ALLY_ROWS[ALLY_ROWS.length - 1]!;
    return currentRow < bestRow ? current : best;
  });
}

/** Assassin opens by leaping to the ally back row beside its priority target. */
export function applyAssassinLeap(
  enemies: Enemy[],
  allies: Piece[],
): { enemies: Enemy[]; events: BattleEvent[] } {
  const target = pickAssassinJumpTarget(allies);
  if (!target) return { enemies, events: [] };

  const targetPos = target.position ?? { x: Math.floor(BOARD_COLS / 2), y: allyBackRow() };
  const leapRow = allyBackRow();
  const events: BattleEvent[] = [];

  const nextEnemies = enemies.map((enemy) => {
    if (!isAssassinType(enemy.type)) return enemy;

    const leapPos = {
      x: Math.max(0, Math.min(BOARD_COLS - 1, targetPos.x)),
      y: leapRow,
    };
    events.push({
      type: "skill",
      sourceId: enemy.id,
      skillId: "assassin_leap",
    });
    return { ...enemy, position: leapPos };
  });

  return { enemies: nextEnemies, events };
}

function toCombatUnit(piece: Piece, atkMultiplier: number): CombatUnit {
  return {
    id: piece.id,
    side: "ally",
    unitType: piece.type,
    hp: piece.hp,
    maxHp: piece.maxHp,
    atk: Math.round(piece.atk * atkMultiplier),
    atkSpeed: piece.atkSpeed,
    armor: piece.armor,
  };
}

function enemyToCombatUnit(enemy: Enemy): CombatUnit {
  return {
    id: enemy.id,
    side: "enemy",
    unitType: enemy.type,
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    atk: enemy.atk,
    atkSpeed: enemy.atkSpeed,
    armor: enemy.armor,
  };
}

function pickWeakestTarget(
  attacker: CombatUnit,
  units: CombatUnit[],
): CombatUnit | null {
  const opponents = units.filter(
    (unit) => unit.side !== attacker.side && unit.hp > 0,
  );
  if (opponents.length === 0) return null;

  return opponents.reduce((weakest, current) =>
    current.hp < weakest.hp ? current : weakest,
  );
}

function pickAssassinTarget(
  allyPieces: Piece[],
  allyUnits: CombatUnit[],
): CombatUnit | null {
  const living = allyUnits.filter((unit) => unit.side === "ally" && unit.hp > 0);
  if (living.length === 0) return null;

  const shuikePiece = allyPieces.find(
    (piece) => piece.type === "shuike" && piece.hp > 0,
  );
  if (shuikePiece) {
    const shuikeUnit = living.find((unit) => unit.id === shuikePiece.id);
    if (shuikeUnit) return shuikeUnit;
  }

  const ranked = living
    .map((unit) => {
      const piece = allyPieces.find((entry) => entry.id === unit.id);
      const row = piece?.position?.y ?? ALLY_ROWS[ALLY_ROWS.length - 1]!;
      const col = piece?.position?.x ?? Math.floor(BOARD_COLS / 2);
      return { unit, row, col };
    })
    .sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return Math.abs(a.col - Math.floor(BOARD_COLS / 2)) - Math.abs(b.col - Math.floor(BOARD_COLS / 2));
    });

  return ranked[0]?.unit ?? null;
}

function pickTarget(
  attacker: CombatUnit,
  units: CombatUnit[],
  allyPieces: Piece[],
): CombatUnit | null {
  if (attacker.side === "enemy" && isAssassinType(attacker.unitType as EnemyType)) {
    const allyUnits = units.filter((unit) => unit.side === "ally");
    return pickAssassinTarget(allyPieces, allyUnits);
  }
  return pickWeakestTarget(attacker, units);
}

function hpPercent(units: CombatUnit[]): number {
  const totalMax = units.reduce((sum, unit) => sum + unit.maxHp, 0);
  if (totalMax === 0) return 0;
  const totalHp = units.reduce((sum, unit) => sum + Math.max(unit.hp, 0), 0);
  return (totalHp / totalMax) * 100;
}

function runtimeBuffsFromSnapshot(buffs: TulouBattleBuffs) {
  return {
    tier: buffs.tier,
    shieldHp: { ...buffs.shieldHp },
    cheatDeathAvailable: new Set(buffs.cheatDeathAvailable),
    invincibleUntil: { ...buffs.invincibleUntil },
  };
}

function serializeTulouBuffs(
  runtime: ReturnType<typeof runtimeBuffsFromSnapshot>,
): TulouBattleBuffs {
  return {
    tier: runtime.tier,
    shieldHp: { ...runtime.shieldHp },
    cheatDeathAvailable: [...runtime.cheatDeathAvailable],
    invincibleUntil: { ...runtime.invincibleUntil },
  };
}

function syncUnitsToSnapshot(
  battle: BattleSnapshot,
  allyUnits: CombatUnit[],
  enemyUnits: CombatUnit[],
  tulouBuffs: TulouBattleBuffs,
): BattleSnapshot {
  const allyHp = new Map(allyUnits.map((unit) => [unit.id, unit.hp]));
  const enemyHp = new Map(enemyUnits.map((unit) => [unit.id, unit.hp]));

  return {
    ...battle,
    allies: battle.allies.map((ally) => ({
      ...ally,
      hp: Math.max(0, allyHp.get(ally.id) ?? ally.hp),
    })),
    enemies: battle.enemies.map((enemy) => ({
      ...enemy,
      hp: Math.max(0, enemyHp.get(enemy.id) ?? enemy.hp),
    })),
    tulouBuffs,
  };
}

function runtimeFromSnapshot(battle: BattleSnapshot): BattleRuntime {
  const openingMult = battle.openingBuffAtkMultiplier ?? 1;
  const atkMultiplier = hakkaAtkMultiplier(battle.allies) * openingMult;
  const runtimeBuffs = runtimeBuffsFromSnapshot(battle.tulouBuffs);
  const elapsed = battle.tick * BATTLE_TICK_MS;
  const leafFallConfig = BALANCE.clanSynergy.leafFall;
  const leafFallActive =
    Boolean(battle.leafFall?.triggered) &&
    elapsed < (battle.leafFall?.activeUntilMs ?? 0);

  return {
    allyUnits: battle.allies.map((ally) => toCombatUnit(ally, atkMultiplier)),
    enemyUnits: battle.enemies.map(enemyToCombatUnit),
    allyPieces: battle.allies,
    cooldowns: new Map(Object.entries(battle.cooldowns ?? {})),
    tulouBuffs: runtimeBuffs,
    openingBuffAtkMultiplier: openingMult,
    leafFallActive,
    leafFallLifesteal: leafFallActive ? leafFallConfig.lifestealRatio : 0,
  };
}

function unitAtkSpeed(
  unit: CombatUnit,
  tier: HomeRepairTier,
  leafFallActive: boolean,
): number {
  let speed = unit.atkSpeed;
  if (unit.side === "ally") {
    speed = effectiveAllyAtkSpeed(unit.atkSpeed, tier);
    if (leafFallActive) {
      speed *= 1 + BALANCE.clanSynergy.leafFall.atkSpeedBonus;
    }
  }
  return speed;
}

function applyDamageToTarget(
  target: CombatUnit,
  damage: number,
  tulouBuffs: ReturnType<typeof runtimeBuffsFromSnapshot>,
  elapsedMs: number,
): BattleEvent[] {
  if (target.side === "enemy") {
    target.hp -= damage;
    return [];
  }

  const outcome = applyTulouDamageToAlly(
    target.id,
    target.hp,
    target.maxHp,
    damage,
    tulouBuffs,
    elapsedMs,
  );

  target.hp = outcome.hp;
  tulouBuffs.shieldHp[target.id] = outcome.shieldHp;

  if (outcome.invincibleUntil !== null) {
    tulouBuffs.invincibleUntil[target.id] = outcome.invincibleUntil;
  }

  return outcome.events;
}

function buildBattleResult(
  allyUnits: CombatUnit[],
  enemyUnits: CombatUnit[],
  allies: Piece[],
  waterGuestInitial: ReturnType<typeof waterGuestAtBattleStart>,
  tick: number,
  events: BattleEvent[],
  timedOut: boolean,
): BattleResult {
  const alliesRemaining = allyUnits.filter((unit) => unit.hp > 0).length;
  const enemiesRemaining = enemyUnits.filter((unit) => unit.hp > 0).length;
  const allyHpPercent = hpPercent(allyUnits);
  const enemyHpPercent = hpPercent(enemyUnits);

  let won: boolean;
  if (enemiesRemaining === 0 && alliesRemaining > 0) {
    won = true;
  } else if (alliesRemaining === 0) {
    won = false;
  } else if (timedOut) {
    won = allyHpPercent > enemyHpPercent;
  } else {
    won = false;
  }

  const allyHpById = new Map(allyUnits.map((unit) => [unit.id, unit.hp]));
  const alliesFinal = allies.map((ally) => ({
    ...ally,
    hp: Math.max(0, allyHpById.get(ally.id) ?? ally.hp),
  }));
  const { state: waterGuest, events: waterGuestEvents } = finalizeWaterGuestState(
    waterGuestInitial,
    alliesFinal,
  );

  return {
    won,
    tick,
    elapsedMs: tick * BATTLE_TICK_MS,
    events: [...events, ...waterGuestEvents],
    alliesRemaining,
    enemiesRemaining,
    allyHpPercent,
    enemyHpPercent,
    waterGuest,
  };
}

export function createBattleSnapshot(input: BattleInput): BattleSnapshot {
  const rawEnemies = structuredClone(
    input.enemies ??
      spawnEnemiesForStage(input.stage, input.allies, {
        scalingOverride: input.scalingOverride,
        hpFactor: input.enemyHpFactorOverride,
      }),
  );
  const allies = structuredClone(
    input.allies.filter((piece) => piece.hp > 0),
  );
  const { enemies: leapedEnemies, events: leapEvents } = applyAssassinLeap(
    rawEnemies,
    allies,
  );
  const unitIds = [
    ...allies.map((piece) => piece.id),
    ...leapedEnemies.map((enemy) => enemy.id),
  ];
  const waterGuest = waterGuestAtBattleStart(allies);
  const tier = input.homeRepairTier ?? 0;
  const runtimeBuffs = createTulouBattleBuffs(allies, tier);

  return {
    tick: 0,
    elapsedMs: 0,
    allies,
    enemies: leapedEnemies,
    events: leapEvents,
    cooldowns: Object.fromEntries(unitIds.map((id) => [id, 0])),
    finished: false,
    waterGuest,
    tulouBuffs: serializeTulouBuffs(runtimeBuffs),
    openingBuffAtkMultiplier: input.openingBuffAtkMultiplier ?? 1,
    leafFall: { triggered: false, activeUntilMs: 0 },
  };
}

function maybeTriggerLeafFall(
  battle: BattleSnapshot,
  allies: Piece[],
  elapsedMs: number,
): { battle: BattleSnapshot; events: BattleEvent[] } {
  const config = BALANCE.clanSynergy.leafFall;
  const hakkaCount = allies.filter((piece) => piece.clan === "hakka").length;
  const leafFall = battle.leafFall ?? { triggered: false, activeUntilMs: 0 };
  const events: BattleEvent[] = [];

  if (!leafFall.triggered && hakkaCount >= config.minClanCount) {
    events.push({ type: "leafFallStart" });
    return {
      battle: {
        ...battle,
        leafFall: {
          triggered: true,
          activeUntilMs: elapsedMs + config.durationMs,
        },
      },
      events,
    };
  }

  if (
    leafFall.triggered &&
    leafFall.activeUntilMs > 0 &&
    elapsedMs >= leafFall.activeUntilMs &&
    battle.events.every((event) => event.type !== "leafFallEnd")
  ) {
    events.push({ type: "leafFallEnd" });
  }

  return { battle, events };
}

export function advanceBattleTick(battle: BattleSnapshot): {
  battle: BattleSnapshot;
  finished: boolean;
  result: BattleResult | null;
} {
  if (battle.finished) {
    return { battle, finished: true, result: null };
  }

  const maxTicks = BATTLE_MAX_MS / BATTLE_TICK_MS;
  const tick = battle.tick;
  const elapsedMs = tick * BATTLE_TICK_MS;
  let workingBattle = battle;
  const leafTrigger = maybeTriggerLeafFall(workingBattle, battle.allies, elapsedMs);
  workingBattle = leafTrigger.battle;

  const { allyUnits, enemyUnits, allyPieces, cooldowns, tulouBuffs, leafFallActive, leafFallLifesteal } =
    runtimeFromSnapshot(workingBattle);
  const units = [...allyUnits, ...enemyUnits];
  const newEvents: BattleEvent[] = [...leafTrigger.events];

  const livingAllies = allyUnits.filter((unit) => unit.hp > 0);
  const livingEnemies = enemyUnits.filter((unit) => unit.hp > 0);

  if (livingAllies.length === 0 || livingEnemies.length === 0 || tick >= maxTicks) {
    const events = [...battle.events, { type: "roundEnd" as const }];
    const serializedBuffs = serializeTulouBuffs(tulouBuffs);
    const result = buildBattleResult(
      allyUnits,
      enemyUnits,
      battle.allies,
      battle.waterGuest,
      tick,
      events,
      tick >= maxTicks && livingAllies.length > 0 && livingEnemies.length > 0,
    );
    const synced = syncUnitsToSnapshot(
      {
        ...workingBattle,
        tick,
        elapsedMs: tick * BATTLE_TICK_MS,
        events,
        cooldowns: Object.fromEntries(cooldowns),
        finished: true,
      },
      allyUnits,
      enemyUnits,
      serializedBuffs,
    );
    return { battle: synced, finished: true, result };
  }

  for (const unit of units) {
    if (unit.hp <= 0) continue;

    const elapsed = tick * BATTLE_TICK_MS;
    const atkSpeed = unitAtkSpeed(unit, tulouBuffs.tier, leafFallActive);
    const intervalMs = atkSpeed > 0 ? 1000 / atkSpeed : Infinity;
    const readyAt = cooldowns.get(unit.id) ?? 0;

    if (elapsed < readyAt) continue;

    const target = pickTarget(unit, units, allyPieces);
    if (!target) continue;

    const damage = calcDamage(unit.atk, target.armor);
    const tulouEvents = applyDamageToTarget(target, damage, tulouBuffs, elapsed);
    newEvents.push({
      type: "attack",
      sourceId: unit.id,
      targetId: target.id,
      damage,
    });
    newEvents.push(...tulouEvents);

    if (unit.side === "ally" && leafFallLifesteal > 0 && damage > 0) {
      const heal = Math.max(1, Math.round(damage * leafFallLifesteal));
      unit.hp = Math.min(unit.maxHp, unit.hp + heal);
    }

    if (target.hp <= 0) {
      newEvents.push({ type: "kill", unitId: target.id });
    }

    cooldowns.set(unit.id, elapsed + intervalMs);
  }

  const nextTick = tick + 1;
  const livingAfter = {
    allies: allyUnits.filter((unit) => unit.hp > 0).length,
    enemies: enemyUnits.filter((unit) => unit.hp > 0).length,
  };
  const timedOut = nextTick >= maxTicks;
  const combatEnded = livingAfter.allies === 0 || livingAfter.enemies === 0;

  let events = [...battle.events, ...newEvents];
  const finished = combatEnded || timedOut;
  let result: BattleResult | null = null;
  const serializedBuffs = serializeTulouBuffs(tulouBuffs);

  if (finished) {
    events = [...events, { type: "roundEnd" }];
    result = buildBattleResult(
      allyUnits,
      enemyUnits,
      battle.allies,
      battle.waterGuest,
      nextTick,
      events,
      timedOut && livingAfter.allies > 0 && livingAfter.enemies > 0,
    );
  }

  const nextBattle = syncUnitsToSnapshot(
    {
      ...workingBattle,
      tick: nextTick,
      elapsedMs: nextTick * BATTLE_TICK_MS,
      events,
      cooldowns: Object.fromEntries(cooldowns),
      finished,
    },
    allyUnits,
    enemyUnits,
    serializedBuffs,
  );

  return { battle: nextBattle, finished, result };
}

export function simulateBattle(input: BattleInput): BattleResult {
  let battle = createBattleSnapshot(input);
  let result: BattleResult | null = null;
  const maxSteps = BATTLE_MAX_MS / BATTLE_TICK_MS + 2;

  for (let step = 0; step < maxSteps && !result; step += 1) {
    const next = advanceBattleTick(battle);
    battle = next.battle;
    if (next.result) {
      result = next.result;
    }
  }

  if (!result) {
    throw new Error("simulateBattle: battle did not finish");
  }

  return result;
}

export function syncBoardFromBattle(
  board: Piece[],
  battle: BattleSnapshot | null | undefined,
): Piece[] {
  if (!battle) return board;

  const hpById = new Map(battle.allies.map((ally) => [ally.id, ally.hp]));
  return board.map((piece) => {
    const hp = hpById.get(piece.id);
    return hp === undefined ? piece : { ...piece, hp };
  });
}

export {
  createTulouBattleBuffs,
  effectiveAllyAtkSpeed,
} from "../tulouBuff";
