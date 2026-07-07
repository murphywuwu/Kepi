/**
 * 生成式 BGM（程序化合成，无音频文件依赖）。
 *
 * 架构见 docs/kepi_audio-design_v1.md §4。
 *  - 状态机驱动的四层音乐系统：L0 pad / L1 旋律 / L2 节奏 / L3 高光。
 *  - 4 主题动机（Leitmotif）：乡愁 / 家 / 罪恶 / 风浪，按场景变奏。
 *  - 分级 ducking：setBgmScene 设基础层配置，duckBgm/restoreBgm 在其之上叠加危机衰减。
 *  - 客家五声音阶 + 山歌腔（椰胡颤音 scheduleVoice）+ 木鱼/战鼓节奏层。
 *  - V3.2+ 战斗差异化：按敌人类型注入动机、按关卡序号渐强参数。
 *
 * V2 音色重做要点（见 §6 补充）：
 *  - 旋律按「动机成句」调度（尊重每个音的 beats），不再是随机单音 plink。
 *  - 节奏层：非战斗用 木鱼（playWoodblock），战斗用 战鼓（playTaiko）+ 终关强拍大锣。
 *  - 新增低音脉动层（scheduleBass），给 route/battle 以行进感。
 *  - 场景切换走 crossfadeBgm，音乐不再硬切。
 *
 * API（与旧版兼容，调用点零改动）：
 *  - initBgm / setBgmVolume / duckBgm / restoreBgm / stopBgm
 *  - setBgmScene(sceneId) / setBattleContext(ctx) / clearBattleContext()
 *  - setRouteProgress(index) / triggerMotif(motifId)
 */

import { crossfadeBgm, getAudioContext, getBgmGain } from "./context";
import {
  duckFileBgm,
  isFileBgmMode,
  playFileBgm,
  restoreFileBgm,
  setFileBgmErrorHandler,
  stopFileBgm,
} from "./bgmFiles";
import {
  type MotifId,
  type MotifStep,
  MOTIFS,
  noteToFreq,
  playGong,
  playPadSwell,
  playTaiko,
  playWoodblock,
  scheduleTone,
  scheduleVoice,
} from "./synth";
import type { EnemyType } from "@/types";

const f = (note: string): number => noteToFreq(note);

/* ----------------------------- 文件化 BGM 映射（V3） ----------------------------- */

/**
 * 每个场景对应的成品 MP3（由 Music Cog 等生成，置于 public/audio/bgm/）。
 * 文件缺失/加载失败时由 setBgmScene 静默回退到本模块的程序化合成，
 * 保持「断网可玩、缺素材不影响运行」。文件名遵循素材命名规范。
 */
const FILE_TRACKS: Partial<Record<BgmSceneId, string>> = {
  menu: "/audio/bgm/kepi_bgm_menu.mp3",
  route: "/audio/bgm/kepi_bgm_route.mp3",
  battle: "/audio/bgm/kepi_bgm_battle.mp3",
  battle_final: "/audio/bgm/kepi_bgm_battle_final.mp3",
  pawn_shop: "/audio/bgm/kepi_bgm_pawn_shop.mp3",
  campfire: "/audio/bgm/kepi_bgm_campfire.mp3",
  ending: "/audio/bgm/kepi_bgm_ending.mp3",
};

/** 本会话内已确认加载失败的 URL，避免反复重试缺失文件。 */
const failedFileUrls = new Set<string>();

/* ----------------------------- 场景配置 ----------------------------- */

export type BgmSceneId =
  | "menu"
  | "route"
  | "battle"
  | "battle_final"
  | "pawn_shop"
  | "campfire"
  | "ending";

interface LayerConfig {
  /** L0 pad 根音（多 sine 缓起），空数组=该层关闭。 */
  padRoots: string[];
  /** pad 重新触发间隔（小节）。 */
  padIntervalBars: number;
  padGain: number;
  /** L1 旋律可用动机池（按序轮播），空=该层关闭。 */
  motifPool: MotifId[];
  /** 旋律成句概率（0..1，按短语判定）。 */
  melodyDensity: number;
  melodyGain: number;
  /** L2 节奏：每小节打击点数（0=关闭）。 */
  rhythmHitsPerBar: number;
  rhythmGain: number;
  /** 节奏层中心频率（Hz，木鱼用）。 */
  rhythmFreq: number;
  tempoBpm: number;
}

