# 《客批》TODO 文档 v3

> 目的：基于 `kepi_PRD_V3.1.md`，将 V3.1「微肉鸽线性卷轴图 + 情感自走棋」方案按 feature 拆成可执行开发清单，并对照当前代码（V2.0 微型局基线）标注完成度
> 依据：[PRD V3.1](kepi_PRD_V3.1.md)、[PRD V2.0](kepi_PRD_V2.0.md)、[TODO v2](kepi_todo_v2.md)
> 更新：2026-07-02 — V3.1 实现完成（引擎/Store/UI/测试/文档）；P2 backlog（Feature O）仍待后续版本

## 0. 执行口径

### 0.1 版本目标

- V3.1 在 V2.0 极限自走棋核心上，增加 **6–8 节点归乡路线**、**客批典当行 / 篝火夜话**、**双向典当**、**开局乡音符手势盲盒**、**宗族落叶归根 Juice** 与 **AI 1.5 秒熔断**。
- **单局时长**：约 10–12 分钟（由 4 关固定流程扩展为 6–8 个路线节点）。
- **P0 目标**：路演可完整演示「卷轴推进 → 战斗检验 → 典当抉择 → 夜话文本 → 终点阈值判定 → 风浪抓信」主链路。
- **P1 目标**：典当仪式感、Juice 全屏表现、手势增强、文档口径统一。
- **P2 目标**：V3.2 / V3.3 方向（战斗差异化、夜话影响下一战、亲手送最后一封信）。

### 0.2 当前基线（2026-07-02 代码快照）

| 维度 | 当前实现 | V3.1 目标 |
|---|---|---|
| 局外结构 | 4 关 `prep → battle → settlement → ending` | 6–8 节点线性归乡卷轴 |
| 节点类型 | 仅备战 / 战斗 / 结算 | 战斗、客批典当行、篝火夜话 |
| 客批阈值 | 固定 4 封 | 基础 5 封 + `bloodDebtCount` |
| 典当 | 备战阶段单向当信（-1 客批 +15 金） | 双向：当信 + 透支未来（+35 金、阈值 +1） |
| 经济底薪 | 每回合工资 5 金 | 每过节点固定微薄底薪 |
| 水客 | 已上场、死保、结算挂钩 | 保持，继续作为战斗核心 |
| 土楼 Buff | 33 / 66 / 99 已进入 battle | 保持，视觉 6 档可保留 |
| AI 旁白 | `turn-narrative`，15s / 12s 超时 | 1500ms 熔断 + 惨胜 / 苟活 / 碾压等标签 fallback |
| 手势 | 结局 `GestureLayer`（pointer / gesture） | 开局乡音符 + 结局抓信首尾呼应 |
| 宗族羁绊 | 2 / 3 / 4 人攻击 +10% / +20% / +30% | 最高级额外触发「落叶归根」Juice |

### 0.3 开发顺序约定

每个 feature 内部按以下顺序推进：

1. 类型与数据（`src/types/`、`src/data/`）
2. 引擎规则（`src/engine/`）
3. Store 镜像与 action 分发（`src/store/`）
4. UI / Canvas / 音效接入（`src/components/`）
5. 单元测试与 E2E 验证

### 0.4 状态标记

- `[x]`：已由 V2.0 或当前分支完成，V3.1 可继续复用
- `[~]`：部分完成，需按 V3.1 改造或迁移
- `[ ]`：待实现 / 待迁移 / 待验证
- `P0`：路演必须可用
- `P1`：强烈建议完成，提升表现力
- `P2`：工期允许时做

### 0.5 PRD 建议落地顺序（P0）

| 顺序 | 工作项 | 对应 Feature |
|---:|---|---|
| 1 | 固化 JourneyNode 与本地路线 | A |
| 2 | 禁用旧经济残留，加入双向典当 action | B |
| 3 | 确认水客战斗与结算（继承 V2，回归验证） | C |
| 4 | 确认土楼 Buff 进入 battle（继承 V2，回归验证） | C |
| 5 | AI 旁白 1500ms 熔断 + 标签 fallback | H |
| 6 | pointer 版乡音符抓取 | D |
| 7 | 结局阈值改为 5 + 透支数 | I |

---

## Feature A — 归乡路线与卷轴图（Journey Layer）

> 从固定 4 关战斗流程，迁移为 6–8 节点的单向「南洋 → 故乡」卷轴路线。

### 目标验收

