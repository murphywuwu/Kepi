# 《客批》素材与媒体计划 v3

> 目的：按 PRD V3.1「微肉鸽线性卷轴 + 情感自走棋」方案，列出项目所需的全部静态 / 媒体 / 文案资源，并对照仓库现有文件打勾
> 依据：[PRD V3.1](kepi_PRD_V3.1.md)、[素材与媒体计划 v2](kepi_assets-and-media-plan_v2.md)、[美术风格设定 v1](kepi_art-style-design_v1.md)、[文档模板与命名规范 v1](kepi_document-conventions_v1.md)、`src/data/assets.ts`
> 更新：2026-07-02 — 篝火夜话方案 C：按 scenario 场景底图 + 续读 CTA；新增南洋余温 / 险路夜话出图清单

## 图例

| 标记 | 含义 |
|---|---|
| `[x]` | 文件已存在于 `public/` 或 `docs/assets/`（2026-07-02 扫描） |
| `[ ]` | 尚未交付；代码侧有 CSS / 文案降级可跑通 Demo |
| `[~]` | 部分满足：路径已引用但文件缺失，或复用其他资产顶替 |

**扫描摘要**（`public/`）：

| 类别 | 已有 | 计划 P0 | 缺口 |
|---|---:|---:|---:|
| 棋盘 / 场景 | 12 | 14 | 2 |
| 角色立绘 | 7 | 7 | 0 |
| 敌人立绘 | 6 | 6 | 0 |
| 过场 / 电影镜头 | 7 | 12 | 5 |
| 结局 | 7 | 10 | 3 |
| UI 图标 / 纹理 | 20 | 32 | 12 |
| 特效 | 9 | 14 | 5 |
| 音频 | 0 | 18 | 18 |
| V3.1 路线 / 节点专属 | 0 | 12 | 12 |
| 风格参考（docs） | 9 | 9 | 0 |
| 代码内文案池 | 已实现 | — | — |

出图 prompt 与两步法生产规范沿用 [v2 §1–§2](kepi_assets-and-media-plan_v2.md)，本文仅标注 V3.1 增量与口径变更。

---

## 0. V3.1 机制口径（素材对齐）

与 V2.0 素材计划的关键差异：

| 维度 | V2.0（v2 文档旧口径） | V3.1（本文口径） |
|---|---|---|
| 局外结构 | 4 回合固定战斗 | 7 节点归乡路线（战斗 / 典当行 / 篝火） |
| 胜利阈值 | 4 封客批 | 基础 **5 封 + bloodDebtCount** |
| 经济核心 | 单向典当 15 金 | **当信 15 金** + **透支未来 35 金 / 阈值 +1** |
| 手势交互 | 主要结局抓信 | **开局乡音符** + 结局抓信首尾呼应 |
| 羁绊高光 | 攻击加成 | 最高级宗族触发 **落叶归根** Juice |
| 土楼机制 | 33 / 66 / 99 Buff | 同左；视觉可保留 6 档细化，机制阈值映射 33 / 66 / 99 |
| AI 旁白 | 数字客批文案 | 机制旁白 + 篝火夜话；**1500ms 熔断** + 本地 fallback |

---

## 1. 素材总原则

- 素材优先服务 **10–12 分钟单局**主流程：路线推进 → 死保水客 → 双向典当 → 土楼反哺 → 风浪抓信。
- 断网可玩：关键图 / 音 / 文案必须本地可用；AI 仅填充文本，超时无缝 fallback。
- 角色 / 敌人：白底全身赛璐珞平涂 → 抠透明底进 `public/images/characters|enemies/`。
- 场景：国漫动画电影横版大图，预留上下 UI 安全区。
- UI：暖木框 + 米宣纸 + 侨批信纸边；图标圆徽章、图内无文字。
- V3.1 新增表现可先用 **CSS / Canvas / 代码文案** 降级，不阻断 Demo。

---

## 2. P0 必做素材

### 2.1 核心场景与棋盘

#### 2.1A 土楼内部（战斗棋盘背景 · 6 档视觉）

机制阈值 33 / 66 / 99 映射到 `homeRepairVisualStage` 六档；素材按修复进度切换。

| 状态 | 建议路径 | 尺寸 | 已有 |
|---|---|---|:---:|
| 破败态 | `public/images/board/kepi_tulou-stage1-broken.png` | 1600×900 | [x] |
| 井台复水 | `public/images/board/kepi_tulou-stage2-well.png` | 1600×900 | [x] |
| 墙门修缮 | `public/images/board/kepi_tulou-stage3-gate.png` | 1600×900 | [x] |
| 屋瓦补齐 | `public/images/board/kepi_tulou-stage4-roof.png` | 1600×900 | [x] |
| 祠堂点灯 | `public/images/board/kepi_tulou-stage5-lanterns.png` | 1600×900 | [x] |
| 桑梓焕新 | `public/images/board/kepi_tulou-stage6-renewed.png` | 1600×900 | [x] |
| 阶段过渡 1→2 | `public/images/board/kepi_tulou-transition-1-2.png` | 1600×900 | [x] |
| 阶段过渡 2→3 | `public/images/board/kepi_tulou-transition-2-3.png` | 1600×900 | [x] |
| 战斗层通用底 | `public/images/board/kepi_battle-background.png` | 1600×900 | [x] |
| 主背景备用 | `public/images/board/kepi_tulou-board-main.png` | 1600×900 | [x] |
| 修缮中间态（额外） | `public/images/board/kepi_tulou-stage2-repair.png` | 1600×900 | [x] |
| 翻新中间态（额外） | `public/images/board/kepi_tulou-stage3-renewed.png` | 1600×900 | [x] |

