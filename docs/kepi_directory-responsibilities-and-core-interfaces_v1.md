# 《客批》目录职责与核心接口清单 v1

> 目的：把架构方案继续往下压一层，明确每个目录干什么、核心对象怎么串起来，方便直接开工

## 1. 目录职责表

### `src/app/`

- 路由入口
- 页面壳子
- `app/api/*` 代理 AI
- 仅做路由和页面编排，不写核心规则

建议包含：

- `layout.tsx`：全局布局
- `page.tsx`：主游戏页
- `debug/page.tsx`：调试页
- `api/ai/route.ts`：AI 代理

### `src/components/`

- React 组件层
- 负责可见 UI
- 不直接持有规则真相

建议拆分：

- `components/game/`：棋盘、商店、战斗面板、结局层
- `components/ui/`：按钮、弹窗、Tabs、Tooltip 等基础件

### `src/engine/`

- 纯 TypeScript 游戏引擎
- 唯一真相
- 所有规则都在这里

建议拆分：

- `battle/`：战斗模拟、伤害、攻速、技能
- `economy/`：金币、工资、利息、连胜连败
- `shop/`：刷新、购买、卖出、人口
- `progression/`：关卡推进、胜负、结局判定
- `stateMachine/`：备战 / 战斗 / 结局 / 设置

### `src/store/`

- Zustand 状态仓库
- 只做 UI 镜像和 action 分发
- 不做规则推演

建议拆分：

- `gameStore.ts`
- `uiStore.ts`

### `src/data/`

- 所有静态配置
- 全部使用 TypeScript 常量模块

建议拆分：

- `pieces.ts`
- `enemies.ts`
- `stages.ts`
- `letters.ts`
- `balance.ts`

### `src/lib/`

- 通用工具
- schema 校验
- 存档封装
- AI 封装
- 小型无状态工具函数

建议拆分：

- `schemas/`
- `storage/`
- `ai/`
- `utils/`

### `public/`

- 图片
- 音频
- 视频 / 录屏
- 结局素材

### `src/types/`

- 跨层共享类型
- 仅放真正会被多个层引用的类型

## 2. 核心对象

### 2.1 `GameState`

对局唯一真相的状态对象。

```ts
type GameState = {
  stage: number;
  totalStages: number;
  survival: number;
  kebi: number;
  kebiThreshold: number;
  sangzi: number;
  homeRepair: number;
  gold: number;
  population: number;
  winStreak: number;
  loseStreak: number;
  result: "playing" | "win" | "lose" | null;
};
```

### 2.2 `Piece`

武力棋子定义。

```ts
type Piece = {
  id: string;
  type: "farmer" | "guard" | "teacher" | "fengshui" | "patriarch";
  cost: number;
  star: 1 | 2 | 3;
  hp: number;
  maxHp: number;
  atk: number;
  atkSpeed: number;
  armor: number;
  range: "melee" | "mid" | "ranged";
  clan: string;
  position: { x: number; y: number } | null;
};
```

### 2.3 `SupportUnit`

公益后勤位。

```ts
type SupportUnit = {
  type: "shuike" | "xiangxian";
  slot: "shuike" | "xiangxian";
};
```

### 2.4 `Enemy`

敌方单位，结构与 `Piece` 类似，但不需要玩家侧字段。

### 2.5 `BattleSnapshot`

一次战斗过程中的临时快照。

```ts
type BattleSnapshot = {
  tick: number;
  elapsedMs: number;
  allies: Piece[];
  enemies: Enemy[];
  events: BattleEvent[];
};
```

### 2.6 `BattleEvent`

战斗过程中的事件流。

```ts
type BattleEvent =
  | { type: "attack"; sourceId: string; targetId: string; damage: number }
  | { type: "kill"; unitId: string }
  | { type: "skill"; sourceId: string; skillId: string }
  | { type: "roundEnd" };
```

### 2.7 `GameAction`

引擎输入动作。

