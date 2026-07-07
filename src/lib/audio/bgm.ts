/**
 * 生成式 BGM（程序化合成，无音频文件依赖）。
 *
 * 架构见 docs/kepi_audio-design_v1.md §4。
 *  - 状态机驱动的四层音乐系统：L0 pad / L1 旋律 / L2 节奏 / L3 高光。
 *  - 4 主题动机（Leitmotif）：乡愁 / 家 / 罪恶 / 风浪，按场景变奏。
 *  - 分级 ducking：setBgmScene 设基础层配置，duckBgm/restoreBgm 在其之上叠加危机衰减。
 *  - 客家五声音阶 + 山歌腔（椰胡颤音 detuned pair）+ 木鱼节奏层。
 *  - V3.2+ 战斗差异化：按敌人类型注入动机、按关卡序号渐强参数。
 *
 * API：
 *  - initBgm / setBgmVolume / duckBgm / restoreBgm / stopBgm —— 与旧版兼容，调用点零改动。
 *  - setBgmScene(sceneId) —— 按 phase/journey 切换音乐配置。
 *  - setBattleContext(ctx) —— 注入战斗上下文（敌人/关卡/终关标记），动态叠加 battle 场景。
 *  - clearBattleContext() —— 清除战斗上下文（离开战斗时调用）。
 *  - setRouteProgress(index) —— 备战/route 场景的路线进度，驱动渐进增强。
 *  - triggerMotif(motifId) —— 触发主题高光（里程碑/结局收束）。
 *
 * 音量统一受 masterGain（设置音量）控制；bgmGain 固定在主增益之下 0.55 倍。
 */

import { getAudioContext, getBgmGain } from "./context";
import {
  type MotifId,
  type MotifStep,
  MOTIFS,
  noteToFreq,
  playPadSwell,
  scheduleTone,
} from "./synth";
import type { EnemyType } from "@/types";

const f = (note: string): number => noteToFreq(note);

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
  /** 旋律步触发概率（0..1）。 */
  melodyDensity: number;
  melodyGain: number;
  /** L2 节奏：每小节打击点数（0=关闭）。 */
  rhythmHitsPerBar: number;
  rhythmGain: number;
  /** 节奏层噪声中心频率（Hz）。 */
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
    melodyDensity: 0.55,
    melodyGain: 0.13,
    rhythmHitsPerBar: 1,
    rhythmGain: 0.04,
    rhythmFreq: 3800,
    tempoBpm: 64,
  },
  /** 路线推进/备战：行路感，主题 A 变奏 + 脚步木鱼。 */
  route: {
    padRoots: ["C2", "G2"],
    padIntervalBars: 2,
    padGain: 0.15,
    motifPool: ["nostalgia"],
    melodyDensity: 0.45,
    melodyGain: 0.12,
    rhythmHitsPerBar: 2,
    rhythmGain: 0.05,
    rhythmFreq: 3200,
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
    rhythmGain: 0.08,
    rhythmFreq: 2600,
    tempoBpm: 96,
  },
  /** 典当行：罪恶主题 C，慢板、低沉、走调。 */
  pawn_shop: {
    padRoots: ["A2"],
    padIntervalBars: 3,
    padGain: 0.12,
    motifPool: ["guilt"],
    melodyDensity: 0.4,
    melodyGain: 0.13,
    rhythmHitsPerBar: 1,
    rhythmGain: 0.05,
    rhythmFreq: 2000,
    tempoBpm: 52,
  },
  /** 篝火夜话：暖 pad 回，主题 A 慢奏，火噼啪极疏。 */
  campfire: {
    padRoots: ["C2", "G2"],
    padIntervalBars: 2,
    padGain: 0.15,
    motifPool: ["nostalgia"],
    melodyDensity: 0.4,
    melodyGain: 0.13,
    rhythmHitsPerBar: 1,
    rhythmGain: 0.035,
    rhythmFreq: 2200,
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
  /** 终关战斗（battle-7）：主题 A 归乡旋律收束 + 最大压迫节奏。 */
  battle_final: {
    padRoots: ["C2", "G2"],
    padIntervalBars: 2,
    padGain: 0.14,
    motifPool: ["nostalgia"],
    melodyDensity: 0.3,
    melodyGain: 0.12,
    rhythmHitsPerBar: 6,
    rhythmGain: 0.1,
    rhythmFreq: 2400,
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
      rhythmGain: 0.09,
      melodyDensity: 0.08,
      melodyGain: 0.04,
      motifPool: ["guilt"],
    };
  }
  // stage 5-6（非终关）
  return {
    tempoBpm: 104,                                              // 后期：+8 BPM
    rhythmGain: 0.1,
    melodyDensity: 0.15,
    melodyGain: 0.06,
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
    return { tempoBpm: 76, melodyDensity: 0.5 };                 // 中期：略提速
  }
  return { tempoBpm: 80, melodyDensity: 0.55, rhythmGain: 0.055 }; // 后期：接近 battle 前奏感
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