const SCENES: Record<BgmSceneId, LayerConfig> = {
  /** 主菜单/开场：乡愁慢板，主题 A 完整。 */
  menu: {
    padRoots: ["C2", "G2"],
    padIntervalBars: 2,
    padGain: 0.16,
    motifPool: ["nostalgia"],
    melodyDensity: 0.7,
    melodyGain: 0.16,
    rhythmHitsPerBar: 1,
    rhythmGain: 0.04,
    rhythmFreq: 1600,
    tempoBpm: 64,
  },
  /** 路线推进/备战：行路感，主题 A 变奏 + 脚步木鱼 + 低音脉动。 */
  route: {
    padRoots: ["C2", "G2"],
    padIntervalBars: 2,
    padGain: 0.15,
    motifPool: ["nostalgia"],
    melodyDensity: 0.55,
    melodyGain: 0.15,
    rhythmHitsPerBar: 2,
    rhythmGain: 0.055,
    rhythmFreq: 1500,
    tempoBpm: 72,
  },
  /** 战斗：旋律静默、节奏加密、pad 压低，制造守护压迫。 */
  battle: {
    padRoots: ["C2"],
    padIntervalBars: 3,
    padGain: 0.1,
    motifPool: [],
    melodyDensity: 0,
    melodyGain: 0,
    rhythmHitsPerBar: 4,
    rhythmGain: 0.09,
    rhythmFreq: 2600,
    tempoBpm: 96,
  },
  /** 典当行：罪恶主题 C，慢板、低沉、走调。 */
  pawn_shop: {
    padRoots: ["A2"],
    padIntervalBars: 3,
    padGain: 0.12,
    motifPool: ["guilt"],
    melodyDensity: 0.6,
    melodyGain: 0.16,
    rhythmHitsPerBar: 1,
    rhythmGain: 0.05,
    rhythmFreq: 1200,
    tempoBpm: 52,
  },
  /** 篝火夜话：暖 pad 回，主题 A 慢奏，火噼啪极疏。 */
  campfire: {
    padRoots: ["C2", "G2"],
    padIntervalBars: 2,
    padGain: 0.15,
    motifPool: ["nostalgia"],
    melodyDensity: 0.55,
    melodyGain: 0.16,
    rhythmHitsPerBar: 1,
    rhythmGain: 0.04,
    rhythmFreq: 1100,
    tempoBpm: 60,
  },
  /** 结局：全停，让位海浪与朗读。 */
  ending: {
    padRoots: [],
    padIntervalBars: 99,
    padGain: 0,
    motifPool: [],
    melodyDensity: 0,
    melodyGain: 0,
    rhythmHitsPerBar: 0,
    rhythmGain: 0,
    rhythmFreq: 2000,
    tempoBpm: 60,
  },
  /** 终关战斗（battle-7）：主题 A 归乡旋律收束 + 最大压迫节奏 + 强拍大锣。 */
  battle_final: {
    padRoots: ["C2", "G2"],
    padIntervalBars: 2,
    padGain: 0.14,
    motifPool: ["nostalgia"],
    melodyDensity: 0.4,
    melodyGain: 0.14,
    rhythmHitsPerBar: 6,
    rhythmGain: 0.11,
    rhythmFreq: 1400,
    tempoBpm: 104,
  },
};

/* ----------------------------- 战斗差异化（V3.2+） ----------------------------- */

/**
 * 战斗上下文——由 GameShell 在进入 battle phase 时注入，
 * 驱动 battle 场景的动态参数覆盖（敌人动机 / 关卡渐强）。
 */
export interface BattleContext {
  /** 当前关卡序号 (1–7)。 */
  stage: number;
  /** 本关主敌类型，决定注入哪种主题动机。 */
  featuredEnemy: EnemyType;
  /** 关卡基调 tone（来自 levelInteractions）。 */
  tone: string;
  /** 是否为终关（battle-7）。 */
  isFinal: boolean;
}

