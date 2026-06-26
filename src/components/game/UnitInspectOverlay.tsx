"use client";

import { spawnEnemiesForStage } from "@/engine/battle";
import { inspectAlly, inspectEnemy, type UnitInspectInfo } from "@/lib/game/unitInspect";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { WoodPanel } from "@/components/game/ui";

function clampAnchor(
  anchorX: number,
  anchorY: number,
  panelWidth: number,
  panelHeight: number,
): { x: number; y: number } {
  const margin = 12;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 720;

  let x = anchorX;
  let y = anchorY - panelHeight - margin;

  x = Math.max(margin + panelWidth / 2, Math.min(vw - margin - panelWidth / 2, x));
  if (y < margin) {
    y = anchorY + margin;
  }
  if (y + panelHeight > vh - margin) {
    y = vh - margin - panelHeight;
  }

  return { x, y };
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <dt className="text-kepi-ink-muted">{label}</dt>
      <dd className="font-medium tabular-nums text-kepi-ink">{value}</dd>
    </div>
  );
}

function InspectCard({ info }: { info: UnitInspectInfo }) {
  const isEnemy = info.side === "enemy";
  const hpText =
    info.hp < info.maxHp ? `${info.hp} / ${info.maxHp}` : String(info.maxHp);

  return (
    <WoodPanel
      className="w-[min(17rem,calc(100vw-1.5rem))] shadow-lg"
      innerClassName="px-3 py-2.5"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3
            className={`text-sm font-bold ${isEnemy ? "text-kepi-enemy" : "text-kepi-accent"}`}
          >
            {info.name}
          </h3>
          {info.star ? (
            <p className="text-[0.65rem] text-kepi-gold">★{info.star}</p>
          ) : null}
        </div>
        {info.badge ? (
          <span className="shrink-0 rounded-sm bg-kepi-panel px-1.5 py-0.5 text-[0.6rem] text-kepi-ink-muted ring-1 ring-kepi-panel-border/40">
            {info.badge}
          </span>
        ) : null}
      </div>

      <dl className="space-y-1">
        <StatRow label="生命" value={hpText} />
        <StatRow label="攻击" value={String(info.atk)} />
        <StatRow label="护甲" value={String(info.armor)} />
        <StatRow label="攻速" value={info.atkSpeed.toFixed(2)} />
        <StatRow label="射程" value={info.rangeLabel} />
      </dl>

      <p className="mt-2 border-t border-kepi-panel-border/25 pt-2 text-[0.6875rem] leading-relaxed text-kepi-ink-muted">
        {info.description}
      </p>
    </WoodPanel>
  );
}

export function UnitInspectOverlay() {
  const hoveredUnit = useUIStore((state) => state.hoveredUnit);
  const snapshot = useGameStore((state) => state.snapshot);
  const selectedPieceId = useGameStore((state) => state.selectedPieceId);

  if (!hoveredUnit) return null;

  const { phase, board, state } = snapshot;

  if (phase === "prep" && selectedPieceId && hoveredUnit.side === "ally") {
    return null;
  }
  let info: UnitInspectInfo | null = null;

  if (hoveredUnit.side === "ally") {
    const piece = board.find((entry) => entry.id === hoveredUnit.unitId);
    if (piece) info = inspectAlly(piece, phase);
  } else {
    const enemies =
      phase === "prep" || phase === "battle" || phase === "settlement"
        ? spawnEnemiesForStage(state.stage)
        : [];
    const enemy = enemies.find((entry) => entry.id === hoveredUnit.unitId);
    if (enemy) info = inspectEnemy(enemy, phase);
  }

  if (!info) return null;

  const panelW = 272;
  const panelH = 168;
  const { x, y } = clampAnchor(
    hoveredUnit.anchorX,
    hoveredUnit.anchorY,
    panelW,
    panelH,
  );

  return (
    <div
      className="pointer-events-none fixed z-40"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, 0)",
      }}
      role="tooltip"
      aria-live="polite"
    >
      <InspectCard info={info} />
    </div>
  );
}
