# 《客批》V3.1 开发实现计划

> **目的**：基于最新 PRD V3.1 与当前 Ely 分支代码状态的差异分析，给出分阶段、可执行的开发实现计划
> **依据**：[PRD V3.1](kepi_PRD_V3.1.md)、[PRD V2.0](kepi_PRD_V2.0.md)、[TODO v2](kepi_todo_v2.md)、当前代码审查
> **编写日期**：2026-07-02
> **版本**：v1

---

## 1. 当前状态概览

### 1.1 代码基线

当前代码已**完整落地 PRD V2.0**（4 回合微型局），所有核心功能均有实质实现：

| 模块 | 文件数 | 完成度 | 说明 |
|---|---|---|---|
| 类型定义 `src/types/` | 2 | ✅ 100% | GameSnapshot/Action/Piece/Enemy/Battle 全部定义 |
| 数据配置 `src/data/` | 9 | ✅ 100% | 7 棋子 / 6 敌人 / 4 关卡 / 平衡表 / 3 封馆藏信 / 8 个 fallback |
| 引擎 `src/engine/` | 10 | ✅ 100% | reducer + battle + economy + shop + progression + stateMachine + tulouBuff + waterGuest |
| Store `src/store/` | 4 | ✅ 100% | gameStore / uiStore / fxStore |
| UI 组件 `src/components/` | 40+ | ✅ 95% | Canvas 分层渲染 / 结局场景 / 手势接信 / 21 个 game 组件 |
| 路由/API `src/app/` | 4 | ✅ 100% | 主页 / 调试页 / 结局预览 / AI API 端点 |
| Lib 工具库 `src/lib/` | 50+ | ✅ 100% | AI / game / audio / schemas / storage |
| 单元测试 | 24 | ✅ 广泛覆盖 | 引擎 10 个 + 数据 1 个 + Lib 13 个 |
| E2E 测试 | 7 | ✅ 主路径覆盖 | 冒烟 / 主路径 / 全流程 / 结局 / 调试 / 典当 / 水客 |
| 图片资源 `public/images/` | 70+ | ✅ 100% | board / characters / enemies / ui / ending / effects / cinematics |
| **音频资源** `public/audio/` | 0 | ⚠️ **0%** | bgm / sfx / voice 全部只有 .gitkeep |

### 1.2 V2.0 已落地的核心特性

以下特性在 [TODO v2](kepi_todo_v2.md) 中标记为全部完成（`[x]`）：

- ✅ **极简经济**：固定底薪 5、无利息、无连胜连败、刷新 1 金、升人口 4 金
- ✅ **典当客批**（单向）：PAWN_KEBI action，消耗 1 客批换 15 金，pawnedKebi 计数
- ✅ **死保水客**：水客/乡贤上场参战，水客可被攻击/击杀，胜利+水客存活才产出客批和桑梓
- ✅ **刺客 AI**：械斗火第 4 关必出，开局跳后排优先锁水客
- ✅ **土楼庇护 Buff**：33% 护盾 / 66% 攻速 / 99% 免死，已进入 battle runtime
- ✅ **三结局**：完美归乡 / 遗憾留守 / 风浪抢救
- ✅ **AI 机制叙事旁白**：digital-letter + turn-narrative，含 fallback 降级
- ✅ **Canvas 分层渲染**：背景 / 棋子 / 特效 / 氛围 / 备战特效

### 1.3 V2.0 尚未完成的收尾项

来自 [TODO v2](kepi_todo_v2.md) Feature J / K 的 `[ ]` 项：

| Feature | 待办项 | 数量 |
|---|---|---|
| J - 存档与离线 | Zod schema 更新、旧存档迁移、断网跑通、设置页 | 8 项 |
| K - 调试与交付 | 调试面板更新、一键测试、lint/test/build 通过 | 13 项 |
| I - UI 测试 | Playwright 截图检查、E2E 按钮验证 | 2 项 |
| H - AI 对手 | P2 动态阵容生成 | 1 项 |

---

## 2. V3.1 PRD 差异分析

### 2.1 架构级变化（需要新增/重构模块）