/** 敌人类型 → 注入动机池映射。 */
const ENEMY_MOTIF_MAP: Record<EnemyType, MotifId[]> = {
  qianhaibei: ["guilt"],       // 迁海碑 → 罪恶/海禁压迫
  luyinguanli: [],              // 路引关吏 → 纯节奏加重（无旋律）
  zhuzaiqi: ["guilt"],          // 猪仔契 → 契约束缚
  ehushan: ["storm"],           // 饿虎山 → 风浪险恶
  hongtouchuan: ["storm"],      // 红头船 → 渡海艰难
  xiedouhuo: ["guilt", "storm"], // 械斗火 → 乱世双主题
};

/**
 * 按 stage 返回战斗参数缩放。
 * 设计：随关卡推进逐步增强压迫感——tempo 加速、节奏增益提升、
 * 后期关卡注入稀疏旋律碎片（终关除外，终关用独立场景 battle_final）。
 */
function stageBattleOverrides(stage: number): Partial<LayerConfig> {
  if (stage <= 2) return {};                                    // 早期：基础 battle 不变
  if (stage <= 4) {
    return {
      tempoBpm: 100,                                           // 中期：+4 BPM
      rhythmGain: 0.1,
      melodyDensity: 0.1,
      melodyGain: 0.05,
      motifPool: ["guilt"],
    };
  }
  // stage 5-6（非终关）
  return {
    tempoBpm: 104,                                              // 后期：+8 BPM
    rhythmGain: 0.11,
    melodyDensity: 0.18,
    melodyGain: 0.07,
    padRoots: ["C2", "G2"],
    motifPool: ["storm"],
  };
}

/* ----------------------------- route 渐强（V3.2+） ----------------------------- */

let routeProgress = 0;

/**
 * 按 journeyIndex 返回 route 场景参数微调。
 * 备战/结算阶段随路线推进逐渐升温。
 */
function routeProgressOverrides(index: number): Partial<LayerConfig> {
  if (index <= 2) return {};                                     // 早期：原样
  if (index <= 5) {
    return { tempoBpm: 76, melodyDensity: 0.6 };                 // 中期：略提速
  }
  return { tempoBpm: 80, melodyDensity: 0.65, rhythmGain: 0.06 }; // 后期：接近 battle 前奏感
}

/* ----------------------------- 调度状态 ----------------------------- */

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.2;

let schedulerTimer: number | null = null;
let nextStepTime = 0;
let stepIndex = 0;
let running = false;

/** 当前场景（默认 menu，initBgm 时按需切换）。 */
let currentScene: BgmSceneId = "menu";

/** duck 倍率（BattleHud 水客危机叠加在场景之上）。 */
let duckMultiplier = 1;

/** 战斗上下文（GameShell 注入），驱动 battle 场景动态参数覆盖。 */
let activeContext: BattleContext | null = null;

const STEPS_PER_BEAT = 2; // 每拍两个八分音符（BGM 步进单位）

function stepSeconds(scene: LayerConfig): number {
  return 60 / scene.tempoBpm / STEPS_PER_BEAT;
}

function stepsPerBar(scene: LayerConfig): number {
  return STEPS_PER_BEAT * 4; // 4/4 拍
}

/** 场景内某层有效增益 = 层基础 × duck 倍率。 */
function eff(layerGain: number): number {
  return layerGain * duckMultiplier;
}

function isBattleLike(): boolean {
  return currentScene === "battle" || currentScene === "battle_final";
}

/**
 * 解析最终场景配置 = 基础场景 + 战斗上下文覆盖 + route 渐强。
 * 终关优先使用独立场景 battle_final，不走覆盖路径。
 */
function resolveScene(): LayerConfig {
  const base = SCENES[currentScene];

  // 终关：直接用 battle_final 独立场景
  if (activeContext?.isFinal && currentScene === "battle") {
    return { ...SCENES["battle_final"] };
  }

  // 战斗上下文覆盖：敌人动机 > 关卡渐强
  if (activeContext && currentScene === "battle") {
    const enemyMotifs = ENEMY_MOTIF_MAP[activeContext.featuredEnemy] ?? [];
    const stageOverrides = stageBattleOverrides(activeContext.stage);
    const hasMotif = enemyMotifs.length > 0 || (stageOverrides.motifPool ?? []).length > 0;
    return {
      ...base,
      motifPool: enemyMotifs.length > 0 ? enemyMotifs : (stageOverrides.motifPool ?? base.motifPool),
      ...stageOverrides,
      melodyDensity: hasMotif ? (stageOverrides.melodyDensity ?? base.melodyDensity) : base.melodyDensity,
      melodyGain: hasMotif ? (stageOverrides.melodyGain ?? base.melodyGain) : base.melodyGain,
    };
  }

  // route 场景：按路线进度微调
  if (currentScene === "route") {
    const routeOverrides = routeProgressOverrides(routeProgress);
    return { ...base, ...routeOverrides };
  }

  return base;
}