/** 旋律动机游标：motifId → 当前步索引。 */
const motifCursors = new Map<MotifId, number>();

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
    return {
      ...base,
      // 敌人注入的动机优先于关卡默认动机
      motifPool: enemyMotifs.length > 0 ? enemyMotifs : (stageOverrides.motifPool ?? base.motifPool),
      ...stageOverrides,
      // 如果敌人没有指定动机且关卡也没有，保持静默
      melodyDensity: (enemyMotifs.length > 0 || (stageOverrides.motifPool ?? []).length > 0)
        ? (stageOverrides.melodyDensity ?? base.melodyDensity)
        : base.melodyDensity,
      melodyGain: (enemyMotifs.length > 0 || (stageOverrides.motifPool ?? []).length > 0)
        ? (stageOverrides.melodyGain ?? base.melodyGain)
        : base.melodyGain,
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
      type: "sine",
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

/* ----------------------------- L1 旋律（主题动机） ----------------------------- */

function scheduleMelody(scene: LayerConfig, time: number): void {
  const ctx = getAudioContext();
  const dest = getBgmGain();
  if (!ctx || !dest || scene.motifPool.length === 0) return;
  const gain = eff(scene.melodyGain);
  if (gain <= 0.0001) return;
  if (Math.random() > scene.melodyDensity) return;

  // 轮播动机，取下一个音
  const motifId = scene.motifPool[stepIndex % scene.motifPool.length]!;
  const steps = MOTIFS[motifId] as readonly MotifStep[];
  const cursor = (motifCursors.get(motifId) ?? 0) % steps.length;
  const step = steps[cursor]!;
  motifCursors.set(motifId, cursor + 1);

  // 椰胡颤音质感（detuned pair），区别于纯 sine 的单薄
  const oscType = motifId === "guilt" ? "sine" : "sine";
  scheduleTone(f(step.note), time, {
    type: oscType,
    durationMs: 520,
    gain,
    attackMs: 8,
    releaseMs: 360,
    detuneCents: 7,
    destination: dest,
  });
}

/* ----------------------------- L2 节奏（木鱼/扁鼓） ----------------------------- */

function scheduleRhythm(scene: LayerConfig, time: number, stepInBar: number): void {
  const ctx = getAudioContext();
  const dest = getBgmGain();
  if (!ctx || !dest || scene.rhythmHitsPerBar === 0) return;
  const gain = eff(scene.rhythmGain);
  if (gain <= 0.0001) return;

  const perBar = stepsPerBar(scene);
  const interval = perBar / scene.rhythmHitsPerBar;
  // 仅在对应步触发
  if (stepInBar % Math.round(interval) !== 0) return;

  // 木鱼感：短带通噪声
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * 0.04));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = scene.rhythmFreq;
  filter.Q.value = 1.2;
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, time);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
  src.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(dest);
  src.start(time);
  src.stop(time + 0.08);
}

/* ----------------------------- L3 主题高光（一次性） ----------------------------- */

/**
 * 触发主题高光：完整奏响一段动机，覆盖 ducking（短时穿透）。
 * 用于土楼里程碑、结局归乡收束。
 */
export function triggerMotif(motifId: MotifId, opts?: { gain?: number }): void {
  const ctx = getAudioContext();
  const dest = getBgmGain();
  if (!ctx || !dest) return;
  const steps = MOTIFS[motifId] as readonly MotifStep[];
  const beat = stepSeconds(resolveScene());
  const peak = opts?.gain ?? 0.2;
  let cursor = ctx.currentTime + 0.05;
  for (const s of steps) {
    const dur = s.beats * beat * 1000;
    scheduleTone(f(s.note), cursor, {
      type: motifId === "guilt" ? "sine" : "sine",
      durationMs: dur,
      gain: peak,
      attackMs: 12,
      releaseMs: 280,
      detuneCents: 5,
      destination: dest,
    });
    cursor += (dur / 1000) * 0.9;
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
    // L1 旋律：偶数步
    if (stepIndex % 2 === 0) {
      scheduleMelody(scene, nextStepTime);
    }
    // L2 节奏
    scheduleRhythm(scene, nextStepTime, stepInBar);

    nextStepTime += stepSeconds(scene);
    stepIndex += 1;
  }
}

function startScheduler(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  nextStepTime = ctx.currentTime + 0.12;
  stepIndex = 0;
  motifCursors.clear();
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
  if (volume !== undefined) {
    const clamped = Math.max(0, Math.min(1, volume));
    const dest = getBgmGain();
    if (dest) dest.gain.setTargetAtTime(clamped, ctx.currentTime, 0.05);
  }
  startScheduler();
}

/** 切换音乐场景（按 phase/journey）。ending 场景会停止调度层但保留 duck 状态。 */
export function setBgmScene(sceneId: BgmSceneId): void {
  if (currentScene === sceneId) return;
  currentScene = sceneId;
  motifCursors.clear();
  // 离开战斗时清除战斗上下文
  if (sceneId !== "battle" && sceneId !== "battle_final") {
    activeContext = null;
  }
  // ending 场景：直接停调度（让位海浪/朗读）
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
  // 切上下文后重置旋律游标，让新动机立即生效
  motifCursors.clear();
}

/** 清除战斗上下文（离开战斗 phase 时调用）。 */
export function clearBattleContext(): void {
  activeContext = null;
  motifCursors.clear();
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
}

export function restoreBgm(): void {
  duckMultiplier = 1;
}

function stopScheduler(): void {
  if (schedulerTimer !== null) {
    window.clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}

export function stopBgm(): void {
  running = false;
  stopScheduler();
  // 让余音自然衰减，不强制停 osc（避免咔哒声）
}
