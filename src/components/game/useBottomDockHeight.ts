"use client";

import { useLayoutEffect, useRef } from "react";
import { useUIStore } from "@/store/uiStore";

export function useBottomDockHeight() {
  const ref = useRef<HTMLDivElement>(null);
  const setBottomDockHeightPx = useUIStore((state) => state.setBottomDockHeightPx);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      setBottomDockHeightPx(0);
      return;
    }

    const report = () => {
      setBottomDockHeightPx(el.getBoundingClientRect().height);
    };

    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    window.addEventListener("resize", report);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", report);
      setBottomDockHeightPx(0);
    };
  }, [setBottomDockHeightPx]);

  return ref;
}