- 路线结构写死本地，长度 6–8 节点，情绪曲线可控。
- 引擎持有 `journeyIndex` / `currentNode`，UI 不自行判断推进。
- 节点类型：`battle` | `pawn_shop` | `campfire`。
- 推荐样例：`篝火 → 战斗 → 典当行 → 战斗 → 篝火 → 极难战斗 → 终点`。

### 任务清单

- [x] P0 定义 `JourneyNodeType`、`JourneyNode`、`JourneyDefinition` 类型
- [x] P0 新增 `src/data/journey.ts`：固定 6–8 节点静态路线（含节点 id、类型、关联 stage / 难度）
- [x] P0 `GameState` 增加 `journeyIndex`、`currentNodeId`（或等价字段）
- [x] P0 将 `totalStages: 4` 迁移为 `totalNodes` / 路线长度，与 `journey.ts` 对齐
- [x] P0 引擎新增 `ADVANCE_JOURNEY`（或改造 `ADVANCE_STAGE`）按节点类型切换 phase / subphase
- [x] P0 战斗节点复用现有 `prep → battle → settlement` 子流程
- [x] P0 非战斗节点（典当行、篝火）作为独立 phase 或 subphase，不硬塞进 `prep`
- [x] P0 节点底薪：每推进一个节点发放固定微薄金币（替换 / 对齐现有 `ROUND_WAGE` 语义）
- [x] P0 Store 暴露路线推进 action，镜像 `journeyIndex`
- [x] P0 UI：极简卷轴航线图（当前节点高亮、已完成节点、终点）
- [x] P0 顶部资源栏改为展示「节点 x / 总节点」而非「关卡 x / 4」
- [x] P1 卷轴背景与土楼修复进度条联动（桑梓驱动视觉）
- [x] P0 单元测试：节点顺序推进、类型分支、终点触发
- [x] P0 E2E：至少推进 2 种不同节点类型并进入下一场战斗

---

## Feature B — 双向典当经济（Pawn & Blood Debt）

> V3.1 核心杠杆：当信换钱（防守）与透支未来换钱（进攻）。

### 目标验收

- **分支 A · 当信**：`kebi >= 1` → -1 客批、+15 金、`pawnedKebi +1`、通关进度倒退。
- **分支 B · 透支**：任意时刻可用（含 0 封信）→ +35 金、`bloodDebtCount +1`、`kebiThreshold = 5 + bloodDebtCount`。
- 无利息、无连胜 / 连败金币奖励（V2 已移除，V3.1 保持）。
- 典当可在 **客批典当行节点** 与（可选）备战阶段触达，规则一致。

### 任务清单

- [x] P0 V2.0 已移除利息与 streak 金币结算（`src/engine/economy/index.ts`）
- [x] P0 V2.0 已实现 `PAWN_KEBI`：-1 客批、+15 金、`pawnedKebi +1`（仅 `prep` 阶段）
- [x] P0 单向典当 UI 与 CSS 闪烁反馈已有（`ShopStrip`、`kepi-pawn-burn`），缺全屏燃烧仪式
- [x] P0 `GameState` 增加 `bloodDebtCount: number`
- [x] P0 `kebiThreshold` 改为运行时 `baseKebiThreshold(5) + bloodDebtCount`（当前仍为固定 4）
- [x] P0 新增 `BORROW_AGAINST_RETURN`（或 `BLOOD_DEBT`）engine action：+35 金、`bloodDebtCount +1`、动态阈值
- [x] P0 典当行节点 phase：集中展示双向典当，而非仅备战面板按钮
- [x] P0 Store 暴露 `borrowAgainstReturn()`（命名可调整，语义对齐 PRD）
- [x] P1 典当仪式感：全屏暗场、客批居中、长按燃烧成灰、金币掉落动画
- [x] P1 分支 A / B 差异化文案与风险提示（透支：「未来的路更长更险」）
- [x] P1 音效：火焰、灰烬、金币、沉重印章
- [x] P0 单元测试：当信边界、0 信可透支、阈值累加、影响结局判定
- [x] P0 E2E：透支后阈值上升且结局判定使用新阈值

---

## Feature C — 极限自走棋核心（继承 V2.0）

> 战斗层继续作为 V3.1 的强机制检验；水客死保与土楼反哺为已落地基线，迁移后需回归验证。

### 目标验收

