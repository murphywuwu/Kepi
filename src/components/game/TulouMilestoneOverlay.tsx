"use client";

import { milestoneLabel } from "@/lib/game/tulouMilestone";
import type { HomeRepairMilestone } from "@/types";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const MILESTONE_VISUAL: Record<
  HomeRepairMilestone,
  { emoji: string; className: string }
> = {
  33: { emoji: "💧", className: "kepi-tulou-milestone--well" },
  66: { emoji: "🧱", className: "kepi-tulou-milestone--wall" },
  99: { emoji: "🏮", className: "kepi-tulou-milestone--lantern" },
};

export function TulouMilestoneOverlay({
  milestone,
  onDone,
}: {
  milestone: HomeRepairMilestone;
  onDone: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const visual = MILESTONE_VISUAL[milestone];

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setVisible(false), 1800);
    const doneTimer = window.setTimeout(() => onDone(), 2400);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [milestone, onDone]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[60] flex items-center justify-center transition-opacity duration-500",
        visual.className,
        visible ? "opacity-100" : "opacity-0",
      )}
      role="status"
      aria-live="polite"
      aria-label={`土楼里程碑：${milestoneLabel(milestone)}`}
    >
      <div className="kepi-tulou-milestone-card text-center">
        <p className="text-4xl" aria-hidden>
          {visual.emoji}
        </p>
        <p className="mt-3 text-lg font-bold tracking-wide text-amber-50">
          土楼庇护解锁
        </p>
        <p className="mt-1 text-sm text-amber-100/85">{milestoneLabel(milestone)}</p>
      </div>
    </div>
  );
}
