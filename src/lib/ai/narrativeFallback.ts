import type { HomeRepairMilestone } from "@/types";
import type { TurnNarrative, TurnNarrativeInput } from "./types";

type FallbackEntry = TurnNarrative & {
  id: string;
};

const PAWN_FALLBACKS: FallbackEntry[] = [
  {
    id: "pawn-1",
    text: "阿嬷，为了保住大门，我把信当了换盘缠，我对不住寄信的人……",
    author: "阿发 叩上",
  },
  {
    id: "pawn-2",
    text: "信可以当，门不能破。等仗打完了，我再赎回来。",
    author: "德顺 敬上",
  },
];

const BLOOD_DEBT_FALLBACKS: FallbackEntry[] = [
  {
    id: "debt-1",
    text: "眼下的仗要打赢，未来的路更长更险——我认了。",
    author: "春生 敬上",
  },
  {
    id: "debt-2",
    text: "透支了归乡的期冀，只求这一程别倒在路上。",
    author: "阿发 叩上",
  },
];

const WATER_GUEST_DIED_WIN: FallbackEntry[] = [
  {
    id: "wgd-1",
    text: "寨子守住了，可信丢了。阿发那封信，怕是要沉在海底了。",
    author: "阿发 叩上",
  },
];

const CRUSHING_WIN: FallbackEntry[] = [
  {
    id: "crush-1",
    text: "这一仗赢得干脆，像潮头一下把关隘推开。",
    author: "德顺 敬上",
  },
];

const CLUTCH_WIN: FallbackEntry[] = [
  {
    id: "clutch-1",
    text: "就剩一个人，拄着家伙也把仗打赢了。祖先保佑。",
    author: "阿发 叩上",
  },
];

const NARROW_WIN: FallbackEntry[] = [
  {
    id: "narrow-1",
    text: "险险守住，像风浪里抓住最后一根缆绳。",
    author: "春生 敬上",
  },
];

const MILESTONE_FALLBACKS: Record<HomeRepairMilestone, FallbackEntry[]> = {
  33: [
    {
      id: "m33-1",
      text: "井里又冒水了。阿妈，是不是你在老家也在打水？",
      author: "阿发 叩上",
    },
  ],
  66: [
    {
      id: "m66-1",
      text: "墙门补好了，风进不来那么急了。",
      author: "德顺 敬上",
    },
  ],
  99: [
    {
      id: "m99-1",
      text: "祠堂的灯亮了。我好像听见你在叫我回家。",
      author: "阿发 叩上",
    },
  ],
};

const LOSE_FALLBACKS: FallbackEntry[] = [
  {
    id: "lose-1",
    text: "这一仗输了，信也迟了。莫急，我再攒力气。",
    author: "阿发 叩上",
  },
];

function hashSeed(input: TurnNarrativeInput): number {
  const { events } = input;
  const raw = [
    input.turn,
    events.didPawn ? events.pawnCount : 0,
    events.didBloodDebt ? 1 : 0,
    events.waterGuestDied ? 1 : 0,
    events.waterGuestSurvived ? 1 : 0,
    events.won ? 1 : 0,
    events.outcomeTone ?? "",
    events.clutchUnit ?? "",
    events.homeRepairMilestone ?? "",
    input.currentKebi,
    input.deathCount,
  ].join(":");
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickFromPool(pool: FallbackEntry[], seed: number): TurnNarrative {
  const entry = pool[seed % pool.length]!;
  return { text: entry.text, author: entry.author };
}

export function narrativeCacheKey(input: TurnNarrativeInput): string {
  const { events } = input;
  return [
    input.turn,
    events.didPawn ? `pawn:${events.pawnCount}` : "pawn:0",
    events.didBloodDebt ? "debt" : "nodebt",
    events.waterGuestDied ? "wgd" : events.waterGuestSurvived ? "wgs" : "wgx",
    events.won ? "win" : "lose",
    events.outcomeTone ?? "-",
    events.clutchUnit ?? "-",
    events.homeRepairMilestone ?? "-",
  ].join("|");
}

export function pickFallbackNarrative(input: TurnNarrativeInput): TurnNarrative {
  const { events } = input;
  const seed = hashSeed(input);

  if (events.homeRepairMilestone) {
    return pickFromPool(MILESTONE_FALLBACKS[events.homeRepairMilestone], seed);
  }

  if (events.didBloodDebt) {
    return pickFromPool(BLOOD_DEBT_FALLBACKS, seed);
  }

  if (events.didPawn) {
    return pickFromPool(PAWN_FALLBACKS, seed);
  }

  if (events.won && events.waterGuestDied) {
    return pickFromPool(WATER_GUEST_DIED_WIN, seed);
  }

  if (events.won) {
    if (events.outcomeTone === "crushing") {
      return pickFromPool(CRUSHING_WIN, seed);
    }
    if (events.outcomeTone === "clutch" || events.clutchUnit) {
      const entry = pickFromPool(CLUTCH_WIN, seed);
      return events.clutchUnit
        ? { text: entry.text.replace("一个人", events.clutchUnit), author: entry.author }
        : entry;
    }
    if (events.outcomeTone === "narrow") {
      return pickFromPool(NARROW_WIN, seed);
    }
    return pickFromPool(NARROW_WIN, seed);
  }

  return pickFromPool(LOSE_FALLBACKS, seed);
}
