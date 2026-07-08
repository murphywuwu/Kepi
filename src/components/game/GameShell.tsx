"use client";

import { useEffect } from "react";
import { loadSnapshot, hasSavedSnapshot } from "@/lib/storage/snapshot";
import {
  initBgm,
  setBgmScene,
  setBattleContext,
  clearBattleContext,
  setRouteProgress,
  type BgmSceneId,
} from "@/lib/audio/bgm";
import { ensureGestureResume, setMasterVolume } from "@/lib/audio/context";
import { loadSettings } from "@/lib/storage/settings";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { usePrepNodeEnter } from "@/hooks/usePrepNodeEnter";
import { BattleOverlay, SettlementOverlay } from "./PhaseOverlays";
import { BattleHud } from "./BattleHud";
import { CampfirePanel } from "./CampfirePanel";
import { EndingPhase } from "./EndingPhase";
import { GameCanvas } from "./GameCanvas";
import { GameChrome } from "./GameChrome";
import { GameDialogs } from "./GameDialogs";
import { isNarrativePhase } from "@/lib/game/journeyUi";
import { isPrepInteractive } from "@/lib/game/prepUi";
import { BALANCE } from "@/data";
import { OpeningBuffLayer } from "./OpeningBuffLayer";
import { AssassinWarningLayer } from "./AssassinWarningLayer";
import { LeafFallLayer } from "./LeafFallLayer";
import { PawnShopPanel } from "./PawnShopPanel";
import { PrepCountdown } from "./PrepCountdown";
import { PrepGuideLayer } from "./PrepGuideLayer";
import { StageBriefOverlay } from "./StageBriefOverlay";
import { SettingsMenu } from "./SettingsMenu";
import { ToastHost } from "./ToastHost";
import { UnitInspectOverlay } from "./UnitInspectOverlay";
import { PieceInspectTooltip } from "./PieceInspectTooltip";
import { levelInteractionForNode } from "@/data/levelInteractions";
import { currentJourneyNode, isFinalJourneyNode } from "@/engine/journey";

const PREP_TIMEOUT_MS = BALANCE.battle.prepTimeSec * 1000;

export function GameShell() {
  const snapshot = useGameStore((state) => state.snapshot);
  const replaceSnapshot = useGameStore((state) => state.replaceSnapshot);
  const startBattle = useGameStore((state) => state.startBattle);
  const forfeitStage = useGameStore((state) => state.forfeitStage);
  const selectedPieceId = useGameStore((state) => state.selectedPieceId);
  const moveSelected = useGameStore((state) => state.moveSelected);
  const setSelectedPiece = useGameStore((state) => state.setSelectedPiece);
  const pushToast = useUIStore((state) => state.pushToast);
  const setDomPieceInspect = useUIStore((state) => state.setDomPieceInspect);
  const prepSubview = useUIStore((state) => state.prepSubview);
  const { phase, state } = snapshot;
  const settlementCinematicActive = useUIStore(
    (s) => s.settlementCinematicActive,
  );
  const narrativeShell = isNarrativePhase(phase);
  const prepActive = phase === "prep" && isPrepInteractive(prepSubview);

  usePrepNodeEnter();

  useEffect(() => {
    const settings = loadSettings();
    setMasterVolume(settings.volume);
    ensureGestureResume();
    initBgm();

    if (!hasSavedSnapshot()) return;

    const saved = loadSnapshot();
    if (saved) {
      replaceSnapshot(saved);
      return;
    }

    pushToast("存档已过期或损坏，已为你开启新局", "default");
  }, [replaceSnapshot, pushToast]);

  useEffect(() => {
    setDomPieceInspect(null);
  }, [phase, setDomPieceInspect]);

  // 按剧情 phase 切换生成式 BGM 场景（见 docs/kepi_audio-design_v1.md §4.2）
  // V3.2+：battle 场景按敌人类型/关卡序号差异化；route 场景按路线进度渐强
  useEffect(() => {
    const scene = phaseToBgmScene(phase);
    setBgmScene(scene);

    // battle 场景：注入战斗上下文（敌人/关卡/终关标记）
    if (phase === "battle") {
      const node = currentJourneyNode(snapshot);
      const interaction = levelInteractionForNode(snapshot.state.currentNodeId);
      const isFinal = isFinalJourneyNode(snapshot);
      if (interaction && node) {
        setBattleContext({
          stage: snapshot.state.stage,
          featuredEnemy: interaction.featuredEnemy,
          tone: interaction.tone,
          isFinal,
        });
      }
    } else {
      clearBattleContext();
    }

    // route 场景（prep/settlement/opening_buff）：设置路线进度驱动渐强
    if (scene === "route") {
      setRouteProgress(snapshot.state.journeyIndex);
    }
  }, [phase, snapshot]);

  useEffect(() => {
    if (phase !== "prep" || !isPrepInteractive(prepSubview)) return;

    const timer = window.setTimeout(() => {
      if (!startBattle()) {
        forfeitStage();
        pushToast("备战超时，未布阵 — 本关判负", "error");
        return;
      }
      pushToast("备战超时，自动开战", "default");
    }, PREP_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [phase, prepSubview, state.journeyIndex, startBattle, forfeitStage, pushToast]);

  if (phase === "ending") {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden bg-kepi-scene">
        <EndingPhase />
        <ToastHost />
        <GameDialogs />
      </div>
    );
  }

  if (narrativeShell) {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden bg-kepi-scene">
        <div className="kepi-scene-glow" aria-hidden />
        <div
          className="kepi-scene-vignette h-full w-full bg-[radial-gradient(circle_at_50%_40%,rgba(139,106,58,0.12),rgba(12,10,8,0.96))]"
          aria-hidden
        />
        <PawnShopPanel />
        <CampfirePanel />
        <SettingsMenu />
        <ToastHost />
        <GameDialogs />
      </div>
    );
  }

  return (
    <>
      <GameChrome
        prepActive={prepActive}
        railDimmed={phase === "prep" && !prepActive}
        railHidden={settlementCinematicActive}
      >
        <GameCanvas
          snapshot={snapshot}
          selectedPieceId={selectedPieceId}
          onUnitClick={(pieceId) => {
            if (!prepActive) return;
            setSelectedPiece(selectedPieceId === pieceId ? null : pieceId);
          }}
          onCellClick={(position) => {
            if (!prepActive || !selectedPieceId) return;
            moveSelected(position);
          }}
        />
        {phase === "prep" && prepActive ? <PrepGuideLayer /> : null}
        <BattleHud />
        <LeafFallLayer />
        <AssassinWarningLayer />
        <OpeningBuffLayer />
        <BattleOverlay />
        <SettlementOverlay />
        {phase === "prep" ? <StageBriefOverlay /> : null}
      </GameChrome>

      <PrepCountdown />
      <UnitInspectOverlay />
      <PieceInspectTooltip />
      <SettingsMenu />
      <ToastHost />
      <GameDialogs />
    </>
  );
}

/** 把游戏 phase 映射到 BGM 场景（docs/kepi_audio-design_v1.md §4.2）。 */
function phaseToBgmScene(phase: string): BgmSceneId {
  switch (phase) {
    case "battle":
      return "battle";
    case "campfire":
      return "campfire";
    case "pawn_shop":
      return "pawn_shop";
    case "ending":
      return "ending";
    case "settings":
      return "menu";
    default:
      // prep / opening_buff / settlement → 路线推进/备战
      return "route";
  }
}
