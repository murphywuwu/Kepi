import { describe, expect, it, beforeEach, vi } from "vitest";
import { createInitialSnapshot } from "@/engine";
import { buildAIPromptFromSnapshot } from "@/lib/ai/buildInput";
import { buildTurnNarrativeInput } from "@/lib/ai/buildTurnNarrativeInput";
import { pickFallbackLetter, pickFallbackLetters } from "@/lib/ai/fallback";
import {
  narrativeCacheKey,
  pickFallbackNarrative,
} from "@/lib/ai/narrativeFallback";
import {
  clearNarrativeCache,
  getCachedNarrative,
  resolveNarrativeWithCache,
  setCachedNarrative,
} from "@/lib/ai/narrativeCache";
import { buildTurnNarrativeUserPrompt } from "@/lib/ai/narrativePrompt";
import type { AIPromptInput, TurnNarrativeInput } from "@/lib/ai/types";
import { buildDigitalLetterUserPrompt } from "@/lib/ai/prompt";
import {
  aiLetterResponseSchema,
  aiRequestSchema,
  turnNarrativeSchema,
} from "@/lib/schemas/ai";

const sampleInput: AIPromptInput = {
  stage: 3,
  kebi: 2,
  homeRepair: 48,
  survival: 2,
  battleSummary: "第三关小胜，土楼进入修缮态。",
  result: "win",
};

const sampleNarrativeInput: TurnNarrativeInput = {
  turn: 2,
  events: {
    didPawn: true,
    pawnCount: 1,
    waterGuestDied: false,
    waterGuestSurvived: true,
    won: true,
    homeRepairMilestone: 33,
  },
  currentKebi: 2,
  currentHomeRepair: 33,
  survival: 2,
};

describe("buildAIPromptFromSnapshot", () => {
  it("maps snapshot state into AI prompt input", () => {
    const snapshot = createInitialSnapshot();
    const input = buildAIPromptFromSnapshot(snapshot);
    expect(input.stage).toBe(1);
    expect(input.kebi).toBe(0);
    expect(input.battleSummary).toContain("第 1 关");
  });
});

describe("buildTurnNarrativeInput", () => {
  it("returns null without settlement", () => {
    expect(buildTurnNarrativeInput(createInitialSnapshot())).toBeNull();
  });

  it("maps settlement events including pawn and clutch unit", () => {
    const snapshot = {
      ...createInitialSnapshot(),
      state: {
        ...createInitialSnapshot().state,
        kebi: 1,
        roundPawnCount: 1,
      },
      phase: "settlement",
      lastBattleResult: {
        won: true,
        tick: 10,
        elapsedMs: 800,
        events: [],
        alliesRemaining: 1,
        enemiesRemaining: 0,
        allyHpPercent: 0.2,
        enemyHpPercent: 0,
        waterGuest: {
          pieceId: "shuike-1",
          deployed: true,
          survived: true,
          died: false,
        },
      },
      battle: {
        tick: 10,
        elapsedMs: 800,
        allies: [
          {
            id: "farmer-1",
            type: "farmer",
            cost: 1,
            star: 1,
            hp: 40,
            maxHp: 450,
            atk: 35,
            atkSpeed: 0.6,
            armor: 5,
            range: "melee",
            clan: "hakka",
            position: { x: 2, y: 1 },
          },
        ],
        enemies: [],
        events: [],
        waterGuest: {
          pieceId: "shuike-1",
          deployed: true,
          survived: true,
          died: false,
        },
      },
      settlement: {
        won: true,
        kebiGained: 1,
        sangziGained: 1,
        sangziConsumed: 1,
        homeRepairBefore: 20,
        homeRepairGained: 20,
        homeRepairAfter: 40,
        survivalLost: 0,
        waterGuestDeployed: true,
        waterGuestSurvived: true,
        waterGuestDied: false,
        xiangxianBonusApplied: false,
      },
    };

    const input = buildTurnNarrativeInput(snapshot);
    expect(input?.events.didPawn).toBe(true);
    expect(input?.events.pawnCount).toBe(1);
    expect(input?.events.clutchUnit).toBe("农夫");
    expect(input?.events.homeRepairMilestone).toBe(33);
  });
});