| # | V3.1 新需求 | 当前状态 | 影响范围 | 工作量 |
|---|---|---|---|---|
| **D1** | **归乡路线节点系统**（6-8 节点线性卷轴图） | ❌ 不存在。当前是固定 `prep→battle→settlement→ending` 状态机 | types + data + engine + store + UI（全链路） | **大** |
| **D2** | **篝火夜话节点**（AI 文本二选一 + 本地效果白名单） | ❌ 不存在 | types + data + engine + AI + UI | **中** |
| **D3** | **客批典当行节点**（独立节点，双向典当入口） | ❌ 典当行不是独立节点，当前典当按钮嵌在备战面板 | data + engine + UI | **小-中** |

### 2.2 核心系统变化（需要修改现有模块）

| # | V3.1 新需求 | 当前状态 | 影响范围 | 工作量 |
|---|---|---|---|---|
| **D4** | **双向典当**：策略 B "泣血透支"（0 客批也可用，提升阈值 +1，获 35 金） | ❌ 只有策略 A（PAWN_KEBI：消耗 1 客批换 15 金） | types + engine + store + UI | **中** |
| **D5** | **动态胜利阈值**：`kebiThreshold = 基础5 + bloodDebtCount` | ❌ 阈值固定为 4（V2.0 口径） | types + engine + data | **小** |
| **D6** | **关卡数变更**：从 4 关 → 6-8 节点 | ❌ 当前 `totalStages=4`，`kebiThreshold=4` | data + engine + balance | **小-中** |
| **D7** | **AI 1.5 秒熔断**：客户端 1500ms 超时，标签化传参 | ❌ 当前 15s 客户端 / 12s 服务端超时 | lib/ai + app/api | **小** |
| **D8** | **AI 请求类型扩展**：新增 `narrative-caption` + `campfire-choice-copy` | ❌ 当前只有 `digital-letter` + `turn-narrative` | lib/ai + app/api | **小-中** |
| **D9** | **Fallback 文案重组**：按标签组合分组（惨胜/苟活/碾压/典当/透支/水客死亡） | ⚠️ 有 fallback 但未按 V3.1 标签分组 | data/letters + lib/ai | **小** |
| **D10** | **典当仪式感**：全屏暗下 + 长按烧信 + 金币掉落 | ⚠️ 有典当 UI 但无仪式感动效 | components + fxStore | **中** |

### 2.3 新增玩法特性

| # | V3.1 新需求 | 当前状态 | 影响范围 | 工作量 |
|---|---|---|---|---|
| **D11** | **手势盲盒**（战斗开局抓"乡音符"获 Buff） | ❌ 不存在（结局有 GestureLayer 可复用） | components + engine + data | **中-大** |
| **D12** | **宗族 Juice 大招 "落叶归根"**（最高级羁绊全屏高光） | ❌ 只有基础宗族攻击加成 | engine/battle + components + fxStore | **中** |

### 2.4 PRD V3.1 已指出但代码已解决的风险

| V3.1 风险项 | 代码实际状态 | 结论 |
|---|---|---|
| §9.3 水客仍是后勤位 | ✅ 已改为上场棋子，battle 中可被攻击/击杀 | **已解决** |
| §9.5 土楼 Buff 未进入战斗 | ✅ tulouBuff 模块完整实现（护盾/攻速/免死） | **已解决** |

> **注意**：V3.1 §9 的风险分析基于 2026-07-01 早期代码快照，部分风险在后续开发中已被解决。

### 2.5 非功能性差距

| # | 差距 | 当前状态 | 优先级 |
|---|---|---|---|
| **D13** | 音频资源全部缺失 | `public/audio/` 只有 .gitkeep | P1 |
| **D14** | 文档口径残留（V1.6/V2.0 混合） | data-structures v1 基于 V1.6，assets-plan v2 按 4 关/阈值 4 | P1 |
| **D15** | V2.0 收尾项（存档/调试/测试）未完成 | Feature J/K 共 21 项待办 | P0 |

---

## 3. 实现计划

### 3.0 总体原则

1. **渐进式迁移**：在 V2.0 已稳定基线上逐步叠加 V3.1 特性，不做破坏性重写
2. **引擎优先**：每个特性先落 types → data → engine → store → UI
3. **可随时 demo**：每完成一个阶段都应能 `pnpm dev` 正常运行
4. **路演驱动**：优先实现评委能看到的核心差异化特性

### Phase 1：基础对齐与数值校正（预计 0.5 天）

> **目标**：将 V2.0 的 4 关/阈值 4 口径对齐到 V3.1 的基础参数，并补齐 V2.0 收尾项中的关键阻塞项。