/* ----------------------------- L0 pad ----------------------------- */

function schedulePad(scene: LayerConfig, time: number): void {
  const ctx = getAudioContext();
  const dest = getBgmGain();
  if (!ctx || !dest || scene.padRoots.length === 0) return;
  const gain = eff(scene.padGain);
  if (gain <= 0.0001) return;
  const durMs = stepSeconds(scene) * stepsPerBar(scene) * scene.padIntervalBars * 1000;
  playPadSwell(
    scene.padRoots.map((n) => f(n)),
    {
      type: "triangle",
      durationMs: Math.max(2400, durMs),
      attackMs: 900,
      releaseMs: 1200,
      gain,
      detuneCents: 6,
      destination: dest,
      delaySeconds: Math.max(0, time - ctx.currentTime),
    },
  );
}

/* ----------------------------- L1 旋律（主题动机成句） ----------------------------- */

let melodyNextTime = 0;
let melodyMotifIdx = 0;
let melodyNoteIdx = 0;
let melodyPhraseMotif: MotifId | null = null;

function resetMelody(now: number): void {
  melodyNextTime = now + 0.1;
  melodyMotifIdx = 0;
  melodyNoteIdx = 0;
  melodyPhraseMotif = null;
}

/**
 * 动机成句调度：把一段动机当作「乐句」按每个音的 beats 连续奏出，
 * 而非旧版每个 tick 随机敲一个音（那样旋律被压平、毫无句法）。
 * 短语首音按 melodyDensity 掷骰决定是否奏出，跳过则歇一小节换下一动机。
 */
function pumpMelody(scene: LayerConfig, ctx: AudioContext): void {
  const dest = getBgmGain();
  if (!dest || scene.motifPool.length === 0 || scene.melodyDensity <= 0) return;
  const gain = eff(scene.melodyGain);
  if (gain <= 0.0001) return;
  const beat = stepSeconds(scene);
  const pool = scene.motifPool;
  const horizon = ctx.currentTime + SCHEDULE_AHEAD;

  let guard = 0;
  while (melodyNextTime < horizon && guard < 64) {
    guard += 1;
    if (melodyNoteIdx === 0) {
      if (melodyPhraseMotif === null) melodyPhraseMotif = pool[melodyMotifIdx % pool.length]!;
      if (Math.random() > scene.melodyDensity) {
        // 跳过本短语：歇一小节，换下一动机
        melodyNextTime += beat * 4;
        melodyMotifIdx = (melodyMotifIdx + 1) % pool.length;
        melodyPhraseMotif = pool[melodyMotifIdx % pool.length]!;
        continue;
      }
    }
    const motifId = melodyPhraseMotif as MotifId;
    const steps = MOTIFS[motifId] as readonly MotifStep[];
    const step = steps[melodyNoteIdx]!;
    const noteBeats = step.beats;
    const durMs = noteBeats * beat * 1000 * 0.92;
    // 句尾长音加更长的释放，模拟山歌拖腔
    const isTail = melodyNoteIdx === steps.length - 1;
    scheduleVoice(f(step.note), melodyNextTime, {
      durationMs: durMs,
      gain,
      attackMs: 30,
      releaseMs: Math.max(260, isTail ? durMs * 0.9 : durMs * 0.5),
      vibratoRate: 5.2,
      vibratoDepth: 6,
      glideFromRatio: 0.97, // 山歌起音微上滑
      destination: dest,
    });
    melodyNextTime += noteBeats * beat;
    melodyNoteIdx += 1;
    if (melodyNoteIdx >= steps.length) {
      melodyNoteIdx = 0;
      melodyMotifIdx = (melodyMotifIdx + 1) % pool.length;
      melodyPhraseMotif = pool[melodyMotifIdx % pool.length]!;
      melodyNextTime += beat * 1.5; // 乐句间留白
    }
  }
}

