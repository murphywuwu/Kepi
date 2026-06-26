"use client";

import { useCallback, useEffect, useRef } from "react";
import { spawnEnemiesForStage } from "@/engine/battle";
import { homeRepairStage } from "@/engine/progression";
import { ENEMY_VISUALS, PIECE_VISUALS } from "@/lib/game/assets";
import { computeBoardMetrics, pixelToBoard } from "@/lib/game/boardLayout";
import {
  battleReplayEventCount,
  replayBattleHp,
} from "@/lib/game/battleReplay";
import { loadCachedImage } from "@/lib/game/imageCache";
import {
  TULOU_BACKGROUND_SRCS,
  transitionBurstForCrossing,
} from "@/lib/game/tulouBackground";
import type { BoardPosition, GameSnapshot } from "@/types";
import { hitTestUnits } from "@/lib/game/unitHitTest";
import {
  resolveAllyBoardPosition,
  resolveEnemyBoardPosition,
  tooltipAnchorFromSprite,
  unitSpriteMetrics,
} from "@/lib/game/unitLayout";
import { useFxStore } from "@/store/fxStore";
import { useUIStore } from "@/store/uiStore";
import { buildBattleEffects, renderGameCanvas } from "./renderFrame";
import { SCENE_EFFECT_SRCS } from "./renderAtmosphere";
import { PREP_FX_SRCS } from "./renderPrepFx";
import type { CanvasRenderState } from "./types";

const AMBIENT_FPS = 24;
const TRANSITION_BURST_MS = 450;

type ActiveBurst = {
  src: string;
  startMs: number;
  durationMs: number;
};

type UseGameCanvasOptions = {
  snapshot: GameSnapshot;
  selectedPieceId: string | null;
  onCellClick?: (position: BoardPosition) => void;
  onUnitClick?: (pieceId: string) => void;
};