#### 1.1 数值与配置对齐

- [ ] `src/data/balance.ts`：`totalStages` 从 4 改为 6-8（建议先取 7），`kebiThreshold` 基础值从 4 改为 5
- [ ] `src/data/stages.ts`：扩展关卡定义到 7 个节点（先全部定义为战斗节点）
- [ ] `src/types/game.ts`：新增 `bloodDebtCount: number`、`roundPawnCount` 扩展为支持双向
- [ ] `src/engine/constants.ts`：同步更新初始常量

#### 1.2 存档安全（Feature J 关键项）

- [ ] `src/lib/schemas/game.ts`：更新 Zod schema 到新字段
- [ ] `src/lib/storage/migrate.ts`：旧 V2.0 存档直接丢弃并新开局
- [ ] `src/lib/storage/snapshot.ts`：读档失败时显示 toast 并新开局

#### 1.3 验证

- [ ] `pnpm test` 通过（修复因字段变更导致的测试失败）
- [ ] `pnpm dev` 能正常启动并跑完一局

---

### Phase 2：归乡路线节点系统（预计 1-1.5 天）

> **目标**：实现 V3.1 的核心架构变化——从固定 4 关战斗流变为 6-8 节点线性归乡路线。

**推荐节点序列（写死）**：

```
篝火夜话 → 战斗 → 客批典当行 → 战斗 → 篝火夜话 → 极难战斗 → 终点
```

#### 2.1 类型定义

- [ ] `src/types/game.ts`：新增 `JourneyNodeType = 'battle' | 'pawn_shop' | 'campfire'`
- [ ] `src/types/game.ts`：新增 `JourneyNode = { index: number; type: JourneyNodeType; completed: boolean; ... }`
- [ ] `src/types/game.ts`：`GameState` 新增 `journeyIndex: number`、`currentNodeType: JourneyNodeType`
- [ ] `src/types/game.ts`：`ScenePhase` 扩展支持 `'journey_map' | 'campfire' | 'pawn_shop'`
- [ ] `src/types/game.ts`：新增 `GameAction` 类型：`ADVANCE_JOURNEY`、`SELECT_CAMPFIRE_CHOICE`

#### 2.2 数据配置

- [ ] `src/data/journey.ts`（新增）：定义固定 7 节点路线结构
- [ ] `src/data/campfire.ts`（新增）：篝火夜话选项效果白名单（3-5 组，每组 2 个选项）

#### 2.3 引擎实现

- [ ] `src/engine/journey/index.ts`（新增）：节点推进逻辑 `advanceJourney()`、节点类型判断
- [ ] `src/engine/stateMachine/index.ts`：扩展阶段流转支持新 phase
- [ ] `src/engine/index.ts`：reducer 新增 `ADVANCE_JOURNEY`、`SELECT_CAMPFIRE_CHOICE` 处理
- [ ] `src/engine/progression/index.ts`：终点判定改为 journey 结束时统一判

#### 2.4 Store 接入

- [ ] `src/store/gameStore.ts`：新增 `advanceJourney()`、`selectCampfireChoice()` actions

#### 2.5 UI 实现

- [ ] `src/components/game/JourneyMap.tsx`（新增）：极简卷轴地图 UI，显示节点序列与当前位置
- [ ] `src/components/game/CampfireScene.tsx`（新增）：篝火夜话 UI，展示 AI/fallback 文本 + 二选一按钮
- [ ] `src/components/game/PawnShopScene.tsx`（新增）：客批典当行 UI，展示双向典当入口
- [ ] `src/components/game/GameShell.tsx`：更新阶段路由，支持新 phase

#### 2.6 验证

- [ ] 单元测试：节点推进、阶段流转、终点判定
- [ ] 手动验证：从开局到结局能跑通 7 节点路线

---

### Phase 3：双向典当（预计 0.5 天）

> **目标**：实现 V3.1 核心经济杠杆——除了"当信换钱"外，新增"透支未来换钱"。

#### 3.1 策略 A 调整（已有，微调）

- [ ] 确认 PAWN_KEBI 逻辑不变：消耗 1 客批 → +15 金币

#### 3.2 策略 B 新增 "泣血透支"