#### 2.1B 土楼四状态机制图（33 / 66 / 99 · P1 可降）

同一机位、同一构图，对应 PRD §4.2 三档反哺 Buff 的过场 / 地图背景。

| 阶段 | 机制 | 建议路径 | 已有 |
|---|---|---|:---:|
| 修缮·初见 | 33% 生命护盾 | `public/images/board/kepi_tulou-tier33-repair.png` | [ ] |
| 翻新·同心 | 66% 攻速 +15% | `public/images/board/kepi_tulou-tier66-renew.png` | [ ] |
| 焕然·不屈 | 99% 免死一次 | `public/images/board/kepi_tulou-tier99-glow.png` | [ ] |
| 土楼外观四状态 | 地图背后修复条视觉 | `public/images/board/kepi_tulou-exterior-{ruined,repair,renew,glow}.png` | [ ] |

> 降级：六档 stage 图 + HUD 护盾 / 攻速 / 免死图标即可演示；四状态大图可后补。

#### 2.1C 归乡卷轴路线（V3.1 新增 · P0 表现）

| 资产 | 建议路径 | 用途 | 已有 | 当前降级 |
|---|---|---|:---:|---|
| 卷轴横条底图 | `public/images/ui/kepi_journey-scroll-bg.png` | 南洋→故乡航线图底 | [ ] | `JourneyScroll` CSS 圆点 + `WoodPanel` |
| 节点图标 · 战斗 | `public/images/ui/kepi_journey-node-battle.png` | 战斗节点 | [ ] | 文字标签 |
| 节点图标 · 典当行 | `public/images/ui/kepi_journey-node-pawn.png` | 客批典当行 | [ ] | 文字标签 |
| 节点图标 · 篝火 | `public/images/ui/kepi_journey-node-campfire.png` | 篝火夜话 | [ ] | 文字标签 |
| 当前节点高亮环 | `public/images/ui/kepi_journey-node-current.png` | 路线高亮 | [ ] | CSS `ring-amber` |
| 已完成节点标记 | `public/images/ui/kepi_journey-node-done.png` | 已过节点 | [ ] | CSS  accent 填色 |
| 土楼修复进度条纹理 | `public/images/ui/kepi_journey-home-repair-bar.png` | 卷轴下修复条 | [ ] | CSS 渐变条 |

---

### 2.2 棋子与敌人立绘

#### 2.2A 客家武力棋子（5）

| ID | 名称 | 路径 | 已有 |
|---|---|---|:---:|
| `farmer` | 农夫 | `public/images/characters/kepi_farmer.png` | [x] |
| `guard` | 围屋守卫 | `public/images/characters/kepi_guard.png` | [x] |
| `teacher` | 教书先生 | `public/images/characters/kepi_teacher.png` | [x] |
| `fengshui` | 风水先生 | `public/images/characters/kepi_fengshui.png` | [x] |
| `patriarch` | 族长 | `public/images/characters/kepi_patriarch.png` | [x] |

#### 2.2B 上场后勤棋子（2 · 死保水客核心）

| ID | 名称 | 路径 | 已有 |
|---|---|---|:---:|
| `shuike` | 水客 | `public/images/characters/kepi_shuike.png` | [x] |
| `xiangxian` | 乡贤 | `public/images/characters/kepi_xiangxian.png` | [x] |

#### 2.2C 遗忘军团敌人（6）

| ID | 名称 | 路径 | 已有 |
|---|---|---|:---:|
| `qianhai-stele` | 迁海碑 | `public/images/enemies/kepi_qianhai-stele.png` | [x] |
| `luyin-clerk` | 路引关吏 | `public/images/enemies/kepi_luyin-clerk.png` | [x] |
| `zhuzai-contract` | 猪仔契 | `public/images/enemies/kepi_zhuzai-contract.png` | [x] |
| `ehu-mountain` | 饿虎山 | `public/images/enemies/kepi_ehu-mountain.png` | [x] |
| `redhead-ship` | 红头船 | `public/images/enemies/kepi_redhead-ship.png` | [x] |
| `melee-fire` | 械斗火（刺客） | `public/images/enemies/kepi_melee-fire.png` | [x] |

#### 2.2D 升星变体（P1）

