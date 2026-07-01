import { BOARD_ANCHOR } from "./boardLayout";

/** Shared bottom stack heights for prep dock + bench positioning (rem). */
export const BOTTOM_SHOP_HEIGHT_REM = 10.5;
/** Collapsed letter strip (header + narrative line + padding). */
export const BOTTOM_LETTER_STRIP_REM = 5.5;
export const BOTTOM_LETTER_EXPANDED_EXTRA_REM = 5.5;
export const BOTTOM_STACK_GAP_REM = 0.5;
/** Gap between bench float and the dock stack above it. */
export const BOTTOM_BENCH_CLEARANCE_REM = 1.25;
/** Conservative fallback before the dock is measured (expanded letter + shop warnings). */
export const BOTTOM_BENCH_FALLBACK_EXTRA_REM = 2;
/** Left gutter inset for the bench dock (ratio of viewport width). */
export const BENCH_DOCK_LEFT_RATIO = 0.05;
/** Keep bench clear of the ally grid's left edge. */
export const BENCH_DOCK_BOARD_GAP_RATIO = 0.02;

export function benchBottomRem(prepShopVisible: boolean, letterExpanded: boolean): number {
  const letter = BOTTOM_LETTER_STRIP_REM + (letterExpanded ? BOTTOM_LETTER_EXPANDED_EXTRA_REM : 0);
  const shop = prepShopVisible ? BOTTOM_SHOP_HEIGHT_REM + BOTTOM_STACK_GAP_REM : 0;
  return (
    letter +
    shop +
    BOTTOM_STACK_GAP_REM +
    BOTTOM_BENCH_CLEARANCE_REM +
    BOTTOM_BENCH_FALLBACK_EXTRA_REM
  );
}

export function benchDockBottomOffset(
  dockHeightPx: number,
  rootFontSizePx: number,
  fallbackBottomRem: number,
): string {
  if (dockHeightPx > 0) {
    const clearancePx = BOTTOM_BENCH_CLEARANCE_REM * rootFontSizePx;
    return `${Math.ceil(dockHeightPx + clearancePx)}px`;
  }
  return `${fallbackBottomRem}rem`;
}

/** Pin the bench dock in the left gutter beside the ally board. */
export function benchDockStyle(bottom: string): {
  bottom: string;
  left: string;
  maxWidth: string;
} {
  const boardLeftRatio =
    BOARD_ANCHOR.centerXRatio - BOARD_ANCHOR.boardWidthRatio / 2;
  const maxWidthRatio = Math.max(
    0.16,
    boardLeftRatio - BENCH_DOCK_LEFT_RATIO - BENCH_DOCK_BOARD_GAP_RATIO,
  );

  return {
    bottom,
    left: `max(0.75rem, ${BENCH_DOCK_LEFT_RATIO * 100}%)`,
    maxWidth: `min(20rem, ${maxWidthRatio * 100}%)`,
  };
}
