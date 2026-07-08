"use client";

import { ASSET_MANIFEST } from "@/data/assets";
import type { ArchivalLetter } from "@/data/types";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WoodButton, WoodPanel } from "@/components/game/ui";

type LetterViewerProps = {
  letter: ArchivalLetter;
  showModern?: boolean;
  className?: string;
};

export function LetterViewer({
  letter,
  showModern = true,
  className,
}: LetterViewerProps) {
  return (
    <WoodPanel
      className={cn("mx-auto w-full max-w-2xl", className)}
      letterEdge
      innerClassName="p-6"
    >
      <article
        className="rounded-md"
        style={{
          backgroundImage: `linear-gradient(rgba(255,251,235,0.9), rgba(255,251,235,0.9)), url('${ASSET_MANIFEST.ending.paperTextureSvg}'), url('${ASSET_MANIFEST.ending.realLetterBg}'), url('${ASSET_MANIFEST.ending.letterFrame}')`,
          backgroundSize: "cover, auto, cover, cover",
          backgroundPosition: "center, center, center, center",
        }}
      >
        <header className="mb-4 space-y-1 border-b border-amber-900/15 pb-3">
          <p className="text-xs tracking-widest text-amber-900/60 uppercase">
            真实馆藏侨批
          </p>
          <h2 className="font-heading text-lg font-semibold text-amber-950">
            {letter.title}
          </h2>
          <p className="text-xs text-amber-900/70">{letter.source}</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section aria-label="繁体原文">
            <h3 className="mb-2 text-sm font-medium text-amber-900">繁体录文</h3>
            <p className="whitespace-pre-wrap font-serif text-base leading-relaxed text-amber-950">
              {letter.originalText}
            </p>
          </section>

          {showModern ? (
            <section aria-label="现代释文">
              <h3 className="mb-2 text-sm font-medium text-amber-900">
                现代释文
              </h3>
              <p className="whitespace-pre-wrap text-base leading-relaxed text-amber-950/90">
                {letter.modernText}
              </p>
            </section>
          ) : null}
        </div>
      </article>
    </WoodPanel>
  );
}

type DigitalLetterCardProps = {
  title: string;
  body: string;
  source?: string;
  fromAI?: boolean;
};

export function DigitalLetterCard({
  title,
  body,
  source,
  fromAI,
}: DigitalLetterCardProps) {
  return (
    <WoodPanel innerClassName="p-4 text-left">
      <header className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-kepi-ink">{title}</h3>
        {fromAI ? (
          <span className="rounded-full bg-kepi-accent-soft px-2 py-0.5 text-[10px] tracking-wide text-kepi-accent uppercase">
            AI 数字客批
          </span>
        ) : null}
      </header>
      <p className="text-sm leading-relaxed text-kepi-ink">{body}</p>
      {fromAI && source ? (
        <p className="mt-2 text-xs text-kepi-ink-muted">{source}</p>
      ) : null}
    </WoodPanel>
  );
}

type LetterPickerProps = {
  letters: ArchivalLetter[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export function LetterPicker({
  letters,
  selectedIndex,
  onSelect,
}: LetterPickerProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {letters.map((letter, index) => (
        <WoodButton
          key={letter.id}
          variant={selectedIndex === index ? "primary" : "default"}
          className="px-3 py-1.5 text-xs"
          onClick={() => onSelect(index)}
        >
          第 {index + 1} 封 · {letter.title}
        </WoodButton>
      ))}
    </div>
  );
}

// ─── Digital Letter Carousel ──────────────────────────────────────────

const PARAGRAPH_DURATION_MS = 6000; // ms per paragraph before auto-advance
const TRANSITION_DURATION_MS = 600;
const SLIDE_HEIGHT_PX = 288; // matches container h-72

type DigitalLetterScrollProps = {
  title: string;
  narrative: string;
  className?: string;
};

export function DigitalLetterScroll({
  title,
  narrative,
  className,
}: DigitalLetterScrollProps) {
  const paragraphs = useMemo(
    () => narrative.split("\n\n").filter(Boolean),
    [narrative],
  );

  // Parse per-slide title from 【】 prefix, fall back to first meaningful chars
  const slides = useMemo(
    () =>
      paragraphs.map((para) => {
        const idx = para.indexOf("】");
        if (para.startsWith("【") && idx !== -1) {
          return {
            title: para.slice(1, idx),
            body: para.slice(idx + 1).replace(/^\n/, ""),
          };
        }
        // No 【】 prefix — use first 8 chars as default title
        const fallback = para.slice(0, 8).trim();
        return { title: fallback, body: para };
      }),
    [paragraphs],
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  // Refs kept in sync for stable interval closure
  const hoveredRef = useRef(false);
  const slidesRef = useRef(slides);

  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  // Reset on narrative change
  useEffect(() => {
    setCurrentIndex(0);
  }, [narrative]);

  // Stable interval — reads latest state via refs
  useEffect(() => {
    const id = setInterval(() => {
      if (hoveredRef.current) return;
      setCurrentIndex((prev) => {
        const s = slidesRef.current;
        if (s.length <= 1) return prev;
        return (prev + 1) % s.length; // loop forever
      });
    }, PARAGRAPH_DURATION_MS);

    return () => clearInterval(id);
  }, []);

  const jumpTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const translateY = -(currentIndex * SLIDE_HEIGHT_PX);

  return (
    <div className={cn("space-y-3", className)}>
      <h2 className="text-center text-xs font-medium tracking-[0.2em] text-amber-200/75 uppercase">
        沿途数字客批
      </h2>

      <div
        className="relative mx-auto w-full max-w-xl overflow-hidden rounded-lg border border-amber-900/20"
        style={{
          height: SLIDE_HEIGHT_PX,
          background:
            "linear-gradient(rgba(12,10,8,0.88), rgba(12,10,8,0.88)), url('/images/ending/storm-bg.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        onMouseEnter={() => {
          hoveredRef.current = true;
        }}
        onMouseLeave={() => {
          hoveredRef.current = false;
        }}
      >
        {/* Paragraphs track — slides one by one */}
        <div
          className="flex flex-col transition-transform ease-in-out"
          style={{
            transform: `translateY(${translateY}px)`,
            transitionDuration: `${TRANSITION_DURATION_MS}ms`,
          }}
        >
          {slides.map((slide, i) => (
            <div
              key={`slide-${i}`}
              className="flex flex-col items-center justify-center px-6"
              style={{ height: SLIDE_HEIGHT_PX }}
            >
              {slide.title ? (
                <h3 className="mb-3 text-sm font-semibold tracking-wider text-amber-100/95">
                  {slide.title}
                </h3>
              ) : null}
              <p className="text-sm leading-relaxed text-amber-100/80">
                {slide.body}
              </p>
            </div>
          ))}
        </div>

        {/* Fade mask — top */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-0 h-12"
          style={{
            background:
              "linear-gradient(to bottom, rgba(12,10,8,0.92), transparent)",
          }}
        />

        {/* Fade mask — bottom */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-12"
          style={{
            background:
              "linear-gradient(to top, rgba(12,10,8,0.92), transparent)",
          }}
        />

        {/* Dots indicator — clickable */}
        {slides.length > 1 ? (
          <div className="absolute bottom-3 left-0 right-0 z-10 flex items-center justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={`dot-${i}`}
                type="button"
                onClick={() => jumpTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "h-1.5 w-3 bg-amber-300/80"
                    : "h-1.5 w-1.5 bg-amber-600/40 hover:bg-amber-500/70"
                }`}
                aria-label={`第 ${i + 1} 封`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
