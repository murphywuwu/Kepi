import { ASSET_MANIFEST } from "@/data/assets";
import { loadCachedImage } from "@/lib/game/imageCache";
import type { PrepFx } from "@/store/fxStore";
import type { CanvasRenderState } from "./types";

const FX_SRC: Record<PrepFx["kind"], string> = {
  shop_refresh: ASSET_MANIFEST.effects.shopRefresh,
  star_up: ASSET_MANIFEST.effects.starUp,
  letter_pickup: ASSET_MANIFEST.effects.letterPickup,
  repair_home: ASSET_MANIFEST.effects.homeRepair,
  buy_piece: ASSET_MANIFEST.effects.starUp,
  population_up: ASSET_MANIFEST.effects.starUp,
  pawn_kebi: ASSET_MANIFEST.effects.pawnBurn,
  tulou_well: ASSET_MANIFEST.effects.letterPickup,
  tulou_wall: ASSET_MANIFEST.effects.homeRepair,
  tulou_lantern: ASSET_MANIFEST.effects.starUp,
};

const MILESTONE_FX_KINDS = new Set<PrepFx["kind"]>([
  "tulou_well",
  "tulou_wall",
  "tulou_lantern",
]);

export const PREP_FX_SRCS = [
  ASSET_MANIFEST.effects.shopRefresh,
  ASSET_MANIFEST.effects.starUp,
  ASSET_MANIFEST.effects.letterPickup,
  ASSET_MANIFEST.effects.homeRepair,
  ASSET_MANIFEST.effects.pawnBurn,
] as const;

export function renderPrepFxLayer(
  ctx: CanvasRenderingContext2D,
  state: CanvasRenderState,
  prepFx: PrepFx[],
): void {
  if (prepFx.length === 0) return;

  const { width, height } = state.metrics;
  const now = state.timeMs;

  for (const fx of prepFx) {
    const elapsed = now - fx.startedAt;
    if (elapsed < 0) continue;
    const t = elapsed / fx.durationMs;
    if (t >= 1) continue;

    const x = fx.xRatio * width;
    const y = fx.yRatio * height;
    const fade = 1 - t ** 1.6;
    const pulse = 0.75 + 0.25 * Math.sin(t * Math.PI);
    const isMilestoneFx = MILESTONE_FX_KINDS.has(fx.kind);
    const baseSize =
      fx.kind === "letter_pickup" || fx.kind === "tulou_well"
        ? state.metrics.cellSize * 2.4
        : fx.kind === "pawn_kebi"
          ? state.metrics.cellSize * 2.6
          : fx.kind === "repair_home" || fx.kind === "tulou_wall"
            ? state.metrics.cellSize * 2.2
            : fx.kind === "tulou_lantern"
              ? state.metrics.cellSize * 2.8
              : fx.kind === "shop_refresh"
                ? state.metrics.cellSize * 2
                : state.metrics.cellSize * 1.65;
    const size = baseSize * (0.85 + t * 0.35) * pulse;

    ctx.save();
    ctx.globalCompositeOperation =
      fx.kind === "pawn_kebi" ? "screen" : "lighten";

    if (isMilestoneFx) {
      ctx.globalAlpha = fade * 0.92;
      drawTulouMilestoneFx(ctx, fx, x, y, width, height, t, size);
      ctx.restore();
      continue;
    }

    const src = FX_SRC[fx.kind];
    const img = loadCachedImage(state.imageCache, src, state.requestRepaint);
    if (!img?.naturalWidth) {
      ctx.restore();
      continue;
    }

    const isLogisticsFx =
      fx.kind === "letter_pickup" || fx.kind === "repair_home";
    const isPawnFx = fx.kind === "pawn_kebi";
    ctx.globalAlpha = fade * (isLogisticsFx ? 0.92 : isPawnFx ? 0.88 : 0.78);

    if (isPawnFx && t < 0.55) {
      const trail = ctx.createRadialGradient(x, y, 0, x, y, size * 0.9);
      trail.addColorStop(0, `rgba(220, 72, 48, ${0.42 * (1 - t / 0.55)})`);
      trail.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = trail;
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }

    if (isPawnFx) {
      ctx.translate(x, y);
      ctx.rotate(t * Math.PI * 0.35);
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
    } else {
      ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    }

    if (isLogisticsFx && t < 0.55) {
      const trail = ctx.createRadialGradient(x, y, 0, x, y, size * 0.9);
      const trailColor =
        fx.kind === "repair_home" ? "246, 193, 119" : "245, 234, 214";
      trail.addColorStop(0, `rgba(${trailColor}, ${0.35 * (1 - t / 0.55)})`);
      trail.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = trail;
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }

    ctx.restore();
  }
}

function drawTulouMilestoneFx(
  ctx: CanvasRenderingContext2D,
  fx: PrepFx,
  x: number,
  y: number,
  width: number,
  height: number,
  t: number,
  size: number,
): void {
  if (fx.kind === "tulou_well") {
    const particleCount = 14;
    for (let i = 0; i < particleCount; i += 1) {
      const angle = (i / particleCount) * Math.PI * 2 + t * 2.4;
      const startR = Math.max(width, height) * (0.35 - t * 0.2);
      const px = x + Math.cos(angle) * startR * (1 - t * 0.85);
      const py = y + Math.sin(angle) * startR * (1 - t * 0.85);
      const r = size * 0.06 * (1 - t * 0.4);
      ctx.fillStyle = `rgba(246, 193, 119, ${0.75 * (1 - t)})`;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const wellGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 0.8);
    wellGlow.addColorStop(0, `rgba(142, 202, 230, ${0.45 * (1 - t)})`);
    wellGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = wellGlow;
    ctx.fillRect(x - size, y - size, size * 2, size * 2);
    return;
  }

  if (fx.kind === "tulou_wall") {
    const sweepY = height * (1 - t * 0.55);
    const grad = ctx.createLinearGradient(0, sweepY - size, 0, sweepY + size * 0.4);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.45, `rgba(246, 193, 119, ${0.55 * (1 - t * 0.3)})`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, sweepY - size, width, size * 1.4);

    const shield = ctx.createRadialGradient(x, y, 0, x, y, size);
    shield.addColorStop(0, `rgba(246, 193, 119, ${0.35 * (1 - t)})`);
    shield.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shield;
    ctx.fillRect(x - size, y - size, size * 2, size * 2);
    return;
  }

  const ringPulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
  for (let edge = 0; edge < 4; edge += 1) {
    const alpha = 0.22 * (1 - t) * ringPulse;
    const inset = size * (0.2 + t * 0.35);
    ctx.strokeStyle = `rgba(246, 193, 119, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(inset + edge * 8, inset + edge * 8, width - inset * 2 - edge * 16, height - inset * 2 - edge * 16);
  }

  const halo = ctx.createRadialGradient(x, y, 0, x, y, size * 1.1);
  halo.addColorStop(0, `rgba(255, 214, 140, ${0.5 * (1 - t)})`);
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(x - size * 1.2, y - size * 1.2, size * 2.4, size * 2.4);
}