| 资产 | 路径模式 | 已有 |
|---|---|:---:|
| 各棋子 2★ / 3★ 立绘 | `public/images/characters/kepi_{id}_star{2,3}.png` | [ ] |

> 当前 1★–3★ 共用同一张 PNG（`src/data/pieces.ts`）。

出图 prompt 见 [v2 §2.2C–D](kepi_assets-and-media-plan_v2.md)。

---

### 2.3 双向典当行（V3.1 核心 · P0）

| 资产 | 建议路径 | 用途 | 已有 | 降级 |
|---|---|---|:---:|---|
| 典当行暗场遮罩 | `public/images/cinematics/kepi_pawn-shop-vignette.png` | 全屏暗下 | [ ] | `bg-black/45` |
| 客批信件特写（燃烧前） | `public/images/cinematics/kepi_pawn-letter-intact.png` | 长按燃烧仪式 | [ ] | 卡牌 UI |
| 信纸燃烧序列 | `public/images/cinematics/kepi_pawn-letter-burning.png` | 当信动画 | [ ] | CSS `kepi-pawn-burn` |
| 灰烬落金币 | `public/images/cinematics/kepi_pawn-gold-fall.png` | 兑现资源 | [ ] | Toast + 数值跳变 |
| 透支未来视觉（泣血印） | `public/images/cinematics/kepi_blood-debt-seal.png` | 阈值 +1 仪式 | [ ] | 文案提示 |
| 当信图标 | `public/images/ui/kepi_icon_pawn-kebi.png` | HUD / 典当按钮 | [ ] | 文字按钮 |
| 透支图标 | `public/images/ui/kepi_icon_blood-debt.png` | 透支按钮 | [ ] | 文字按钮 |
| 典当高风险按钮态 | `public/images/ui/kepi_ui_pawn-button-danger.png` | 9-slice 按钮 | [ ] | `kepi-pawn-card` CSS |
| 典当沉重印章音效 | `public/audio/sfx/kepi_pawn-stamp.mp3` | 燃烧开始 | [ ] | 复用 `kepi_refresh` [~] |
| 金币掉落音效 | `public/audio/sfx/kepi_pawn-gold.mp3` | 兑现 | [ ] | 复用 `kepi_buy` [~] |

---

### 2.4 乡音符 · 开局 Buff 盲盒（V3.1 · P0）

| 资产 | 建议路径 | 用途 | 已有 | 降级 |
|---|---|---|:---:|---|
| 乡音符飘落 icon | `public/images/ui/kepi_icon_opening-note.png` | 开局 Buff 盲盒 | [ ] | CSS 圆形 `♪` 按钮 |
| 抓取成功 FX | `public/images/effects/kepi_effect-opening-note-catch.png` | 抓住反馈 | [ ] | Toast |
| 抓取失败 / 超时 FX | `public/images/effects/kepi_effect-opening-note-miss.png` | 弱 Buff 提示 | [ ] | Toast |
| 三种 Buff 徽章 | `public/images/ui/kepi_icon_buff-{ancestral,rations,wind}.png` | 祖灵庇佑 / 行路干粮 / 顺风归潮 | [ ] | 文字描述 |
| 手势模式提示 | 复用 `kepi_ending-gesture.png` | 摄像头抓取说明 | [x] | pointer 点击 |

Buff 枚举见 `src/data/battleBuffs.ts`（≤3 种 + 超时弱 Buff）。

---

### 2.5 落叶归根 · 宗族 Juice 大招（V3.1 · P1）

| 资产 | 建议路径 | 用途 | 已有 | 降级 |
|---|---|---|:---:|---|
| 全屏落叶 overlay | `public/images/effects/kepi_effect-leaf-fall-overlay.png` | 落叶归根视觉高潮 | [ ] | 引擎 `leafFallStart` 事件 |
| 土楼灯火扫光 | `public/images/effects/kepi_effect-leaf-fall-lanterns.png` | 归潮 + 灯火呼应 | [ ] | Canvas 待接 |
| 大招 stinger 音效 | `public/audio/sfx/kepi_leaf-fall-stinger.mp3` | 触发瞬间 | [ ] | 无 |

触发条件：宗族最高级羁绊（4 人同族），见 PRD §3.3。

---

### 2.6 篝火夜话（V3.1 · P1 表现 / P0 文案）

> **方案 C（2026-07-02）**：每个 `CampfireScenario` 绑定独立 cinematic 底图（`campfire.ts` → `backgroundKey`）；火光粒子仅作 `subtle` 补光，南洋余温场景内火已画入底图故 `glow: none`。代码 fallback：`onError` 回退 `kepi_campfire-vignette.png`。

