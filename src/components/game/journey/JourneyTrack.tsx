"use client";

import Image from "next/image";
import { ASSET_MANIFEST } from "@/data/assets";
import { JOURNEY } from "@/data/journey";
import { journeyNodeIcon, tulouExteriorForRepair } from "@/lib/game/journeyUi";
import { cn } from "@/lib/utils";
import { GameIcon } from "@/components/game/ui";

const UI = ASSET_MANIFEST.ui;

export function JourneyNodeTrack({
  journeyIndex,
  compact = false,
}: {
  journeyIndex: number;
  compact?: boolean;
}) {
  if (compact) return null;

  return (
    <div
      className="kepi-journey-track flex items-center justify-between gap-0.5 overflow-x-auto px-0.5"
      role="list"
      aria-label="归乡路线"
    >
      {JOURNEY.nodes.map((node, index) => (
        <JourneyNodeMarker
          key={node.id}
          type={node.type}
          done={index < journeyIndex}
          current={index === journeyIndex}
          label={node.label}
        />
      ))}
    </div>
  );
}

function JourneyNodeMarker({
  type,
  done,
  current,
  label,
}: {
  type: Parameters<typeof journeyNodeIcon>[0];
  done: boolean;
  current: boolean;
  label: string;
}) {
  const icon = journeyNodeIcon(type);

  return (
    <div
      role="listitem"
      className={cn(
        "kepi-journey-node relative flex min-w-[2rem] flex-1 flex-col items-center gap-0.5",
        done && "kepi-journey-node--done",
        current && "kepi-journey-node--current",
      )}
      aria-current={current ? "step" : undefined}
      aria-label={label}
      title={label}
    >
      <div className="relative flex h-7 w-7 items-center justify-center sm:h-8 sm:w-8">
        <GameIcon
          src={icon}
          size={28}
          className={cn(
            "relative z-[1] transition-opacity",
            !done && !current && "opacity-45 grayscale-[0.35]",
          )}
        />
        {current ? (
          <Image
            src={UI.journeyNodeCurrent}
            alt=""
            width={36}
            height={36}
            className="kepi-journey-node-ring pointer-events-none absolute inset-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 object-contain"
            aria-hidden
          />
        ) : null}
        {done ? (
          <Image
            src={UI.journeyNodeDone}
            alt=""
            width={14}
            height={14}
            className="pointer-events-none absolute -right-0.5 -top-0.5 z-[2] object-contain"
            aria-hidden
          />
        ) : null}
      </div>
      {current ? (
        <span className="kepi-journey-node-label hidden max-w-[3.25rem] truncate text-center text-[0.5rem] leading-tight text-kepi-ink sm:block">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function JourneyRepairBar({ homeRepair }: { homeRepair: number }) {
  const exterior = tulouExteriorForRepair(homeRepair);
  const width = Math.min(100, Math.max(0, homeRepair));

  return (
    <div className="relative h-4 overflow-hidden rounded-md sm:h-5">
      <Image
        src={UI.journeyHomeRepairBar}
        alt=""
        fill
        className="object-cover opacity-90"
        sizes="320px"
      />
      <Image
        src={exterior}
        alt=""
        width={72}
        height={24}
        className="pointer-events-none absolute bottom-0 left-1 z-[1] h-full w-auto object-contain object-left opacity-35"
        aria-hidden
      />
      <div
        className="kepi-journey-repair-fill absolute inset-y-0 left-0 z-[2] rounded-sm bg-kepi-accent/75 transition-[width] duration-500 ease-out"
        style={{ width: `${width}%` }}
        role="progressbar"
        aria-valuenow={width}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="家园修复"
      />
    </div>
  );
}