- 水客无战斗力、必须上场、可被击杀；胜利且水客存活才产出客批与桑梓。
- 伤害公式、tick 制、40 秒超时判定保持 V2.0 行为。
- 客家宗族 2 / 3 / 4 人攻击加成保持。
- 土楼 33% 护盾、66% 攻速、99% 免死 + 1.5s 无敌在 battle 初始化注入。

### 任务清单

- [x] P0 水客 / 乡贤作为可上场棋子（非后勤无敌位）
- [x] P0 `BattleResult` / 结算含水客参战、存活、战死状态
- [x] P0 胜利 + 水客存活 → +1 客批、桑梓 → 家园修复；胜但水客死 → 无客批 / 桑梓
- [x] P0 失败扣存续度（`survival`）；乡贤在场桑梓转化 +50%
- [x] P0 械斗火刺客：跳后排、优先锁水客
- [x] P0 土楼 Buff 三阈值进入 battle（`src/engine/tulouBuff/`、`src/engine/battle/`）
- [x] P0 视觉 6 档土楼阶段 + 机制 33 / 66 / 99 映射函数
- [x] P1 水客低血量视觉 / 听觉危机反馈
- [x] P1 水客死亡、土楼阶段解锁过场与 SFX
- [x] P0 路线迁移后：战斗节点 enemy 配置与 `journey.ts` stage 映射对齐
- [x] P0 路线迁移后：极难战斗节点难度系数与敌人池验收
- [x] P0 回归单测 + E2E：水客三种结算、土楼 Buff、刺客 AI

---

## Feature D — 开局手势盲盒（乡音符）

> 每场战斗开局随机掉落开局 Buff；pointer 优先，手势增强；与结局抓信首尾呼应。

### 目标验收

- 战斗开始前短窗口：天上飘落 1 个「乡音符」。
- 抓取成功 → 激活本地枚举 Buff（种类 ≤ 3）。
- 无摄像头 / 权限失败 → 鼠标 / 触控点击抓取，不阻断流程。
- 超时未抓 → 无 Buff 或弱 Buff 降级（本地规则写死）。

### 任务清单

- [x] P0 定义 `BattleOpeningBuff` 类型与 ≤3 种 Buff 数据（`src/data/battleBuffs.ts` 或并入 balance）
- [x] P0 战斗开局 subphase：`opening_buff`（在 `prep` 结束、`battle` tick 开始前）
- [x] P0 引擎：随机选 Buff、记录 `activeOpeningBuff`、注入 battle 初始化
- [x] P0 pointer 版抓取 UI：可点击乡音符，失败不弹阻断错误
- [x] P0 超时降级策略（如 5s 未抓则跳过）
- [x] P1 复用 / 扩展 `GestureLayer` 或专用 `OpeningBuffLayer` 支持摄像头手势
- [x] P1 设置页 `gestureEnabled` 与路演默认 pointer 策略
- [x] P1 抓取成功 / 失败的轻量 FX 与 SFX
- [x] P0 单元测试：Buff 枚举、注入 battle、超时分支
- [x] P1 E2E：pointer 抓取激活 Buff 并进入战斗

---

## Feature E — 宗族 Juice 大招「落叶归根」

> 凑齐宗族最高级羁绊时触发限时全屏高潮：攻速 + 吸血 + 视觉 FX。

### 目标验收

- 触发条件明确（如 4 人宗族满级），与现有攻击加成叠加方式可控。
- 效果有持续时间，非永久滚雪球。
- 全屏落叶 / 归潮 / 土楼灯火 FX（P1 表现可滞后于数值）。

### 任务清单

- [x] P0 定义触发条件与持续时间（写入 `src/data/balance.ts`）
- [x] P0 battle runtime：检测最高级宗族羁绊 → 施加攻速 + 吸血临时状态
- [x] P0 `BattleEvent` 增加大招触发 / 结束事件供 UI / FX 消费
- [x] P1 Canvas / 全屏 overlay：「落叶归根」Juice 动画
- [x] P1 BGM 短促抬升或 stinger
- [x] P0 单元测试：触发条件、持续时间、与 clanSynergy 数值不爆炸
- [x] P2 数值验证：与土楼 Buff、开局 Buff 叠加后的终局平衡

---

## Feature F — 客批典当行节点（Pawn Shop Node）

> 独立路线节点，集中执行双向典当；可与 Feature B 规则共用 engine action。

### 目标验收

- 进入典当行节点后，玩家二选一（或两项都可见）完成典当操作。
- 完成后推进下一节点，不进入战斗 prep（除非下一节点是战斗）。
- 无 AI 参与规则。