export function useGameCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  { snapshot, selectedPieceId, onCellClick, onUnitClick }: UseGameCanvasOptions,
) {
  const imageCache = useRef(new Map<string, HTMLImageElement | "loading" | "error">());
  const portraitCache = useRef(new Map<string, HTMLImageElement | "loading" | "error">());
  const battleTickRef = useRef(0);
  const battleFrameRef = useRef(0);
  const snapshotRef = useRef(snapshot);
  const selectedRef = useRef(selectedPieceId);
  const paintRef = useRef<() => void>(() => {});
  const timeMsRef = useRef(0);
  const burstRef = useRef<ActiveBurst | null>(null);
  const prevHomeRepairRef = useRef(snapshot.state.homeRepair);
  const lastKebiFxRef = useRef(snapshot.state.kebi);
  const prepFxRef = useRef(useFxStore.getState().prepFx);
  const hoveredTargetRef = useRef<{ side: "ally" | "enemy"; unitId: string } | null>(
    null,
  );
  const hoveredAllyCellRef = useRef<BoardPosition | null>(null);
  const lastHoveredCellKeyRef = useRef("");

  const setHoveredAllyCell = (cell: BoardPosition | null) => {
    const key = cell ? `${cell.x},${cell.y}` : "";
    if (key === lastHoveredCellKeyRef.current) return;
    lastHoveredCellKeyRef.current = key;
    hoveredAllyCellRef.current = cell;
    paintRef.current();
  };

  useEffect(() => {
    return useFxStore.subscribe((state) => {
      prepFxRef.current = state.prepFx;
      paintRef.current();
    });
  }, []);

  useEffect(() => {
    let lastHoverKey = "";
    return useUIStore.subscribe((state) => {
      const hover = state.hoveredUnit;
      const nextTarget = hover ? { side: hover.side, unitId: hover.unitId } : null;
      const nextKey = nextTarget ? `${nextTarget.side}:${nextTarget.unitId}` : "";
      hoveredTargetRef.current = nextTarget;
      if (nextKey !== lastHoverKey) {
        lastHoverKey = nextKey;
        paintRef.current();
      }
    });
  }, []);

  useEffect(() => {
    snapshotRef.current = snapshot;
    selectedRef.current = selectedPieceId;
    if (!selectedPieceId) {
      setHoveredAllyCell(null);
    }
  }, [snapshot, selectedPieceId]);

  useEffect(() => {
    const prev = prevHomeRepairRef.current;
    const next = snapshot.state.homeRepair;
    const burstSrc = transitionBurstForCrossing(prev, next);
    if (burstSrc) {
      burstRef.current = {
        src: burstSrc,
        startMs: performance.now(),
        durationMs: TRANSITION_BURST_MS,
      };
    }
    prevHomeRepairRef.current = next;
  }, [snapshot.state.homeRepair]);

  useEffect(() => {
    const { kebi } = snapshot.state;
    const won =
      snapshot.phase === "settlement" && (snapshot.lastBattleResult?.won ?? false);

    if (won && kebi > lastKebiFxRef.current) {
      useFxStore.getState().pushPrepFx({
        kind: "letter_pickup",
        xRatio: 0.11,
        yRatio: 0.13,
        durationMs: 1400,
      });
    }
    lastKebiFxRef.current = kebi;
  }, [snapshot.state.kebi, snapshot.phase, snapshot.lastBattleResult]);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const now = performance.now();
    const current = snapshotRef.current;
    const metrics = computeBoardMetrics(rect.width, rect.height);
    const tulouStage = homeRepairStage(current.state.homeRepair);
    let enemies =
      current.phase === "prep" ||
      current.phase === "battle" ||
      current.phase === "settlement"
        ? spawnEnemiesForStage(current.state.stage)
        : [];

    const battleEvents = current.lastBattleResult?.events ?? [];
    let allies = current.board;

    if (
      current.lastBattleResult &&
      (current.phase === "battle" || current.phase === "settlement")
    ) {
      const eventCount = battleReplayEventCount(
        current.phase,
        battleTickRef.current,
        battleEvents.length,
      );
      const replayed = replayBattleHp(allies, enemies, battleEvents, eventCount);
      allies = replayed.allies;
      enemies = replayed.enemies;
    }

    const effects = buildBattleEffects(
      battleEvents,
      battleTickRef.current,
      current.board,
      spawnEnemiesForStage(current.state.stage),
    );

    const burst = burstRef.current;
    const transitionBurst =
      burst && now - burst.startMs < burst.durationMs
        ? {
            src: burst.src,
            progress: Math.min(1, (now - burst.startMs) / burst.durationMs),
          }
        : null;

    if (burst && !transitionBurst) {
      burstRef.current = null;
    }

    useFxStore.getState().prunePrepFx(now);

    const state: CanvasRenderState = {
      metrics,
      phase: current.phase,
      tulouStage,
      homeRepair: current.state.homeRepair,
      allies,
      enemies,
      hoveredAllyCell: hoveredAllyCellRef.current,
      selectedPieceId: selectedRef.current,
      battleEvents,
      battleTick: battleTickRef.current,
      lastBattleWon:
        current.phase === "settlement"
          ? (current.lastBattleResult?.won ?? null)
          : null,
      effects,
      timeMs: timeMsRef.current || now,
      transitionBurst,
      prepFx: prepFxRef.current,
      hoveredUnit: hoveredTargetRef.current,
      imageCache: imageCache.current,
      portraitCache: portraitCache.current,
      requestRepaint: () => paintRef.current(),
    };

    renderGameCanvas(ctx, state);
  }, [canvasRef]);

  useEffect(() => {
    paintRef.current = paint;
  }, [paint]);

  useEffect(() => {
    battleTickRef.current = 0;
    battleFrameRef.current = 0;
    paint();
  }, [snapshot, selectedPieceId, paint]);

  useEffect(() => {
    const onLoad = () => paintRef.current();
    const cache = imageCache.current;

    for (const src of TULOU_BACKGROUND_SRCS) {
      loadCachedImage(cache, src, onLoad);
    }
    for (const src of SCENE_EFFECT_SRCS) {
      loadCachedImage(cache, src, onLoad);
    }
    for (const src of PREP_FX_SRCS) {
      loadCachedImage(cache, src, onLoad);
    }
  }, []);

  useEffect(() => {
    const current = snapshotRef.current;
    const onLoad = () => paintRef.current();
    const cache = portraitCache.current;

    for (const piece of current.board) {
      const meta = PIECE_VISUALS[piece.type];
      loadCachedImage(cache, meta.portrait, onLoad);
    }

    const showEnemies =
      current.phase === "prep" ||
      current.phase === "battle" ||
      current.phase === "settlement";
    if (showEnemies) {
      const enemies = spawnEnemiesForStage(current.state.stage);
      for (const enemy of enemies) {
        const meta = ENEMY_VISUALS[enemy.type];
        loadCachedImage(cache, meta.portrait, onLoad);
      }
    }
  }, [snapshot.board, snapshot.phase, snapshot.state.stage]);

  useEffect(() => {
    let raf = 0;
    let lastPaint = 0;
    const frameMs = 1000 / AMBIENT_FPS;

    const tick = (now: number) => {
      timeMsRef.current = now;

      const battleResult = snapshotRef.current.lastBattleResult;
      const battleAnimating =
        snapshotRef.current.phase === "battle" &&
        Boolean(battleResult) &&
        battleTickRef.current < battleResult!.events.length;

      if (battleAnimating) {
        battleFrameRef.current += 1;
        if (battleFrameRef.current % 3 === 0) {
          battleTickRef.current += 1;
        }
      }

      const burstActive =
        burstRef.current !== null &&
        now - burstRef.current.startMs < burstRef.current.durationMs;

      const needsAmbient =
        burstActive ||
        battleAnimating ||
        snapshotRef.current.phase === "battle" ||
        snapshotRef.current.phase === "settlement" ||
        prepFxRef.current.length > 0 ||
        (snapshotRef.current.phase === "prep" &&
          Boolean(selectedRef.current) &&
          hoveredAllyCellRef.current !== null);

      const shouldPaint = needsAmbient || now - lastPaint >= frameMs;

      if (shouldPaint) {
        paintRef.current();
        lastPaint = now;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (snapshot.phase === "battle") {
      useFxStore.getState().clearPrepFx();
    }
    if (snapshot.phase !== "battle") {
      battleFrameRef.current = 0;
    }
    useUIStore.getState().setHoveredUnit(null);
  }, [snapshot.phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const current = snapshotRef.current;
      const metrics = computeBoardMetrics(rect.width, rect.height);
      const enemies =
        current.phase === "prep" ||
        current.phase === "battle" ||
        current.phase === "settlement"
          ? spawnEnemiesForStage(current.state.stage)
          : [];

      const placing =
        current.phase === "prep" && Boolean(selectedRef.current);

      if (placing) {
        const allyCell = pixelToBoard(x, y, metrics, true);
        setHoveredAllyCell(allyCell);
        if (allyCell) {
          canvas.style.cursor = "pointer";
          useUIStore.getState().setHoveredUnit(null);
          return;
        }
      } else {
        setHoveredAllyCell(null);
      }

      const hit = hitTestUnits(
        x,
        y,
        metrics,
        current.board,
        enemies,
        current.phase,
        { skipAllies: placing },
      );

      if (!hit) {
        canvas.style.cursor = placing ? "default" : "";
        useUIStore.getState().setHoveredUnit(null);
        return;
      }

      canvas.style.cursor = "pointer";
      let position;
      if (hit.side === "ally") {
        const allyIndex = current.board.findIndex((piece) => piece.id === hit.id);
        const piece = current.board[allyIndex];
        if (!piece) return;
        position = resolveAllyBoardPosition(piece, allyIndex);
      } else {
        const enemyIndex = enemies.findIndex((enemy) => enemy.id === hit.id);
        const enemy = enemies[enemyIndex];
        if (!enemy) return;
        position = resolveEnemyBoardPosition(enemy, enemyIndex, enemies.length);
      }
      const anchor = tooltipAnchorFromSprite(
        unitSpriteMetrics(position, metrics),
        rect,
      );

      useUIStore.getState().setHoveredUnit({
        side: hit.side,
        unitId: hit.id,
        anchorX: anchor.anchorX,
        anchorY: anchor.anchorY,
      });
    };

    const handleMove = (event: MouseEvent) => {
      updatePointer(event.clientX, event.clientY);
    };

    const handleLeave = () => {
      canvas.style.cursor = "";
      setHoveredAllyCell(null);
      useUIStore.getState().setHoveredUnit(null);
    };

    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseleave", handleLeave);
    return () => {
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseleave", handleLeave);
      canvas.style.cursor = "";
    };
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => paint());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef, paint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onCellClick) return;

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const metrics = computeBoardMetrics(rect.width, rect.height);
      const current = snapshotRef.current;

      if (current.phase !== "prep") return;

      const enemies = spawnEnemiesForStage(current.state.stage);
      const selectedId = selectedRef.current;

      if (selectedId) {
        const hit = hitTestUnits(
          x,
          y,
          metrics,
          current.board,
          enemies,
          current.phase,
        );
        if (hit?.side === "ally" && hit.id !== selectedId) {
          onUnitClick?.(hit.id);
          return;
        }

        const cell = pixelToBoard(x, y, metrics, true);
        if (cell) {
          onCellClick?.(cell);
          return;
        }
        return;
      }

      const hit = hitTestUnits(
        x,
        y,
        metrics,
        current.board,
        enemies,
        current.phase,
      );
      if (hit?.side === "ally") {
        onUnitClick?.(hit.id);
      }
    };

    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [canvasRef, onCellClick, onUnitClick]);
}
