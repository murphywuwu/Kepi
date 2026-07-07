/**
 * 文件化 BGM 播放层（V3 音色工程之一）。
 *
 * 设计目标：把 Music Cog 等生成的成品 MP3（public/audio/bgm/kepi_bgm_<scene>.mp3）
 * 接入现有音频图，复用全局音量（masterGain）与山洞混响（bgmReverbSend），
 * 并在文件缺失/加载失败时通过 onError 回调静默回退到程序化合成。
 *
 * 信号链：
 *   <audio>(loop) → MediaElementSource → fileBgmGain(0.6)
 *        → masterGain（干） ＋ → bgmReverbSend → convolver → masterGain（湿）
 *
 * 场景切换走交叉淡入（fileBgmGain 先压低再回满），避免硬切。
 */

import { getAudioContext, getFileBgmGain } from "./context";

/** 文件化 BGM 基准增益（与程序化 bgmGain 体量对齐）。 */
const FILE_BGM_BASE = 0.6;

let audioEl: HTMLAudioElement | null = null;
let mediaSource: MediaElementAudioSourceNode | null = null;
let fileMode = false;
let currentUrl: string | null = null;
let lastLoadedUrl: string | null = null;
let ducked = false;
let onErrorCallback: ((url: string | null) => void) | null = null;

function ensureElement(): { el: HTMLAudioElement } | null {
  const ctx = getAudioContext();
  const gain = getFileBgmGain();
  if (!ctx || !gain) return null;
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.loop = true;
    audioEl.preload = "auto";
    try {
      mediaSource = ctx.createMediaElementSource(audioEl);
      mediaSource.connect(gain);
    } catch {
      // createMediaElementSource 在某些浏览器需用户手势后才可用；交由上层回退
      audioEl = null;
      return null;
    }
    audioEl.addEventListener("error", () => {
      if (onErrorCallback) onErrorCallback(currentUrl);
    });
  }
  return audioEl ? { el: audioEl } : null;
}

/** 注册文件加载失败回调（bgm.ts 用于静默回退程序化合成）。 */
export function setFileBgmErrorHandler(cb: (url: string | null) => void): void {
  onErrorCallback = cb;
}

/** 是否在文件化模式（当前场景已成功接入 MP3）。 */
export function isFileBgmMode(): boolean {
  return fileMode;
}

/**
 * 播放指定场景的 MP3（循环）。返回是否已成功发起加载（false = 无音频上下文，
 * 立即回退程序化）。异步加载失败由 onError 回调处理。
 */
export function playFileBgm(url: string): boolean {
  const ctx = getAudioContext();
  const gain = getFileBgmGain();
  const built = ensureElement();
  if (!ctx || !gain || !built) {
    if (onErrorCallback) onErrorCallback(url);
    return false;
  }
  const { el } = built;
  currentUrl = url;
  fileMode = true;

  const targetGain = ducked ? FILE_BGM_BASE * 0.3 : FILE_BGM_BASE;

  const startPlay = () => {
    const p = el.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        // 自动播放被拦截：首次手势后重试一次
        const retry = () => {
          const pp = el.play();
          if (pp && typeof pp.catch === "function") pp.catch(() => undefined);
        };
        window.addEventListener("pointerdown", retry, { once: true });
        window.addEventListener("keydown", retry, { once: true });
      });
    }
  };

  if (lastLoadedUrl !== url) {
    // 交叉淡出 → 换源 → 淡入
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), t);
    gain.gain.linearRampToValueAtTime(0.0001, t + 0.35);
    el.src = url;
    lastLoadedUrl = url;
    const onCanPlay = () => {
      el.removeEventListener("canplay", onCanPlay);
      const tt = ctx.currentTime;
      gain.gain.cancelScheduledValues(tt);
      gain.gain.setValueAtTime(0.0001, tt);
      gain.gain.linearRampToValueAtTime(targetGain, tt + 0.4);
      startPlay();
    };
    el.addEventListener("canplay", onCanPlay);
    el.load();
  } else {
    // 同一首：仅确保播放与音量
    gain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.05);
    startPlay();
  }
  return true;
}

/** 退出文件模式（暂停音频元素）。 */
export function stopFileBgm(): void {
  fileMode = false;
  currentUrl = null;
  if (audioEl) audioEl.pause();
}

/** 危机 ducking：文件化 BGM 同步压低。 */
export function duckFileBgm(ratio = 0.32): void {
  ducked = true;
  const ctx = getAudioContext();
  const gain = getFileBgmGain();
  if (ctx && gain && fileMode) {
    gain.gain.setTargetAtTime(FILE_BGM_BASE * ratio, ctx.currentTime, 0.05);
  }
}

/** 恢复 ducking。 */
export function restoreFileBgm(): void {
  ducked = false;
  const ctx = getAudioContext();
  const gain = getFileBgmGain();
  if (ctx && gain && fileMode) {
    gain.gain.setTargetAtTime(FILE_BGM_BASE, ctx.currentTime, 0.05);
  }
}
