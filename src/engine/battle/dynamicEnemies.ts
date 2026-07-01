import { stageDefinition } from "@/data";
import { ENEMY_TYPES } from "@/data/enemies";
import type { EnemyType, Piece, PieceType } from "@/types";
import { enemyCountForStage } from "../constants";

const RANGED_TYPES: ReadonlySet<PieceType> = new Set([
  "fengshui",
  "xiangxian",
  "teacher",
]);

/** Stage 4 lineup adapts to player board — always includes xiedouhuo. */
export function enemyTypesForBattle(stage: number, allies: Piece[]): EnemyType[] {
  if (stage < 4) {
    return enemyTypesForFixedStage(stage);
  }

  const count = enemyCountForStage(stage);
  const pool = stageDefinition(stage)?.enemyPool ?? ENEMY_TYPES;
  const types: EnemyType[] = ["xiedouhuo"];

  const rangedCount = allies.filter((piece) => RANGED_TYPES.has(piece.type)).length;
  const tankCount = allies.filter((piece) => piece.type === "guard").length;
  const star2Count = allies.filter((piece) => piece.star === 2).length;
  const shuikeBackline = allies.some(
    (piece) =>
      piece.type === "shuike" &&
      piece.position !== null &&
      piece.position.y <= 1,
  );

  let fillers: EnemyType[];

  if (rangedCount >= 2 || shuikeBackline) {
    fillers = ["ehushan", "hongtouchuan", "luyinguanli", "zhuzaiqi"];
  } else if (tankCount >= 2) {
    fillers = ["zhuzaiqi", "qianhaibei", "ehushan", "luyinguanli"];
  } else {
    fillers = pool.filter((type) => type !== "xiedouhuo");
  }

  if (star2Count >= 2 && !fillers.includes("hongtouchuan")) {
    fillers = ["hongtouchuan", ...fillers];
  }

  let fillIndex = 0;
  while (types.length < count) {
    types.push(fillers[fillIndex % fillers.length]!);
    fillIndex += 1;
  }

  return types;
}

function enemyTypesForFixedStage(stage: number): EnemyType[] {
  const count = enemyCountForStage(stage);
  const pool = stageDefinition(stage)?.enemyPool ?? ["qianhaibei", "luyinguanli"];

  return Array.from(
    { length: count },
    (_, index) => pool[index % pool.length]!,
  );
}
