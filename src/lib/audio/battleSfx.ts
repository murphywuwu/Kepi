import { ASSET_MANIFEST } from "@/data/assets";
import type { HomeRepairTier } from "@/types";

function playOneShot(src: string, volume: number, playbackRate = 1): void {
  if (typeof window === "undefined") return;
  const audio = new Audio(src);
  audio.volume = volume;
  audio.playbackRate = playbackRate;
  void audio.play().catch(() => undefined);
}

export function playPawnStampSfx(): void {
  playOneShot(ASSET_MANIFEST.audio.sfxPawnStamp, 0.78);
}

export function playPawnGoldSfx(): void {
  window.setTimeout(() => {
    playOneShot(ASSET_MANIFEST.audio.sfxPawnGold, 0.68);
  }, 280);
}

export function playTulouShieldSfx(): void {
  playOneShot(ASSET_MANIFEST.audio.sfxRepairHome, 0.42, 1.15);
}

export function playTulouAtkSpeedSfx(): void {
  playOneShot(ASSET_MANIFEST.audio.sfxStarUp, 0.48, 0.92);
}

export function playTulouCheatDeathSfx(): void {
  playOneShot(ASSET_MANIFEST.audio.sfxLanternGlow, 0.62, 0.88);
}

export function playWaterGuestBreathSfx(): void {
  playOneShot(ASSET_MANIFEST.audio.sfxCollectLetter, 0.28, 0.72);
}

export function playWaterGuestHeartbeatSfx(): void {
  playOneShot(ASSET_MANIFEST.audio.sfxLose, 0.42, 1.35);
  window.setTimeout(() => {
    playOneShot(ASSET_MANIFEST.audio.sfxLose, 0.32, 1.2);
  }, 420);
}

export function playWaterGuestDeathSfx(): void {
  playOneShot(ASSET_MANIFEST.audio.sfxLose, 0.82);
  window.setTimeout(() => {
    playOneShot(ASSET_MANIFEST.audio.voiceYeHeren, 0.22, 0.55);
  }, 180);
}

/** Play battle-start buff cues once per fight. */
export function playTulouBattleStartSfx(tier: HomeRepairTier): void {
  if (tier >= 1) playTulouShieldSfx();
  if (tier >= 2) {
    window.setTimeout(() => playTulouAtkSpeedSfx(), tier >= 3 ? 420 : 260);
  }
}