- [ ] `src/types/game.ts`：新增 `GameAction` 类型 `BLOOD_DEBT`
- [ ] `src/types/game.ts`：确认 `bloodDebtCount` 字段已在 Phase 1 添加
- [ ] `src/engine/economy/index.ts`：实现 `bloodDebt()` — `kebiThreshold += 1`、`gold += 35`、`bloodDebtCount += 1`
- [ ] `src/engine/index.ts`：reducer 处理 `BLOOD_DEBT`
- [ ] `src/engine/progression/index.ts`：胜利判定使用 `kebi >= kebiThreshold`（阈值动态）

#### 3.3 典当仪式感（P1）

- [ ] 典当按钮点击 → 全屏暗下
- [ ] 客批信件出现在屏幕中央
- [ ] 长按鼠标/手势 → 信件边角燃烧 → 金币从灰烬掉落
- [ ] 仪式动画完成后才执行 action

#### 3.4 Store 与 UI

- [ ] `src/store/gameStore.ts`：新增 `bloodDebt()` action
- [ ] `src/components/game/PawnShopScene.tsx`：展示两种典当选项，含代价/收益说明
- [ ] ShopStrip 中保留备战阶段快捷典当入口

#### 3.5 验证

- [ ] 单元测试：双向典当的前置条件、资源变化、阈值变化
- [ ] 手动验证：透支后胜利阈值确实提高

---

### Phase 4：AI 熔断与叙事扩展（预计 0.5 天）

> **目标**：将 AI 调用改为 1.5 秒熔断，新增篝火夜话和旁白 caption 请求类型。

#### 4.1 熔断机制

- [ ] `src/lib/ai/client.ts`：客户端请求超时从 15000ms 改为 1500ms
- [ ] `src/app/api/ai/route.ts`：服务端 provider 超时改为 1200ms
- [ ] 确认超时后无缝切换 fallback，不显示错误/加载

#### 4.2 新增请求类型

- [ ] `src/lib/ai/types.ts`：新增 `narrative-caption` 和 `campfire-choice-copy` 类型
- [ ] `src/lib/ai/prompt.ts`：新增篝火夜话 prompt 模板，输入为 `NarrativeTags`
- [ ] `src/lib/ai/server.ts`：处理新类型的 AI 生成
- [ ] `src/app/api/ai/route.ts`：路由分发新类型

#### 4.3 标签化 Fallback 重组

- [ ] `src/lib/ai/fallback.ts`：按标签组合分组 fallback 文案（惨胜/苟活/碾压/典当/透支/水客死亡）
- [ ] `src/data/letters.ts`：扩充 fallback 文案池，至少覆盖所有标签组合
- [ ] 篝火夜话 fallback：至少 3 组预设二选一文案

#### 4.4 标签化传参

- [ ] `src/lib/ai/types.ts`：定义 `NarrativeTags`（deathCount, didPawn, didBloodDebt, winStreak, waterGuestSurvived, homeRepairMilestone）
- [ ] AI 输出严格限制为 `{ text: string }`

#### 4.5 验证

- [ ] 单元测试：1.5 秒超时后 fallback 正常触发
- [ ] 模拟 AI 不可用：全流程不卡顿

---

### Phase 5：手势盲盒（预计 0.5-1 天）

> **目标**：战斗开局增加"乡音符"掉落抓取，与结局手势形成首尾呼应。P0 先做 pointer 版，手势识别作为增强。

#### 5.1 Buff 定义

- [ ] `src/types/game.ts`：新增 `BattleOpeningBuff` 类型（3 种以内，全部本地枚举）
- [ ] `src/data/balance.ts`：定义 3 种乡音符 Buff 效果（如攻击+15%/护甲+10/回血200）

#### 5.2 引擎集成

- [ ] `src/engine/battle/index.ts`：`createBattleSnapshot()` 支持接收开局 Buff
- [ ] 战斗开始时应用选中的乡音符 Buff（如果抓到）
- [ ] 超时未抓到 → 不应用 Buff，战斗正常开始

#### 5.3 UI 实现

- [ ] `src/components/game/XiangyinCapture.tsx`（新增）：乡音符掉落 + 点击/手势抓取 UI
- [ ] P0：pointer 点击抓取（复用 GestureLayer 的 pointer 模式）
- [ ] P1：摄像头手势识别增强（复用结局 GestureLayer）
- [ ] 抓取窗口 3-5 秒，超时自动关闭

#### 5.4 降级