/* ----------------------------- L2 节奏（木鱼 / 战鼓） ----------------------------- */

function scheduleRhythm(scene: LayerConfig, time: number, stepInBar: number): void {
  const ctx = getAudioContext();
  const dest = getBgmGain();
  if (!ctx || !dest || scene.rhythmHitsPerBar === 0) return;
  const gain = eff(scene.rhythmGain);
  if (gain <= 0.0001) return;

  const perBar = stepsPerBar(scene);
  const interval = perBar / scene.rhythmHitsPerBar;
  if (stepInBar % Math.round(interval) !== 0) return;
  const delay = Math.max(0, time - ctx.currentTime);
  const accent = stepInBar % perBar === 0;

  if (isBattleLike()) {
    // 战鼓：重拍稍强；终关强拍加一记大锣
    playTaiko({
      gain: gain * (accent ? 1.15 : 0.8),
      destination: dest,
      delaySeconds: delay,
    });
    if (accent && currentScene === "battle_final") {
      playGong({ gain: gain * 0.5, fundamental: 180, destination: dest, delaySeconds: delay });
    }
  } else {
    // 木鱼：行路/篝火/典当的木质脚步
    playWoodblock(
      accent ? 1600 : scene.rhythmFreq,
      {
        durationMs: accent ? 110 : 80,
        gain: gain * (accent ? 1.2 : 0.85),
        destination: dest,
        delaySeconds: delay,
      },
    );
  }
}

/* ----------------------------- 低音脉动（行进感） ----------------------------- */

function scheduleBass(scene: LayerConfig, time: number): void {
  const ctx = getAudioContext();
  const dest = getBgmGain();
  if (!ctx || !dest || scene.padRoots.length === 0) return;
  if (!isBattleLike() && currentScene !== "route") return; // 仅 route/battle
  const gain = eff(scene.padGain) * 0.9;
  if (gain <= 0.0001) return;
  const root = f(scene.padRoots[0]!) / 2; // 低八度根音
  scheduleTone(root, time, {
    type: "triangle",
    durationMs: 360,
    gain,
    attackMs: 6,
    releaseMs: 240,
    destination: dest,
  });
}

/* ----------------------------- L3 主题高光（一次性） ----------------------------- */

/**
 * 触发主题高光：完整奏响一段动机（椰胡嗓音），覆盖 ducking（短时穿透）。
 * 用于土楼里程碑、结局归乡收束。
 */
export function triggerMotif(motifId: MotifId, opts?: { gain?: number }): void {
  const ctx = getAudioContext();
  const dest = getBgmGain();
  if (!ctx || !dest) return;
  const steps = MOTIFS[motifId] as readonly MotifStep[];
  const beat = stepSeconds(resolveScene());
  const peak = opts?.gain ?? 0.24;
  let cursor = ctx.currentTime + 0.05;
  for (const s of steps) {
    const dur = s.beats * beat * 1000;
    scheduleVoice(f(s.note), cursor, {
      durationMs: dur * 0.92,
      gain: peak,
      attackMs: 20,
      releaseMs: 320,
      vibratoDepth: 7,
      destination: dest,
    });
    cursor += s.beats * beat * 0.95;
  }
}

/* ----------------------------- 调度器 ----------------------------- */

function runScheduler(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const scene = resolveScene();
  const barLen = stepsPerBar(scene);
  while (nextStepTime < ctx.currentTime + SCHEDULE_AHEAD) {
    const stepInBar = stepIndex % barLen;

    // L0 pad：按 padIntervalBars 小节触发
    if (stepInBar === 0 && stepIndex % (barLen * scene.padIntervalBars) === 0) {
      schedulePad(scene, nextStepTime);
    }
    // L2 节奏
    scheduleRhythm(scene, nextStepTime, stepInBar);
    // 低音脉动：每小节首拍
    if (stepInBar === 0) scheduleBass(scene, nextStepTime);

    nextStepTime += stepSeconds(scene);
    stepIndex += 1;
  }
  // L1 旋律独立时钟（成句调度，不受 step 网格束缚）
  pumpMelody(scene, ctx);
}

function startScheduler(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  nextStepTime = ctx.currentTime + 0.12;
  stepIndex = 0;
  resetMelody(ctx.currentTime);
  // 立即播一次 pad（使用解析后配置，包含 route 渐强等）
  schedulePad(resolveScene(), nextStepTime);
  schedulerTimer = window.setInterval(runScheduler, LOOKAHEAD_MS);
}