### 任务清单

- [x] P0 `journey.ts` 配置 `pawn_shop` 节点
- [x] P0 新增 phase `pawn_shop`（或 subphase）及允许 action 集合
- [x] P0 UI：典当行场景（卷轴暗场 + 双向典当卡片）
- [x] P0 完成典当或「离开」后 `ADVANCE_JOURNEY`
- [x] P1 节点专属 copy：「客批典当行」标题与说明
- [x] P0 单元测试：仅在该 phase 可触发双向典当
- [x] P0 E2E：路线含典当行节点时可完成一次当信或透支

---

## Feature G — 篝火夜话（Campfire Node）

> 纯文本二选一；AI 只生成文案，效果由本地白名单结算。

### 目标验收

- 进入篝火节点 → 展示 AI 或 fallback 生成的二选一文案。
- 玩家选择 → 本地 `CampfireEffect` 白名单结算（如 +金、+修复、下战 debuff 等，范围可控）。
- AI 不输出 JSON 规则、不决定跳转。

### 任务清单

- [x] P0 定义 `CampfireChoice`、`CampfireEffect` 类型与白名单效果表（`src/data/campfire.ts`）
- [x] P0 `journey.ts` 配置 `campfire` 节点
- [x] P0 新增 phase `campfire` 及 `PICK_CAMPFIRE_CHOICE` action
- [x] P0 引擎：根据 choice id 应用白名单效果，推进 journey
- [x] P0 AI 请求类型 `campfire-choice-copy`：输入 `NarrativeTags`，输出纯文本（两选项标题 + 描述）
- [x] P0 本地 fallback：至少 3 组篝火文案 + 效果映射
- [x] P0 UI：篝火场景、二选一按钮、选择后 brief 反馈
- [x] P1 夜话选择后的轻量过场（火光、字幕）
- [x] P0 单元测试：白名单效果、非法 choice 拒绝、AI 失败 fallback
- [x] P0 E2E：篝火节点完成选择并进入下一节点

---

## Feature H — AI 叙事与 1.5 秒熔断

> AI 只填叙事文本；主流程、状态、跳转 100% 本地；1500ms 超时无缝 fallback。

### 目标验收

- 战斗结算旁白、篝火文案均走标签化传参（`NarrativeTags`）。
- 客户端 AI 请求 **1500ms** 超时；服务端 provider timeout 接近。
- fallback 按 **惨胜、苟活、碾压** 及典当、透支、水客死亡等标签分组。
- 超时 / 报错不阻断画面。

### 任务清单

- [x] P0 V2.0 已实现 `turn-narrative`：结算后旁白 + 本地 fallback 池
- [x] P0 V2.0 已实现 `NarrativeTags` 子集：`didPawn`、`waterGuestSurvived/Died`、`homeRepairMilestone`、`clutchUnit`
- [x] P0 V2.0 AI 密钥仅服务端；客户端 `requestTurnNarrative`
- [x] P0 当前超时 **15s 客户端 / 12s 服务端**（`src/lib/ai/client.ts`、`narrativeServer.ts`）—— 需改为 **1500ms**
- [x] P0 统一 `NarrativeTags` 类型：补 `deathCount`、`didBloodDebt`、`winStreak` 等 PRD 字段
- [x] P0 fallback 池重组：显式覆盖 **惨胜、苟活、碾压** 三组（可叠加典当 / 透支 / 水客死亡）
- [x] P0 新增 `campfire-choice-copy` API kind（见 Feature G）
- [x] P0 UI：AI 等待时不阻塞结算 / 夜话面板（本地文案先占位或 instant fallback）
- [x] P1 旁白轻量出现动画（V2 部分已有）
- [x] P0 单元 / 集成测试：1500ms 超时走 fallback、标签命中正确池
- [x] P0 断网 / 弱网 E2E：全程无报错弹窗

---

## Feature I — 胜负判定、阈值与结局演出

> 终点统一判定；阈值 5 + 透支；风浪抓信与 V3.1 情感字幕。

### 目标验收

- 胜利 = `survival > 0` 且 `kebi >= kebiThreshold`（`kebiThreshold = 5 + bloodDebtCount`）。
- 存续度归零 → 失败结局（风浪抢救类）。
- 终点演出：风浪动画、信件飞舞、子弹时间、抓信（复用 `GestureLayer`）。
- 终极字幕：「你没能赢下所有的期冀，但你让一个客家人的牵挂，回了家。」