- [ ] 摄像头权限失败 → 不弹阻断式错误，自动切换 pointer 模式
- [ ] 路演设备不稳定 → 默认 pointer，保留手势开关

#### 5.5 验证

- [ ] pointer 模式下能抓到乡音符并看到 Buff 效果
- [ ] 超时后战斗正常开始

---

### Phase 6：宗族 Juice 大招 "落叶归根"（预计 0.5 天）

> **目标**：凑齐宗族最高级羁绊时触发全屏高潮特效。

#### 6.1 触发条件定义

- [ ] `src/data/balance.ts`：定义 Juice 大招触发条件（如 4 个不同类型 hakka 棋子上场）
- [ ] `src/data/balance.ts`：定义 Juice 效果（全体高额攻速 + 吸血，持续 N 秒）

#### 6.2 引擎实现

- [ ] `src/engine/battle/index.ts`：检测最高级宗族羁绊 → 触发临时状态
- [ ] 实现攻速倍率和吸血效果（有持续时间，避免永久滚雪球）
- [ ] `BattleEvent` 新增 `juice_ultimate` 事件类型

#### 6.3 表现层

- [ ] `src/store/fxStore.ts`：新增 `juiceUltimate` 特效触发
- [ ] `src/components/game/canvas/renderEffects.ts`：落叶、归潮、土楼灯火呼应的全屏高光
- [ ] P1：音效配合

#### 6.4 验证

- [ ] 单元测试：触发条件判定、数值效果、持续时间结束后恢复
- [ ] 手动验证：4 个不同类型棋子上场时视觉高光出现

---

### Phase 7：V2.0 收尾 + 文档对齐 + 路演交付（预计 1 天）

> **目标**：补齐 V2.0 未完成的测试/调试/存档项，对齐文档口径，确保路演版本稳定。

#### 7.1 调试面板更新

- [ ] 调试面板支持 V3.1 字段：journeyIndex、bloodDebtCount、kebiThreshold
- [ ] 一键跳到指定节点（战斗/篝火/典当行）
- [ ] 一键设置 homeRepair 33/66/99
- [ ] 一键触发三种结局
- [ ] 一键模拟 AI 失败验证 fallback

#### 7.2 测试补齐

- [ ] 补齐引擎单测：journey 推进、双向典当、篝火效果、动态阈值
- [ ] 补齐 E2E：新局 → 节点推进 → 典当 → 篝火 → 战斗 → 结局
- [ ] `pnpm lint` 通过
- [ ] `pnpm test` 通过
- [ ] `pnpm build` 通过

#### 7.3 文档对齐

- [ ] 新增 `docs/kepi_data-structures_v2.md`：对齐 V3.1 字段
- [ ] `AGENTS.md`：更新项目速览中的版本号和关键变更
- [ ] [TODO v2](kepi_todo_v2.md)：追加 V3.1 迁移清单

#### 7.4 路演准备

- [ ] 路演演示脚本：推荐操作路径与关键看点
- [ ] 断网场景验证：完整跑通一局
- [ ] 确认 AI 熔断在弱网环境下表现正常

---

## 4. 音频资源补齐（独立工作流）

> 音频是当前项目 **唯一的零完成度模块**，可与功能开发并行推进。

| 优先级 | 音频 | 用途 | 文件路径 |
|---|---|---|---|
| P0 | 主 BGM | 对局循环 | `public/audio/bgm/kepi_bgm_main.mp3` |
| P0 | 典当音效 | 沉重印章 + 金币叮当 | `public/audio/sfx/kepi_sfx_pawn.mp3` |
| P0 | 水客死亡音效 | 坠落 + 客家话叹息 | `public/audio/sfx/kepi_sfx_waterguest-death.mp3` |
| P0 | 购买/刷新音效 | 商店操作 | `public/audio/sfx/kepi_sfx_shop-*.mp3` |
| P0 | 土楼阶段音效 | 33%泉水/66%砌墙/99%灯笼 | `public/audio/sfx/kepi_sfx_tulou-*.mp3` |
| P0 | 客家话朗读 | 结局侨批朗读 | `public/audio/voice/kepi_voice_letter-*.mp3` |
| P1 | 水客危机音效 | 心跳/呼吸 | `public/audio/sfx/kepi_sfx_waterguest-danger.mp3` |
| P1 | 战斗音效 | 攻击/升星 | `public/audio/sfx/kepi_sfx_battle-*.mp3` |
| P1 | 结局 BGM | 风浪/归乡 | `public/audio/bgm/kepi_bgm_ending-*.mp3` |