/* ----------------------------- 公共 API ----------------------------- */

export function initBgm(volume?: number): void {
  if (typeof window === "undefined") return;
  const ctx = getAudioContext();
  if (!ctx) return;
  void ctx.resume().catch(() => undefined);
  if (running) return;
  running = true;

  // 注册文件化 BGM 加载失败回退（缺素材时复用程序化合成）
  setFileBgmErrorHandler((url) => {
    if (url) failedFileUrls.add(url);
    // 当前场景仍对应失败文件时，启动程序化兜底
    const cur = FILE_TRACKS[currentScene];
    if ((!cur || failedFileUrls.has(cur)) && currentScene !== "ending" && running) {
      if (schedulerTimer === null) startScheduler();
    }
  });

  if (volume !== undefined) {
    const clamped = Math.max(0, Math.min(1, volume));
    const dest = getBgmGain();
    if (dest) dest.gain.setTargetAtTime(clamped, ctx.currentTime, 0.05);
  }
  startScheduler();
}

/**
 * 切换音乐场景（按 phase/journey）。
 * V3：优先播放成品 MP3（文件化 BGM），缺失时静默回退到程序化合成。
 * ending 场景若已有文件则作为朗读底噪播放，否则停调度让位海浪/朗读。
 */
export function setBgmScene(sceneId: BgmSceneId): void {
  if (currentScene === sceneId && !isFileBgmMode()) return;
  currentScene = sceneId;
  const ctx = getAudioContext();
  if (ctx) resetMelody(ctx.currentTime);
  // 离开战斗时清除战斗上下文
  if (sceneId !== "battle" && sceneId !== "battle_final") {
    activeContext = null;
  }

  // 优先走文件化 BGM
  const url = FILE_TRACKS[sceneId];
  if (url && !failedFileUrls.has(url)) {
    if (playFileBgm(url)) {
      stopScheduler(); // 文件模式：停程序化调度（ending 由文件承载）
      crossfadeBgm(); // 程序化总线淡入淡出（无副作用）
      return;
    }
  }

  // 回退：程序化合成
  crossfadeBgm();
  if (sceneId === "ending") {
    stopScheduler();
    return;
  }
  // 若之前因 ending 停了调度，需重启
  if (running && schedulerTimer === null) {
    startScheduler();
  }
}

/**
 * 注入战斗上下文——在进入 battle phase 时由 GameShell 调用。
 * 驱动 battle 场景的敌人动机注入和关卡渐强。
 */
export function setBattleContext(ctx: BattleContext): void {
  activeContext = ctx;
  const c = getAudioContext();
  if (c) resetMelody(c.currentTime);
}

/** 清除战斗上下文（离开战斗 phase 时调用）。 */
export function clearBattleContext(): void {
  activeContext = null;
  const c = getAudioContext();
  if (c) resetMelody(c.currentTime);
}

/**
 * 设置 route 场景的路线进度（journeyIndex），
 * 驱动备战/结算阶段的渐进增强。
 */
export function setRouteProgress(index: number): void {
  routeProgress = index;
}

/** 兼容旧调用点；BGM 实际音量由 masterGain（设置）统一控制。 */
export function setBgmVolume(volume: number): void {
  const ctx = getAudioContext();
  const dest = getBgmGain();
  if (!ctx || !dest) return;
  const clamped = Math.max(0, Math.min(1, volume));
  dest.gain.setTargetAtTime(clamped, ctx.currentTime, 0.05);
}

export function duckBgm(ratio = 0.32): void {
  duckMultiplier = Math.max(0, Math.min(1, ratio));
  duckFileBgm(ratio);
}

export function restoreBgm(): void {
  duckMultiplier = 1;
  restoreFileBgm();
}

function stopScheduler(): void {
  if (schedulerTimer !== null) {
    window.clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}

/** 仅停程序化调度（文件化 BGM 仍播放，用于结局底噪场景）。 */
export function stopProceduralBgm(): void {
  stopScheduler();
}

export function stopBgm(): void {
  running = false;
  stopScheduler();
  stopFileBgm();
  // 让余音自然衰减，不强制停 osc（避免咔哒声）
}