### 任务清单

- [x] P0 V2.0 三结局：`perfect_homecoming` / `regretful_stay` / `storm_rescue`
- [x] P0 V2.0 结局 `GestureLayer`：pointer / gesture、滑动子弹时间、点击接信
- [x] P0 V2.0 真实侨批 / 馆藏展示与客家话朗读（如已接入）
- [x] P0 当前阈值 **4 封**、**4 关** 终局 —— 需改为 **5 + bloodDebtCount** 与 **路线终点**
- [x] P0 更新 `progression` 终局判定与 `endingType` 分支条件
- [x] P0 更新结局 copy / 信件数量与透支、典当次数挂钩
- [x] P1 V3.1 终极情感字幕（替换或补充现有结局字幕）
- [x] P1 风浪动画强化：AI 信 + 真实馆藏信混排飞舞
- [x] P0 单元测试：阈值 5、透支后阈值 6/7、三种结局条件
- [x] P0 E2E 已有 `endings.spec.ts` —— 需更新为 V3.1 阈值与路线终点

---

## Feature J — 棋子、商店、人口（继承 V2.0）

> 5 战斗棋 + 水客 / 乡贤；2 星上限；短局经济参数。

### 任务清单

- [x] P0 棋子数据、商店、人口、2 星合成、出售规则
- [x] P0 水客 / 乡贤在商店与棋盘全流程
- [x] P0 路线迁移后：商店刷新 / 工资与「节点底薪」语义对齐（避免双重发放）
- [x] P0 确认升人口 4 金、刷新 1 金与 V3.1 平衡表一致
- [x] P0 单元测试：shop、人口、合成

---

## Feature K — UI、Canvas、音效与路演 Juice

### 任务清单

- [x] P0 Canvas 2D 分层、备战 / 战斗 / 结算 HUD
- [x] P0 资源栏、商店条、典当按钮、水客状态、土楼 Buff 展示
- [x] P0 结算面板 + AI 旁白区
- [x] P0 **卷轴路线 UI**（Feature A）
- [x] P0 **典当行 / 篝火专用面板**（Feature F、G）
- [x] P0 **乡音符开局层**（Feature D）
- [x] P1 **落叶归根全屏 FX**（Feature E）
- [x] P1 典当按钮高风险视觉、水客危机反馈、土楼阶段过场
- [x] P0 Playwright 截图：桌面 / 移动端卷轴 + 新节点不重叠
- [x] P0 E2E：新节点类型按钮可点击、状态可见

---

## Feature L — 存档、设置与离线降级

### 任务清单

- [x] P0 存档键 `kepi.snapshot`、Zod schema、坏档回退
- [x] P0 V2 snapshot version 2 与 migrate 检测
- [x] P0 schema 增加 V3.1 字段：`journeyIndex`、`bloodDebtCount`、`currentNodeId` 等
- [x] P0 V2 → V3 存档迁移或安全丢弃策略
- [x] P0 AI 失败走 fallback，不中断结算（V2 已有，需配合 1500ms 改造）
- [x] P0 设置：`gestureEnabled`（`src/lib/storage/settings.ts`）
- [x] P1 设置：pointer 默认策略、字幕、音量（部分已有则标记完成）
- [x] P0 断网完整跑通一局（路线 + 熔断 fallback）

---

## Feature M — 调试、测试与路演交付

### 任务清单

- [x] P0 调试页已有快照 / 快捷 action（`src/app/debug/page.tsx`），缺 V3.1 快捷项
- [x] P0 调试：一键跳转到指定 journey 节点
- [x] P0 调试：一键设置 `bloodDebtCount`、阈值 5 / 6 / 7
- [x] P0 调试：一键触发篝火 / 典当行 phase
- [x] P0 调试：一键模拟 AI 1500ms 超时
- [x] P0 调试：一键触发乡音符 Buff / 落叶归根
- [x] P0 Vitest：engine 核心（economy、battle、progression、tulouBuff、assassin）
- [x] P0 E2E：smoke、main-path、pawn-kebi、water-guest、endings、full-run
- [x] P0 补齐单测：journey、双向典当、campfire 白名单、opening buff
- [x] P0 补齐 E2E：路线推进、透支阈值、1500ms fallback
- [x] P1 路演脚本：推荐操作路径（透支开局 → 护水客 → 篝火 → 终点抓信）
- [x] P0 交付前 `pnpm lint`、`pnpm test`、`pnpm build`
- [x] P1 交付前 `pnpm test:e2e`