| 资产 | 建议路径 | 用途 | 已有 | 降级 |
|---|---|---|:---:|---|
| 篝火通用暗角 | `public/images/cinematics/kepi_campfire-vignette.png` | 缺图 fallback / 第三套文案 | [x] | `bg-black/50` |
| **南洋余温底图** | `public/images/cinematics/kepi_campfire-nanyang-rations.png` | camp-1 opening · 同乡递半块粿条 | [x] | 通用 vignette |
| **险路夜话底图** | `public/images/cinematics/kepi_campfire-old-route.png` | camp-2 · 老水客低声讲险路 | [x] | 通用 vignette |
| 火光粒子（subtle） | `public/images/effects/kepi_effect-campfire-glow.png` | camp-2 底部补光；camp-1 不叠加 | [x] | 无 |
| 选项卡片底（旧） | `public/images/ui/kepi_ui_campfire-choice.png` | 已弃用；B+ 改纸卷内选项行 | [x] | — |
| 叙事纸卷底 | `public/images/ui/kepi_ui_narrative-paper.png` | opening + 抉择 Beat（B+ 粿条中缝） | [x] | CSS 渐变 |
| 夜话本地文案 | `src/data/campfire.ts` | fallback 白名单 | [x] | — |
| AI 夜话 copy | API `campfire-choice-copy` | 仅文本 | [x] 逻辑 | 超时回本地 |

#### 2.6A 场景底图出图 prompt（方案 C）

**共通约束**（与 `kepi_campfire-vignette.png` 同套）：

- 16:9 横图，纸纹水彩 / 暗角 vignette，**中心留空**给 UI 文案卡
- 篝火偏小、位于画面 **下方 15–25%**，柔光已画入底图，**不要**独立大火占满画面
- 无文字、无现代物品；色调暖褐 + 深绿边饰

**`kepi_campfire-nanyang-rations.png`（camp-1 · 南洋余温）**

```txt
温润东方奇幻水彩，16:9 横图，纸纹暗角 vignette。南洋海岸夜 camp，画面下方一小堆篝火，
两位客家旅人剪影对坐，其中一人伸手递出半块白色粿条（米食），热气淡淡上升。
前景可有竹席、陶碗、侨批信封角；左右缘竹影与远海帆影。中心区域较暗留白给 UI。
篝火小而不抢戏，无文字，无现代物品，暖琥珀色调。
```

**`kepi_campfire-old-route.png`（camp-2 · 险路夜话）**

```txt
温润东方奇幻水彩，16:9 横图，纸纹暗角 vignette。夜风紧的丛林小径旁，
一位年长水客剪影与主角对坐，面前一小堆篝火。老水客手势像在指向前方险路，
远处若隐若现的契约卷轴或路标符号（抽象，不写实文字）。中心留白给 UI，篝火偏小，
色调偏冷青褐 + 暖火点，无文字，无现代物品。
```

**代码接线**：`src/data/campfire.ts`（`backgroundKey` / `glow`）→ `CampfirePanel` → `src/data/assets.ts` manifest。

#### 2.6B 抉择 Beat UI（方案 B+ · 纯 CSS）

- **容器**：与 opening 同宽 `max-w-xl` + `kepi-campfire-narrative` 纸卷，暗底暖字。
- **选项行**：`kepi-campfire-choice-option` 虚线分隔；选中左侧/右侧 amber 内描边 + 淡暖光。
- **camp-1 粿条隐喻**：`kepi-campfire-choice-list--split` — 桌面两列 + 中央竖缝（`::after` 渐变线），左「分给大家」/ 右「寄回修屋」像掰开的两半。
- **确认 CTA**：`kepi-campfire-confirm`，与 `kepi-campfire-continue`（听下去）同族；保留「选中 → 今夜如此」两步；**footer 固定于卡片底部，整卡不滚动**。
- **无需新图**；`kepi_ui_campfire-choice.png` 不再用于抉择 Beat。
- **布局**：纸卷 **顶对齐**（`justify-start`），落在画面上方留白，避免遮挡左右人物与递粿条动作；背景 `object-position` 略上移；抉择 Beat 限高可滚动。

---

### 2.7 战斗反馈 · 水客 · 刺客 · 土楼 Buff

#### 2.7A 水客危机（死保核心）

| 资产 | 建议路径 | 已有 | 降级 |
|---|---|:---:|
| 低血量边缘 vignette | `public/images/ui/kepi_ui_waterguest-danger-vignette.png` | [ ] | HUD 文案 |
| 水客安全图标 | `public/images/ui/kepi_icon_waterguest-safe.png` | [ ] | — |
| 水客危急图标 | `public/images/ui/kepi_icon_waterguest-danger.png` | [ ] | — |
| 水客战死图标 | `public/images/ui/kepi_icon_waterguest-lost.png` | [ ] | — |
| 收信动效 | `public/images/effects/kepi_effect-shuike-letter-pickup.png` | [x] | — |
| 低血量呼吸 / 心跳音 | `public/audio/sfx/kepi_waterguest-heartbeat.mp3` | [ ] | — |
| 水客战死音效 | `public/audio/sfx/kepi_waterguest-death.mp3` | [ ] | — |

#### 2.7B 械斗火刺客

