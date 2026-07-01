import { ASSET_MANIFEST } from "@/data/assets";

let bgm: HTMLAudioElement | null = null;
let baseVolume = 0.45;
let ducked = false;

export function initBgm(volume = 0.45): void {
  if (typeof window === "undefined") return;

  baseVolume = volume;
  if (!bgm) {
    bgm = new Audio(ASSET_MANIFEST.audio.bgmMain);
    bgm.loop = true;
    bgm.preload = "auto";
  }
  bgm.volume = baseVolume;
  void bgm.play().catch(() => undefined);
}

export function setBgmVolume(volume: number): void {
  baseVolume = Math.max(0, Math.min(1, volume));
  if (bgm && !ducked) {
    bgm.volume = baseVolume;
  }
}

export function duckBgm(ratio = 0.32): void {
  if (!bgm) return;
  ducked = true;
  bgm.volume = baseVolume * ratio;
}

export function restoreBgm(): void {
  if (!bgm) return;
  ducked = false;
  bgm.volume = baseVolume;
}

export function stopBgm(): void {
  if (!bgm) return;
  bgm.pause();
  bgm.currentTime = 0;
}
