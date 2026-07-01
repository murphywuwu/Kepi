"use client";

import { useUIStore } from "@/store/uiStore";
import { WoodButton } from "@/components/game/ui";

export function HudBar() {
  const setSettingsOpen = useUIStore((state) => state.setSettingsOpen);

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-end px-[5%] pt-[max(0.75rem,env(safe-area-inset-top))]">
      <WoodButton
        className="pointer-events-auto px-2.5 py-2 text-sm leading-none"
        onClick={() => setSettingsOpen(true)}
        aria-label="设置"
      >
        ⚙
      </WoodButton>
    </header>
  );
}
