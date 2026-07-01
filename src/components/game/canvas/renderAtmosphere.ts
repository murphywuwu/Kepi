import { ASSET_MANIFEST } from "@/data/assets";
import { loadCachedImage } from "@/lib/game/imageCache";
import type { CanvasRenderState } from "./types";

const BG_FOCAL_X = 0.5;
const BG_FOCAL_Y = 0.46;

/** Mid-scene overlays: combat tint, settlement repair sparkle, water guest crisis. */
export function renderSceneAtmosphere(
  ctx: CanvasRenderingContext2D,
  state: CanvasRenderState,
): void {
  if (state.phase === "battle") {
    drawBattleCombatTint(ctx, state);
    if (state.waterGuestCrisisLevel > 0) {
      drawWaterGuestCrisisVignette(ctx, state);
    }
  }

  if (state.waterGuestDeathFlash > 0) {
    drawWaterGuestDeathFlash(ctx, state);
  }
}

/** Foreground drift: mist bands over the whole scene. */
export function renderForegroundAtmosphere(
  ctx: CanvasRenderingContext2D,
  state: CanvasRenderState,
): void {
  const mist = loadCachedImage(
    state.imageCache,
    ASSET_MANIFEST.effects.mist,
    state.requestRepaint,
  );
  if (!mist?.naturalWidth) return;

  const { width, height } = state.metrics;
  const drift = state.timeMs * 0.000035;
  const aspect = mist.naturalWidth / mist.naturalHeight;
  const battleDim = state.phase === "battle" ? 0.55 : 1;

  ctx.save();
  ctx.globalCompositeOperation = "lighten";

  drawMistBand(
    ctx,
    mist,
    width,
    height,
    height * 0.06,
    height * 0.2,
    aspect,
    drift,
    0.16 * battleDim,
  );
  drawMistBand(
    ctx,
    mist,
    width,
    height,
    height * 0.58,
    height * 0.16,
    aspect,
    drift * 0.75 + 0.35,
    0.11 * battleDim,
  );

  ctx.restore();
}

function drawBattleCombatTint(
  ctx: CanvasRenderingContext2D,
  state: CanvasRenderState,
): void {
  const { width, height } = state.metrics;
  const pulse = 0.55 + 0.45 * Math.sin(state.timeMs * 0.0045);
  const active = state.battleEvents.length > 0 && state.battleTick > 0;
  const intensity = active ? pulse : 0.65 + pulse * 0.2;

  ctx.save();

  const topGlow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.1,
    0,
    width * 0.5,
    height * 0.1,
    width * 0.62,
  );
  topGlow.addColorStop(0, `rgba(193, 18, 31, ${0.28 * intensity})`);
  topGlow.addColorStop(0.45, `rgba(120, 24, 32, ${0.1 * intensity})`);
  topGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, width, height);

  const streak = ctx.createLinearGradient(
    width * BG_FOCAL_X,
    height * 0.05,
    width * BG_FOCAL_X,
    height * BG_FOCAL_Y,
  );
  streak.addColorStop(0, "rgba(193, 18, 31, 0)");
  streak.addColorStop(0.35, `rgba(193, 18, 31, ${0.09 * intensity})`);
  streak.addColorStop(0.7, `rgba(193, 18, 31, ${0.04 * intensity})`);
  streak.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = streak;
  ctx.fillRect(0, 0, width, height);

  const enemyHalf = ctx.createLinearGradient(0, 0, 0, height * 0.42);
  enemyHalf.addColorStop(0, `rgba(44, 36, 22, ${0.12 * intensity})`);
  enemyHalf.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = enemyHalf;
  ctx.fillRect(0, 0, width, height * 0.42);

  ctx.restore();
}

function drawWaterGuestCrisisVignette(
  ctx: CanvasRenderingContext2D,
  state: CanvasRenderState,
): void {
  const { width, height } = state.metrics;
  const level = state.waterGuestCrisisLevel;
  const pulse = 0.55 + 0.45 * Math.sin(state.timeMs * 0.005);
  const alpha = level === 2 ? 0.34 * pulse : 0.2 * pulse;
  const color = level === 2 ? "193, 18, 31" : "255, 209, 102";

  ctx.save();
  const vignette = ctx.createRadialGradient(
    width * 0.5,
    height * 0.52,
    width * 0.18,
    width * 0.5,
    height * 0.52,
    width * 0.72,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(0.55, `rgba(${color}, ${alpha * 0.35})`);
  vignette.addColorStop(1, `rgba(${color}, ${alpha})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawWaterGuestDeathFlash(
  ctx: CanvasRenderingContext2D,
  state: CanvasRenderState,
): void {
  const { width, height } = state.metrics;
  ctx.save();
  ctx.fillStyle = `rgba(240, 240, 235, ${state.waterGuestDeathFlash})`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawMistBand(
  ctx: CanvasRenderingContext2D,
  mist: HTMLImageElement,
  width: number,
  _height: number,
  y: number,
  bandHeight: number,
  aspect: number,
  drift: number,
  alpha: number,
): void {
  const tileW = bandHeight * aspect;
  const offset = (drift % 1) * tileW;

  ctx.globalAlpha = alpha;
  for (let x = -offset - tileW; x < width + tileW; x += tileW) {
    ctx.drawImage(mist, x, y, tileW, bandHeight);
  }
}

export const SCENE_EFFECT_SRCS = [
  ASSET_MANIFEST.effects.mist,
  ASSET_MANIFEST.effects.attack,
  ASSET_MANIFEST.effects.homeRepair,
] as const;