```ts
type GameAction =
  | { type: "BUY_PIECE"; pieceType: Piece["type"] }
  | { type: "SELL_PIECE"; pieceId: string }
  | { type: "MOVE_PIECE"; pieceId: string; position: { x: number; y: number } }
  | { type: "REFRESH_SHOP" }
  | { type: "BUY_POPULATION" }
  | { type: "START_BATTLE" }
  | { type: "END_BATTLE" }
  | { type: "ADVANCE_STAGE" }
  | { type: "LOAD_SNAPSHOT"; snapshot: GameSnapshot };
```

### 2.8 `GameSnapshot`

可持久化的对局快照。

```ts
type GameSnapshot = {
  version: number;
  state: GameState;
  board: Piece[];
  shop: ShopState;
  support: SupportUnit[];
};
```

## 3. 核心接口

### 3.1 引擎入口

```ts
function reduceGameState(state: GameSnapshot, action: GameAction): GameSnapshot;
```

职责：

- 接收当前快照和动作
- 返回下一份快照
- 不修改入参

### 3.2 战斗模拟

```ts
function simulateBattle(input: BattleInput): BattleResult;
```

职责：

- 按固定 tick 推进战斗
- 产出事件流
- 返回战斗胜负

### 3.3 商店逻辑

```ts
function rollShop(state: GameSnapshot): GameSnapshot;
function buyPiece(state: GameSnapshot, pieceType: Piece["type"]): GameSnapshot;
```

### 3.4 结算逻辑

```ts
function settleStage(state: GameSnapshot, result: BattleResult): GameSnapshot;
function resolveProgression(state: GameSnapshot): GameSnapshot;
```

### 3.5 存档接口

```ts
function saveSnapshot(snapshot: GameSnapshot): void;
function loadSnapshot(): GameSnapshot | null;
function clearSnapshot(): void;
```

### 3.6 AI 接口

前端调用：

```ts
type AIPromptInput = {
  stage: number;
  kebi: number;
  homeRepair: number;
  survival: number;
  battleSummary: string;
};
```

后端返回：

```ts
type AILetterResponse = {
  title: string;
  body: string;
  voiceText?: string;
  source?: string;
};
```

## 4. Zustand 状态建议

### 4.1 `gameStore`

建议只放这些：

- 当前快照镜像
- 当前场景
- 操作入口
- 选中棋子
- 商店高亮
- 结算面板状态

不建议放：

- 真正的战斗规则
- 经济推演
- 胜负计算

### 4.2 `uiStore`

建议放这些：

- 设置面板开关
- 调试面板开关
- 音量
- 手势开关
- 摄像头状态
- 提示弹窗

## 5. `localStorage` Key 建议

```ts
const STORAGE_KEYS = {
  settings: "kepi.settings",
  snapshot: "kepi.snapshot",
  debug: "kepi.debug",
} as const;
```

建议内容：

- `settings`：音量、手势、UI 偏好
- `snapshot`：可选续局快照
- `debug`：调试页偏好

## 6. API 约定

### `POST /api/ai`

用途：

- 生成数字客批

请求体：

```ts
type AIRequest = {
  kind: "digital-letter";
  input: AIPromptInput;
};
```

响应体：

```ts
type AIResponse = {
  ok: true;
  data: AILetterResponse;
} | {
  ok: false;
  fallback: AILetterResponse;
};
```

约束：

- 失败时返回降级文案
- 前端不直接接触第三方密钥

## 7. 测试关注点

### `Vitest`

- `reduceGameState`
- `simulateBattle`
- `rollShop`
- `settleStage`
- `resolveProgression`

### `Playwright`

- 主页面加载
- 一局跑完
- 结局页切换
- 本机存档恢复

## 8. 实施顺序建议

1. 先落 `types.ts`
2. 再落 `data/`
3. 再落 `engine/`
4. 再落 `store/`
5. 再接 `components/`
6. 再接 `app/api/ai`
7. 最后补测试和调试页