| 资产 | 建议路径 | 已有 | 降级 |
|---|---|:---:|
| 后排预警圈 | `public/images/ui/kepi_ui_warning-ring-assassin.png` | [ ] | 代码预警 |
| 跳跃残影 FX | `public/images/effects/kepi_effect-assassin-leap.png` | [ ] | 瞬移 |
| 刺客预警图标 | `public/images/ui/kepi_icon_assassin-warning.png` | [ ] | — |

#### 2.7C 土楼反哺 Buff 图标

| 机制阈值 | 路径 | 已有 |
|---|---|:---:|
| 33% 护盾 | `public/images/ui/kepi_icon_home-shield.png` | [ ] |
| 66% 攻速 | `public/images/ui/kepi_icon_home-haste.png` | [ ] |
| 99% 免死 | `public/images/ui/kepi_icon_home-undying.png` | [ ] |
| 家园修复通用 | `public/images/ui/kepi_icon-home-repair.png` | [x] |
| 修家园特效 | `public/images/effects/kepi_effect-home-repair.png` | [x] |

---

### 2.8 回合 / 节点结算过场

#### 2.8A 胜利链（水客存活 · 客批 + 桑梓）

| 路径 | 用途 | 已有 |
|---|---|:---:|
| `public/images/cinematics/kepi_victory-sea-delivery.png` | 海上送信 | [x] |
| `public/images/cinematics/kepi_victory-handoff.png` | 信抵家乡 | [x] |
| `public/images/cinematics/kepi_victory-sangzi-reveal.png` | 桑梓显现 | [x] |
| `public/images/cinematics/kepi_victory-repair-home.png` | 乡贤修楼 | [x] |
| `public/images/cinematics/kepi_victory-letter-stack.png` | 飞信 / 交信 | [x] |
| `public/images/cinematics/kepi_victory-sangzi-glow.png` | 桑梓光团 | [x] |
| `public/images/cinematics/kepi_victory-wave-foreground.png` | 海浪前景 | [x] |

#### 2.8B 特殊结算

| 路径 | 用途 | 已有 |
|---|---|:---:|
| `public/images/cinematics/kepi_settlement-waterguest-lost.png` | 胜但水客战死 | [ ] |
| `public/images/cinematics/kepi_settlement-survival-loss.png` | 失败扣存续度 | [ ] |
| `public/images/cinematics/kepi_settlement-broken-letter.png` | 信匣倾倒透明素材 | [ ] |

出图 prompt 见 [v2 §2.1A](kepi_assets-and-media-plan_v2.md)。

---

### 2.9 UI 与 HUD

#### 2.9A 核心数值图标

| 路径 | 用途 | 已有 |
|---|---|:---:|
| `public/images/ui/kepi_icon-coin.png` | 金币 | [x] |
| `public/images/ui/kepi_icon-population.png` | 人口 | [x] |
| `public/images/ui/kepi_icon-kebi.png` | 客批 | [x] |
| `public/images/ui/kepi_icon-sangzi.png` | 桑梓值 | [x] |
| `public/images/ui/kepi_icon-survival.png` | 存续度 | [x] |
| `public/images/ui/kepi_icon-home-repair.png` | 家园修复 | [x] |
| `public/images/ui/kepi_icon-return-ticket.png` | 归乡票 | [x] |

#### 2.9B 商店 / 操作

| 路径 | 用途 | 已有 |
|---|---|:---:|
| `public/images/ui/kepi_icon-shop.png` | 商店 | [x] |
| `public/images/ui/kepi_icon-refresh.png` | 刷新 | [x] |
| `public/images/ui/kepi_icon-upgrade-population.png` | 升人口 | [x] |
| `public/images/ui/kepi_icon-back.png` | 返回 | [x] |
| `public/images/ui/kepi_ending-gesture.png` | 手势提示 | [x] |

#### 2.9C UI 纹理与框架（9-slice）

| 路径 | 用途 | 已有 |
|---|---|:---:|
| `public/images/ui/kepi_ui_frame-wood.png` | HUD 外框 | [x] |
| `public/images/ui/kepi_ui_paper-cream.png` | 米宣纸底 | [x] |
| `public/images/ui/kepi_ui_paper-letter-edge.png` | 侨批信纸边 | [x] |
| `public/images/ui/kepi_ui_button-wood-normal.png` | 主按钮 | [x] |
| `public/images/ui/kepi_ui_button-wood-hover.png` | hover | [x] |
| `public/images/ui/kepi_ui_button-wood-disabled.png` | disabled | [x] |
| `public/images/ui/kepi_ui_hud-tag.png` | HUD 数值标签 | [x] |
| `public/images/ui/kepi_ui_shop-slot.png` | 商店槽位 | [x] |
| `public/images/ui/kepi_ui_vignette-warm.png` | 暖色暗角 | [x] |
| `public/images/ui/kepi_ui_divider-wood.png` | 分隔线 | [x] |
| `public/images/ui/kepi_ui_narrative-paper.png` | AI 旁白纸条底 | [ ] |

#### 2.9D 开战 / 结算操作图标（P1）

