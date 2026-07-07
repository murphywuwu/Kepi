/**
 * Web Audio 运行时核心：单一 AudioContext + 主增益 + 首次手势 resume。
 *
 * V2 音色重做：在总线层加入「空间感」与「暖色」，让程序化合成不再是干瘪的
 * demo 音——这是「听感立刻变好」收益最高、风险最低的一层。
 *
 * 信号链（见 docs/kepi_audio-design_v1.md §6 / V2 补充）：
 *
 *   masterGain(音量)
 *     ├─ bgmGain(0.55) → bgmSceneFade(场景淡入) → bgmTone(低通暖色) ─┐→ masterGain（干）
 *     │                                                              └→ bgmReverbSend → convolver → masterGain（湿·山洞混响）
 *     └─ sfxGain(1.0) ──────────────────────────────────────────────┐→ masterGain（干）
 *                                                                    └→ sfxReverbSend → convolver → masterGain（湿·轻混响）
 *
 * - 混响为「算法脉冲响应」（指数衰减噪声生成），零文件依赖，保持断网可玩。
 * - bgmSceneFade 用于场景切换时的交叉淡入（crossfadeBgm），避免音乐硬切。
 * - bgmTone 是一枚缓坡低通，滤掉刺耳高频，给合成音色「水分」。
 */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let bgmGain: GainNode | null = null;
let sfxGain: GainNode | null = null;

/** V2：场景淡入淡出增益（仅 BGM 总线经过）。 */
let bgmSceneFade: GainNode | null = null;
/** V2：BGM 暖色低通。 */
let bgmTone: BiquadFilterNode | null = null;
/** V2：BGM 混响发送量。 */
let bgmReverbSend: GainNode | null = null;
/** V2：SFX 混响发送量（轻）。 */
let sfxReverbSend: GainNode | null = null;
/** V2：共享卷积混响。 */
let convolver: ConvolverNode | null = null;
/** V3：文件化 BGM 总线（播放 Music Cog 生成的成品 MP3），复用全局音量与山洞混响。 */
let fileBgmGain: GainNode | null = null;

let masterVolume = 0.8;
let gestureBound = false;

const prefersNoAudio = (): boolean => typeof window === "undefined";

/** 生成指数衰减立体声脉冲响应（山洞/厅堂感），无需音频文件。 */
function makeImpulseResponse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * seconds));
  const buffer = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < len; i += 1) {
      const env = Math.pow(1 - i / len, decay);
      data[i] = (Math.random() * 2 - 1) * env;
    }
  }
  return buffer;
}

function createContext(): void {
  if (audioCtx || prefersNoAudio()) return;

  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;

  audioCtx = new Ctor();

  masterGain = audioCtx.createGain();
  masterGain.gain.value = masterVolume;
  masterGain.connect(audioCtx.destination);

  // BGM 总线（保留 0.55 平衡，调用点语义不变）
  bgmGain = audioCtx.createGain();
  bgmGain.gain.value = 0.55;

  bgmSceneFade = audioCtx.createGain();
  bgmSceneFade.gain.value = 1;

  bgmTone = audioCtx.createBiquadFilter();
  bgmTone.type = "lowpass";
  bgmTone.frequency.value = 4200;
  bgmTone.Q.value = 0.4;

  // SFX 总线
  sfxGain = audioCtx.createGain();
  sfxGain.gain.value = 1;

  // 共享混响
  convolver = audioCtx.createConvolver();
  convolver.buffer = makeImpulseResponse(audioCtx, 2.4, 2.8);

  bgmReverbSend = audioCtx.createGain();
  bgmReverbSend.gain.value = 0.38;
  sfxReverbSend = audioCtx.createGain();
  sfxReverbSend.gain.value = 0.16;

  // 文件化 BGM 总线：成品 MP3 接入，复用全局音量与山洞混响
  fileBgmGain = audioCtx.createGain();
  fileBgmGain.gain.value = 0.6;

  // 接线
  bgmGain.connect(bgmSceneFade);
  bgmSceneFade.connect(bgmTone);
  bgmTone.connect(masterGain); // 干
  bgmTone.connect(bgmReverbSend);
  bgmReverbSend.connect(convolver);
  convolver.connect(masterGain); // 湿

  sfxGain.connect(masterGain); // 干
  sfxGain.connect(sfxReverbSend);
  sfxReverbSend.connect(convolver);

  // 文件化 BGM：干 → master，湿 → 共享混响
  fileBgmGain.connect(masterGain);
  fileBgmGain.connect(bgmReverbSend);
}

export function getAudioContext(): AudioContext | null {
  createContext();
  return audioCtx;
}

export function getMasterGain(): GainNode | null {
  createContext();
  return masterGain;
}

export function getBgmGain(): GainNode | null {
  createContext();
  return bgmGain;
}

export function getSfxGain(): GainNode | null {
  createContext();
  return sfxGain;
}

/** V3：文件化 BGM 总线增益（Music Cog 生成的 MP3 经此接入，复用全局音量与混响）。 */
export function getFileBgmGain(): GainNode | null {
  createContext();
  return fileBgmGain;
}

/** 设置主增益（全局音量）。参数为 0–1。 */
export function setMasterVolume(volume: number): void {
  masterVolume = Math.max(0, Math.min(1, volume));
  const ctx = getAudioContext();
  if (ctx && masterGain) {
    masterGain.gain.setTargetAtTime(masterVolume, ctx.currentTime, 0.02);
  }
}

/**
 * V2：场景切换交叉淡入——先快速压低 BGM 总线再回满，
 * 让音乐过渡不再是硬切。由 setBgmScene 在切换时调用。
 */
export function crossfadeBgm(): void {
  const ctx = getAudioContext();
  if (!ctx || !bgmSceneFade) return;
  const t = ctx.currentTime;
  const g = bgmSceneFade.gain;
  g.cancelScheduledValues(t);
  g.setValueAtTime(Math.max(0.0001, g.value), t);
  g.linearRampToValueAtTime(0.32, t + 0.08);
  g.linearRampToValueAtTime(1, t + 0.42);
}

/** 在首个用户手势后唤起被挂起的 AudioContext。 */
export function resumeAudio(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined);
  }
}

/** 绑定一次性手势监听，确保用户首次交互后音频出声。 */
export function ensureGestureResume(): void {
  if (prefersNoAudio() || gestureBound) return;
  gestureBound = true;
  const handler = () => resumeAudio();
  window.addEventListener("pointerdown", handler, { passive: true });
  window.addEventListener("keydown", handler);
  window.addEventListener("touchstart", handler, { passive: true });
}