describe("pickFallbackLetter", () => {
  it("returns stable local fallback for same input", () => {
    const a = pickFallbackLetter(sampleInput);
    const b = pickFallbackLetter(sampleInput);
    expect(a.title).toBe(b.title);
    expect(a.body).toBe(b.body);
    expect(a.source).toBe("本地降级文案池");
  });

  it("returns multiple fallbacks for batch requests", () => {
    const letters = pickFallbackLetters(sampleInput, 3);
    expect(letters).toHaveLength(3);
    expect(new Set(letters.map((l) => l.body)).size).toBeGreaterThan(1);
  });
});

describe("pickFallbackNarrative", () => {
  it("prioritizes milestone over generic win", () => {
    const narrative = pickFallbackNarrative(sampleNarrativeInput);
    expect(narrative.text).toMatch(/井|水气/);
    expect(narrative.author).toMatch(/叩上|敬上/);
  });

  it("returns stable narrative for same event key", () => {
    const a = pickFallbackNarrative(sampleNarrativeInput);
    const b = pickFallbackNarrative(sampleNarrativeInput);
    expect(a).toEqual(b);
  });

  it("uses lose pool when battle lost", () => {
    const narrative = pickFallbackNarrative({
      ...sampleNarrativeInput,
      events: {
        ...sampleNarrativeInput.events,
        won: false,
        homeRepairMilestone: undefined,
        didPawn: false,
        pawnCount: 0,
      },
    });
    expect(narrative.text).toMatch(/输|愧|迟/);
  });
});

describe("narrative cache", () => {
  beforeEach(() => {
    clearNarrativeCache();
  });

  it("reuses cached narrative for same event combination", () => {
    const key = narrativeCacheKey(sampleNarrativeInput);
    setCachedNarrative(key, { text: "缓存旁白一句。", author: "阿发 叩上" });
    expect(getCachedNarrative(key)?.text).toBe("缓存旁白一句。");
    expect(resolveNarrativeWithCache(sampleNarrativeInput).text).toBe("缓存旁白一句。");
  });
});

describe("buildDigitalLetterUserPrompt", () => {
  it("includes battle summary and run stats", () => {
    const prompt = buildDigitalLetterUserPrompt(sampleInput);
    expect(prompt).toContain("第三关小胜");
    expect(prompt).toContain("已攒客批：2 封");
    expect(prompt).toContain("本局归乡成功");
  });
});

describe("buildTurnNarrativeUserPrompt", () => {
  it("includes pawn and milestone context", () => {
    const prompt = buildTurnNarrativeUserPrompt(sampleNarrativeInput);
    expect(prompt).toContain("典当了 1 封");
    expect(prompt).toContain("水客在战斗中活下来了");
    expect(prompt).toContain("井里好像又冒水了");
  });
});

describe("ai schemas", () => {
  it("validates digital-letter request", () => {
    const parsed = aiRequestSchema.safeParse({
      kind: "digital-letter",
      input: sampleInput,
    });
    expect(parsed.success).toBe(true);
  });

  it("validates turn-narrative request", () => {
    const parsed = aiRequestSchema.safeParse({
      kind: "turn-narrative",
      input: sampleNarrativeInput,
    });
    expect(parsed.success).toBe(true);
  });

  it("validates letter response shape", () => {
    const parsed = aiLetterResponseSchema.safeParse({
      title: "番客家书",
      body: "阿爸阿妈，儿一切安好。",
    });
    expect(parsed.success).toBe(true);
  });

  it("validates turn narrative response shape", () => {
    const parsed = turnNarrativeSchema.safeParse({
      text: "井里又冒水了，心里也踏实些。",
      author: "阿发 叩上",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects overly long narrative text", () => {
    const parsed = turnNarrativeSchema.safeParse({
      text: "过".repeat(90),
      author: "阿发 叩上",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("POST /api/ai turn-narrative", () => {
  beforeEach(() => {
    clearNarrativeCache();
    vi.resetModules();
  });

  it("returns fallback narrative when AI is unavailable", async () => {
    vi.doMock("@/lib/ai/narrativeServer", () => ({
      generateTurnNarrative: vi.fn(async () => {
        throw new Error("offline");
      }),
      generateTurnNarrativeFallback: vi.fn((input: TurnNarrativeInput) =>
        pickFallbackNarrative(input),
      ),
    }));

    const { POST } = await import("@/app/api/ai/route");
    const response = await POST(
      new Request("http://localhost/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "turn-narrative",
          input: sampleNarrativeInput,
        }),
      }),
    );

    const body = (await response.json()) as {
      ok: boolean;
      fallback?: { text: string; author: string };
    };
    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.fallback?.text.length).toBeGreaterThan(4);
    expect(body.fallback?.author).toMatch(/叩上|敬上/);
  });
});