| 路径 | 用途 | 已有 |
|---|---|:---:|
| `public/images/ui/kepi_icon_battle-start.png` | 开战 | [ ] |
| `public/images/ui/kepi_icon_settlement-confirm.png` | 结算确认 | [ ] |

---

### 2.10 结局演出（风浪抓信 · PRD §6）

| 路径 | 用途 | 已有 | 备注 |
|---|---|:---:|:---|
| `public/images/ending/kepi_ending-background.png` | 结局通用底 | [x] | |
| `public/images/ending/kepi_wind-wave-background.png` | 风浪 / 海面 | [x] | |
| `public/images/ending/kepi_wind-scatter-letters.png` | 散信层 | [x] | |
| `public/images/ending/kepi_bullet-time-highlight.png` | 子弹时间高光 | [x] | |
| `public/images/ending/kepi_envelope-frame.png` | 信封展示框 | [x] | |
| `public/images/ending/kepi_real-letter-bg.png` | 真实侨批展示页 | [x] | |
| `public/images/ending/kepi_subtitle-mask.png` | 情感字幕遮罩 | [x] | |
| `public/images/ending/storm-bg.svg` | 风暴 SVG 底 | [ ] | `letters.ts` 引用 [~] |
| `public/images/ending/paper-texture.svg` | 信纸纹理 | [ ] | `letters.ts` 引用 [~] |
| 完美归乡专用背景 | `public/images/ending/kepi_ending-perfect.png` | [ ] | 复用 stage5 [~] |
| 遗憾留守专用背景 | `public/images/ending/kepi_ending-regret.png` | [ ] | 复用 stage3 [~] |
| 风浪抢救专用背景 | `public/images/ending/kepi_ending-storm.png` | [ ] | 复用 wind-wave [~] |
| 客批信件道具立绘 | `public/images/ending/kepi_prop-kebi-letter.png` | [ ] | |
| 归乡票道具立绘 | `public/images/ending/kepi_prop-homeward-ticket.png` | [ ] | 5 封阈值显化 |

**终极字幕**（PRD §6.3，代码内已实现）：

> 在这场漫长的对抗中，你没能赢下所有的期冀，但你让一个客家人的牵挂，回了家。

---

### 2.11 特效（`public/images/effects/`）

| 路径 | 用途 | 已有 |
|---|---|:---:|
| `kepi_effect-mist-particles.png` | 氛围粒子 | [x] |
| `kepi_effect-forgotten-attack.png` | 敌军攻击 / 典当燃烧占位 | [x] |
| `kepi_effect-home-repair.png` | 修家园 | [x] |
| `kepi_effect-star-up.png` | 升星 | [x] |
| `kepi_effect-shop-refresh.png` | 商店刷新 | [x] |
| `kepi_effect-shuike-letter-pickup.png` | 水客收信 | [x] |
| `kepi_effect-fengshui-buff-tile.png` | 风水格增益 | [x] |
| `kepi_effect-ending-letter-variant.png` | 结局信件变体 | [x] |
| `kepi_event-public-welfare.png` | 公益事件 | [x] |
| `kepi_effect-pawn-burn.png` | 典当专用燃烧 | [ ] |
| `kepi_effect-leaf-fall-overlay.png` | 落叶归根 | [ ] |
| `kepi_effect-opening-note-catch.png` | 乡音符抓取 | [ ] |
| `kepi_effect-assassin-leap.png` | 刺客跳跃 | [ ] |
| `kepi_effect-campfire-glow.png` | 篝火 subtle 补光 | [x] |

---

### 2.12 音频（`public/audio/`）

> **当前状态：全部为 `.gitkeep`，无实际音频文件。** 代码路径见 `src/data/assets.ts`；多处临时复用占位。

#### 2.12A BGM

| 路径 | 用途 | 已有 |
|---|---|:---:|
| `public/audio/bgm/kepi_main-loop.mp3` | 主菜单 / 对局循环 | [ ] |

#### 2.12B 核心 SFX

| 路径 | 用途 | 已有 |
|---|---|:---:|
| `public/audio/sfx/kepi_buy.mp3` | 购买 | [ ] |
| `public/audio/sfx/kepi_refresh.mp3` | 刷新 | [ ] |
| `public/audio/sfx/kepi_star-up.mp3` | 升星 | [ ] |
| `public/audio/sfx/kepi_collect-letter.mp3` | 收信 / 33% 水井 | [ ] |
| `public/audio/sfx/kepi_repair-home.mp3` | 修家园 / 66% 砌墙 | [ ] |
| `public/audio/sfx/kepi_win.mp3` | 胜利 / 99% 灯火 | [ ] |
| `public/audio/sfx/kepi_lose.mp3` | 失败 | [ ] |
| `public/audio/sfx/kepi_ending-wave.mp3` | 结局风浪 | [ ] |
| `public/audio/sfx/kepi_pawn-stamp.mp3` | 典当印章 | [ ] |
| `public/audio/sfx/kepi_pawn-gold.mp3` | 典当金币 | [ ] |
| `public/audio/sfx/kepi_waterguest-heartbeat.mp3` | 水客低血量 | [ ] |
| `public/audio/sfx/kepi_waterguest-death.mp3` | 水客战死 | [ ] |
| `public/audio/sfx/kepi_leaf-fall-stinger.mp3` | 落叶归根 | [ ] |
| `public/audio/sfx/ending-wave.mp3` | 结局层（letters.ts） | [ ] |
| `public/audio/sfx/letter-open.mp3` | 拆信（letters.ts） | [ ] |

