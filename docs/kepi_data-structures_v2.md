# 《客批》数据结构清单 v2

> 目的：补充 V3.1 路线层、双向典当、篝火白名单与叙事标签类型
> 依据：[PRD V3.1](kepi_PRD_V3.1.md)、[数据结构 v1](kepi_data-structures_v1.md)
> 更新：2026-07-02

## JourneyNode

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 节点唯一 id |
| type | `battle` \| `pawn_shop` \| `campfire` | 节点玩法 |
| label | string | 卷轴 UI 展示名 |
| battleStage | number? | 战斗节点关联 stage |
| difficulty | string? | 难度标签 |
| scalingOverride | number? | 敌人 scaling 覆盖 |
| isFinal | boolean? | 终局战斗节点 |

## GameState（V3.1 增量）

| 字段 | 类型 | 说明 |
|---|---|---|
| totalNodes | number | 路线长度 |
| journeyIndex | number | 当前节点索引 |
| currentNodeId | string | 当前节点 id |
| bloodDebtCount | number | 透支次数 |
| kebiThreshold | number | `5 + bloodDebtCount` |
| nextBattleEnemyHpFactor | number | 篝火 debuff 等 |

## PawnState（运行时）

| 字段 | 类型 | 说明 |
|---|---|---|
| pawnedKebi | number | 当信累计 |
| bloodDebtCount | number | 透支累计 |
| kebiThreshold | number | 动态归乡阈值 |

## CampfireEffect

白名单效果：`gold` / `homeRepair` / `nextBattleDebuff` / `kebiHint` — 见 `src/data/campfire.ts`。

## NarrativeTags

| 字段 | 类型 | 说明 |
|---|---|---|
| deathCount | number | 已损失存续度 |
| didPawn | boolean | 本回合当信 |
| didBloodDebt | boolean | 本回合透支 |
| winStreak | number | 连胜展示 |
| waterGuestSurvived | boolean | 水客存活 |
| homeRepairMilestone | 33 \| 66 \| 99? | 修复里程碑 |
| outcomeTone | crushing \| clutch \| narrow? | fallback 分组 |

AI 客户端超时：**1500ms**（`AI_REQUEST_TIMEOUT_MS`）。