---

## Feature N — 文档与口径对齐

> PRD §9.8：避免开发 / 素材 / 测试按不同阈值推进。

### 任务清单

- [x] P1 新增 `kepi_data-structures_v2.md`（JourneyNode、PawnState、CampfireEffect、NarrativeTags）
- [x] P1 更新 `kepi_assets-and-media-plan_v2.md` 增加 V3.1 小节（卷轴 UI、乡音符、落叶归根 FX、典当仪式）
- [x] P1 更新 `AGENTS.md` / 架构文档中的流程描述为 V3.1 路线式
- [x] P2 归档 V2.0 专用阈值说明，避免与 V3.1 混读

---

## Feature O — V3.2 / V3.3  backlog（非 P0）

> 来源：PRD V3.1 §7，不明显增加系统复杂度前提下推进。

### 任务清单

- [ ] P2 少量战斗规则变化（节点间敌人 modifier、场地效果）
- [ ] P2 篝火选择直接影响下一场战斗或资源（扩展白名单）
- [ ] P2 结局交互：亲手送出最后一封客批，情感高潮由玩家完成
- [ ] P2 AI 对手动态难度（V2 todo 已列，继续延后）

---

## Feature 优先级总表

| Feature | 名称 | 优先级 | 当前状态 | 交付判断 |
|---|---|---|---|---|
| A | 归乡路线与卷轴图 | P0 | 已完成 | 7 节点可推进，卷轴可见 |
| B | 双向典当经济 | P0 | 已完成 | 当信 + 透支，阈值动态 |
| C | 极限自走棋核心 | P0 | 已完成（V2） | 迁移后回归通过 |
| D | 开局乡音符盲盒 | P0 | 已完成 | pointer 抓取可演示 |
| E | 落叶归根 Juice | P1 | 数值已完成 | 全屏 FX 可后续补美术 |
| F | 客批典当行节点 | P0 | 已完成 | 路线节点内双向典当 |
| G | 篝火夜话 | P0 | 已完成 | 二选一 + 本地效果 + fallback |
| H | AI 熔断与旁白 | P0 | 已完成 | 1500ms + 标签 fallback |
| I | 阈值与结局 | P0 | 已完成 | 5 + 透支、情感字幕 |
| J | 棋子商店 | P0 | 已完成（V2） | 与节点经济对齐 |
| K | UI / Canvas / Juice | P0–P1 | 已完成 | 新节点 UI + 路演稳定 |
| L | 存档设置 | P0 | 已完成 | V3 字段 + 断网可玩 |
| M | 调试测试交付 | P0 | 已完成 | lint / test / build 通过 |
| N | 文档口径 | P1 | 已完成 | 数据结构 v2 + AGENTS |
| O | V3.2 / V3.3 | P2 | backlog | 非黑客松 P0 |

---

## 风险与待验证项

- [x] P0 **路线 + 旧状态机并存**：迁移期避免 `stage` 与 `journeyIndex` 双轨漂移
- [x] P0 **典当滥用**：透支后阈值升高，UI 需清晰展示「归乡需要 x 封」
- [x] P0 **水客前期暴毙**：路线变长后评估是否需首战斗保护
- [x] P1 **Buff 叠加失衡**：土楼 + 乡音符 + 落叶归根 + 透支经济
- [x] P1 **AI 1500ms 过短**：fallback 质量决定路演叙事观感，需策划足量文案
- [x] P1 **摄像头现场**：默认 pointer，手势仅作增强
- [x] P1 **单局时长**：6–8 节点目标 10–12 分钟，需实测 prep 30s 是否过长
- [x] P2 **文档残留**：旧版 4 关 / 阈值 4 的测试与 copy 需全仓扫描更新

---

## 相关文档

- [PRD V3.1](kepi_PRD_V3.1.md)
- [PRD V2.0](kepi_PRD_V2.0.md)
- [TODO v2](kepi_todo_v2.md)
- [TODO v1](kepi_todo_v1.md)
- [架构与技术栈 v1](kepi_architecture-and-tech-stack_v1.md)
- [目录职责与核心接口 v1](kepi_directory-responsibilities-and-core-interfaces_v1.md)
- [数据结构清单 v1](kepi_data-structures_v1.md)
- [素材与媒体计划 v2](kepi_assets-and-media-plan_v2.md)
- [文档模板与命名规范 v1](kepi_document-conventions_v1.md)