#### 2.12C 语音

| 路径 | 用途 | 已有 |
|---|---|:---:|
| `public/audio/voice/kepi_letter-ye-heren.mp3` | 叶和仁侨批客家话朗读 | [ ] |
| `public/audio/voice/kepi_letter-lin-ahfa.mp3` | 林阿发侨批朗读（P1） | [ ] |
| `public/audio/voice/kepi_letter-zhang-mingde.mp3` | 张明德侨批朗读（P1） | [ ] |

---

### 2.13 文案与文本素材（本地 · 断网必需）

| 类别 | 位置 | 已有 | 说明 |
|---|---|:---:|---|
| 真实侨批原文 ×3 | `src/data/letters.ts` → `ARCHIVAL_LETTERS` | [x] | 叶和仁 / 林阿发 / 张明德 |
| 数字客批 fallback | `src/data/letters.ts` → `DIGITAL_LETTER_FALLBACKS` | [x] | |
| 三结局字幕 | `src/data/letters.ts` → `ENDING_SUBTITLES` | [x] | 完美 / 遗憾 / 风浪 |
| AI 机制旁白 fallback | `src/lib/ai/narrativeFallback.ts` | [x] | 惨胜 / 苟活 / 碾压等标签池 |
| 篝火夜话本地文案 | `src/data/campfire.ts` → `CAMPFIRE_SCENARIOS` | [x] | 白名单效果 |
| 棋子 / 敌人说明 | `src/data/pieces.ts` / `enemies.ts` | [x] | 内嵌 description |
| 乡音符 Buff 文案 | `src/data/battleBuffs.ts` | [x] | ≤3 种 |
| 归乡路线节点标签 | `src/data/journey.ts` | [x] | 7 节点固定 |
| 典当 / 透支风险提示 | `PawnShopPanel` + engine toast | [x] | UI 文案 |
| 水客危急 / 战死结算 | engine + `narrativeFallback` | [x] | |
| 土楼 33 / 66 / 99 解锁 | `src/data/balance.ts` + HUD | [x] | |
| 公益事件文案池 | — | [ ] | P1 |

#### AI fallback 标签覆盖（PRD §5.3）

| 标签组合 | `narrativeFallback` | 已有 |
|---|---|:---:|
| 典当当信 `didPawn` | `PAWN_FALLBACKS` | [x] |
| 透支未来 `didBloodDebt` | `BLOOD_DEBT_FALLBACKS` | [x] |
| 水客存活胜利 | `WATER_GUEST_SURVIVED` 池 | [x] |
| 胜但水客战死 | `WATER_GUEST_DIED_WIN` | [x] |
| 失败扣存续度 | `DEFEAT` 池 | [x] |
| 碾压 / 惨胜 / 苟活 | `CRUSHING` / `NARROW` / `CLUTCH` | [x] |
| 土楼 33 / 66 / 99 | milestone 池 | [x] |
| 篝火 AI copy | API + `campfire.ts` 本地 | [x] |

---

## 3. P1 可选素材

| 资产 | 说明 | 已有 |
|---|---|:---:|
| 棋子升星特效序列 | 强化 2★ / 3★ 差异 | [ ] |
| 商店刷新特效强化 | 已有静态图可扩展 | [~] |
| 乡贤修家园动效 | 过场短动画 | [ ] |
| 背景氛围粒子层 | 已有 mist 粒子 | [~] |
| 土楼 33→66→99 图生视频 | 3–4s 过场 | [ ] |
| 归乡票显化视频 | 5 封客批汇聚 | [ ] |
| 典当燃烧图生视频 | 2–3s 仪式 | [ ] |
| 结局可重复信件轮换插画 | 多馆藏轮换 | [ ] |
| 敌人专属攻击音效 | 6 敌分轨 | [ ] |
| 械斗火跳跃 / 落地音 | 刺客 P1 | [ ] |
| BGM 动态 ducking 片段 | 战斗 / 结局 | [ ] |
| 全资产对照表 | `public/images/kepi_all-assets-contact-sheet.jpg` | [x] |

图生视频 prompt 见 [v2 §3.1](kepi_assets-and-media-plan_v2.md)。

---

## 4. 风格参考资产（`docs/assets/` · 非 runtime）