---

## 5. 优先级与时间线总览

```
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 1: 基础对齐 (0.5d)                                          │
│    ├─ 数值校正 (totalStages, kebiThreshold, bloodDebtCount)        │
│    ├─ 存档安全 (Zod schema, 旧存档丢弃)                             │
│    └─ 测试修复                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  Phase 2: 归乡路线节点系统 (1-1.5d)  ★ 最大架构变更                  │
│    ├─ JourneyNode 类型 + 静态路线数据                               │
│    ├─ 引擎: journey 推进 + 状态机扩展                               │
│    ├─ UI: 卷轴地图 + 篝火场景 + 典当行场景                          │
│    └─ 战斗节点复用现有 battle 模块                                   │
├─────────────────────────────────────────────────────────────────────┤
│  Phase 3: 双向典当 (0.5d)                                          │
│    ├─ 泣血透支 (BLOOD_DEBT action)                                 │
│    ├─ 动态阈值 (base 5 + bloodDebtCount)                           │
│    └─ 典当仪式感 (P1: 长按烧信动画)                                │
├─────────────────────────────────────────────────────────────────────┤
│  Phase 4: AI 熔断与叙事扩展 (0.5d)                                 │
│    ├─ 1.5s 熔断                                                    │
│    ├─ narrative-caption + campfire-choice-copy                      │
│    └─ 标签化 fallback 重组                                         │
├─────────────────────────────────────────────────────────────────────┤
│  Phase 5: 手势盲盒 (0.5-1d)  P0 pointer 版                        │
│    ├─ 乡音符 Buff 定义                                             │
│    ├─ 战斗开局抓取 UI                                              │
│    └─ 降级策略                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Phase 6: 宗族 Juice 大招 (0.5d)                                   │
│    ├─ 最高级羁绊触发条件                                            │
│    ├─ 攻速+吸血临时效果                                             │
│    └─ 全屏落叶归根表现                                              │
├─────────────────────────────────────────────────────────────────────┤
│  Phase 7: 收尾 + 文档 + 路演 (1d)                                  │
│    ├─ 调试面板更新                                                  │
│    ├─ 测试补齐                                                     │
│    ├─ 文档口径对齐                                                  │
│    └─ lint + test + build 通过                                     │
└─────────────────────────────────────────────────────────────────────┘
                            │
                    音频资源补齐 (并行)
```

**预计总工期**：4-5 天（不含音频资源制作）

---

## 6. 风险与缓解

| 风险 | 影响 | 缓解方案 |
|---|---|---|
| 归乡路线系统与现有状态机冲突 | 阶段流转混乱 | 把战斗节点完全复用现有 battle 模块，journey 作为外层编排 |
| 双向典当导致数值失衡 | 透支过多导致不可能通关 | UI 实时提示当前阈值；典当行节点展示"当前客批 / 需要客批" |
| 篝火夜话效果白名单设计不当 | 效果过强/过弱破坏平衡 | 效果控制在 ±15% 范围内；效果只持续 1 场战斗 |
| AI 1.5 秒熔断导致频繁 fallback | 评委看到的全是预设文案 | fallback 文案池做到足够丰富且高质量 |
| 手势盲盒在路演设备不稳定 | 摄像头卡顿或识别失败 | P0 默认 pointer 模式；手势只作为增强 |
| 音频资源长期缺失 | 游戏体验大打折扣 | 优先补齐 BGM + 3 个关键音效，其余用静音降级 |

---

## 7. 相关文档

- [PRD V3.1](kepi_PRD_V3.1.md) — 最新产品需求，包含归乡路线、双向典当、AI 熔断等
- [PRD V2.0](kepi_PRD_V2.0.md) — 当前代码基线对应的 PRD
- [PRD V1.6](kepi_PRD_V1.6.md) — 原始完整设计
- [TODO v2](kepi_todo_v2.md) — V2.0 feature 式开发清单
- [架构与技术栈 v1](kepi_architecture-and-tech-stack_v1.md)
- [数据结构清单 v1](kepi_data-structures_v1.md)
- [素材与媒体计划 v2](kepi_assets-and-media-plan_v2.md)
- [UI 设计规范 v1](kepi_ui-design-spec_v1.md)