| 路径 | 用途 | 已有 |
|---|---|:---:|
| `kepi_art-style-ref-big-fish-begonia-1.png` | 场景 / 角色气质锚 | [x] |
| `kepi_art-style-ref-big-fish-begonia-2.png` | 同上 | [x] |
| `kepi_art-style-ref-moonlight-blade.png` | 土楼结构 | [x] |
| `kepi_art-style-ref-mulan.png` | 史诗构图参考 | [x] |
| `kepi_art-style-hakka-base-shirt-pants.jpg` | 客家基础衫裤 | [x] |
| `kepi_art-style-traditional-blue-shirt.jpg` | 传统大襟蓝衫 | [x] |
| `kepi_art-style-farmer-male-outfit.jpg` | 农夫劳作装 | [x] |
| `kepi_art-style-farmer-female-blue-shirt.png` | 女款参考 | [x] |
| `kepi_art-style-straw-raincoat-outfit.jpg` | 蓑衣 / 守卫 | [x] |
| `kepi_architecture-overview_v1.svg` | 架构图 | [x] |
| `kepi_data-flow-and-state-machine_v1.svg` | 数据流 | [x] |
| `kepi_engine-internal-architecture_v1.svg` | 引擎架构 | [x] |

---

## 5. 资源规格与目录

与 v2 一致，根目录：

```txt
public/
  images/
    board/          # 棋盘、土楼、路线背景
    characters/     # 我方立绘（透明底）
    enemies/        # 敌军立绘
    cinematics/     # 过场、典当仪式、结算
    ui/             # 图标 + 9-slice 纹理
    ending/         # 结局专用
    effects/        # 透明底 FX
  audio/
    bgm/
    sfx/
    voice/
```

| 类型 | 建议格式 | 默认尺寸 |
|---|---|---|
| 角色 / 敌人 | PNG / WebP，透明底 | 1024×1280 |
| 场景 / 过场 | PNG / WebP | 1600×900 |
| UI 图标 | PNG，透明底 | 256×256 |
| UI 9-slice | PNG | 见 §2.9C |
| 音频 | MP3 / WAV | BGM < 2MB 循环 |

命名：`public/images/<类别>/kepi_<主体>_<变体>.<ext>`，见 [文档命名规范 v1](kepi_document-conventions_v1.md)。

**代码 manifest**：`src/data/assets.ts` 汇总 runtime 路径，新增素材需同步更新。

---

## 6. V3.1 交付优先级

| 顺序 | 工作包 | P0 资产 | 当前完成度 |
|---:|---|---|---|
| 1 | 卷轴路线可读 | 节点 icon ×3、卷轴底、修复条 | CSS 降级已跑通 |
| 2 | 双向典当仪式感 | 燃烧序列、金币、透支印、音效 | CSS 闪动 + 文案 |
| 3 | 死保水客反馈 | 水客三态 icon、危急 vignette、结算过场 ×2 | 立绘 ✓；反馈图缺 |
| 4 | 乡音符盲盒 | 音符 icon、抓取 FX | CSS 圆钮已跑通 |
| 5 | 土楼 Buff 可感知 | 护盾 / 攻速 / 免死 icon + 音效 | icon 缺；逻辑 ✓ |
| 6 | 结局风浪抓信 | 现有 ending 套图 ✓；音频全缺 | 视觉 7/10 |
| 7 | 落叶归根 Juice | 落叶 overlay + stinger | 引擎事件 ✓；美术缺 |
| 8 | 音频全线 | BGM + 核心 SFX + 叶和仁朗读 | **0/18** |

**美术批量顺序建议**：水客三态反馈 → 双向典当仪式 → 卷轴节点 icon → 土楼 Buff icon → 落叶归根 FX → 音频 → 缺过场补全。

---

## 7. 降级策略（V3.1 Demo）

| 场景 | 降级方案 | 状态 |
|---|---|---|
| 卷轴路线 | CSS 圆点 + 文字节点名 + 修复进度条 | 已落地 |
| 典当燃烧 | `kepi-pawn-burn` CSS + Toast | 已落地 |
| 乡音符 | pointer 点击圆形按钮；无摄像头不阻断 | 已落地 |
| 篝火夜话 | 按 scenario 底图 + 纸卷续读 CTA；缺图回退通用 vignette | 已落地（待补 2 张场景图） |
| AI 旁白 / 夜话 | 1500ms 熔断 → `narrativeFallback` / 本地 scenario | 已落地 |
| 土楼四状态大图 | 六档 stage 图 + HUD 图标占位 | 部分 |
| 音频 | 静默运行；不阻断流程 | 当前 |
| 落叶归根 | 数值 + 事件，无全屏 FX | 部分 |
| 结局 SVG 引用 | PNG 背景顶替 | 部分 |

---

## 8. 相关文档

- [PRD V3.1](kepi_PRD_V3.1.md) — 产品需求来源
- [素材与媒体计划 v2](kepi_assets-and-media-plan_v2.md) — 出图 prompt 与两步法规范
- [美术风格设定 v1](kepi_art-style-design_v1.md) — 场景 / 人物风格锚点
- [TODO v3](kepi_todo_v3.md) — V3.1 开发清单
- [文档命名规范 v1](kepi_document-conventions_v1.md)
