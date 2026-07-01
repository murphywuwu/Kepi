import type { ArchivalLetter, DigitalLetterFallback } from "./types";
import type { EndingType, HomeRepairTier } from "@/types";

/** Museum letter shape used by ending UI and AI prompt tone samples. */
export type MuseumLetter = {
  id: string;
  author: string;
  recipient: string;
  traditional: string;
  modern: string;
  source: string;
  voiceAudio: string | null;
};

/** Real archival letters for ending narration — PRD §11.4. */
export const ARCHIVAL_LETTERS: readonly ArchivalLetter[] = [
  {
    id: "ye-heren-1887",
    title: "叶和仁寄母",
    originalText: `母親大人膝下福安：
　兒在叻身體安穩，無病無痛，萬勿掛念。今付洋銀弍元，家中吃用切莫吝嗇。
　兒日夜思唐，待積少許銀兩，便歸侍奉高堂。
　男 和仁 叩上`,
    modernText: `母亲大人安好：
　我在新加坡身体平安，没有病痛，千万不要挂念。这次捎回两块银元，家里日常开销别舍不得花钱。
　我日日思念家乡，等攒下一点积蓄，就回乡陪您尽孝。
　儿子 和仁 敬上`,
    source: "梅州/汕头档案馆公开馆藏 · 清光绪年间马来亚（叻）叶和仁寄母亲家书",
    voiceAudio: "/audio/voice/kepi_letter-ye-heren.mp3",
  },
  {
    id: "lin-ahfa-1910",
    title: "林阿发寄妻",
    originalText: `贤妻如面：
　兒今在暹羅做工，身體尚好。此付洋銀壹元，可買米度日。
　聞鄉中旱情，望保重。兒在外省食儉用，只盼來年能歸。
　夫 阿發 上`,
    modernText: `妻子亲启：
　我在泰国做工，身体还好。这次寄回一块银元，可以买米度日。
　听说乡里旱情，望多保重。我在外省吃俭用，只盼来年能回家。
　丈夫 阿发 上`,
    source: "汕头侨批馆公开馆藏 · 民国初年暹罗寄批",
    voiceAudio: null,
  },
  {
    id: "zhang-mingde-1920",
    title: "张明德寄叔父",
    originalText: `叔父大人钧鉴：
　侄在槟榔屿貿易，尚能糊口。今汇批银叁元，请为祖母买药。
　围屋墙门破损，请用此钱修补。侄每夜梦归松口，不敢忘本。
　侄 明德 顿首`,
    modernText: `叔父台鉴：
　侄子在槟城做生意，尚能糊口。今汇批银三元，请为祖母买药。
　围屋墙门破损，请用此钱修补。侄每晚梦见回到松口，不敢忘本。
　侄子 明德 顿首`,
    source: "梅州侨批文化研究中心公开文献",
    voiceAudio: null,
  },
] as const;

export const MUSEUM_LETTERS: readonly MuseumLetter[] = [
  {
    id: "ye-heren",
    author: "叶和仁",
    recipient: "母亲",
    traditional: ARCHIVAL_LETTERS[0]!.originalText,
    modern: ARCHIVAL_LETTERS[0]!.modernText,
    source: ARCHIVAL_LETTERS[0]!.source,
    voiceAudio: ARCHIVAL_LETTERS[0]!.voiceAudio,
  },
  {
    id: "lin-ahfa",
    author: "林阿发",
    recipient: "妻子",
    traditional: ARCHIVAL_LETTERS[1]!.originalText,
    modern: ARCHIVAL_LETTERS[1]!.modernText,
    source: ARCHIVAL_LETTERS[1]!.source,
    voiceAudio: ARCHIVAL_LETTERS[1]!.voiceAudio,
  },
  {
    id: "zhang-mingde",
    author: "张明德",
    recipient: "叔父",
    traditional: ARCHIVAL_LETTERS[2]!.originalText,
    modern: ARCHIVAL_LETTERS[2]!.modernText,
    source: ARCHIVAL_LETTERS[2]!.source,
    voiceAudio: ARCHIVAL_LETTERS[2]!.voiceAudio,
  },
] as const;

export const ENDING_ASSETS = {
  background: "/images/ending/storm-bg.svg",
  paperTexture: "/images/ending/paper-texture.svg",
  waveSfx: "/audio/sfx/ending-wave.mp3",
  openSfx: "/audio/sfx/letter-open.mp3",
  perfectBg: "/images/board/kepi_tulou-stage5-lanterns.png",
  regretBg: "/images/board/kepi_tulou-stage3-gate.png",
  stormBg: "/images/ending/kepi_wind-wave-background.png",
  seaPassage: "/images/ending/kepi_wind-wave-background.png",
} as const;

export type EndingNarrativeContext = {
  kebi: number;
  kebiThreshold: number;
  pawnedKebi: number;
  homeRepairTier: HomeRepairTier;
  waterGuestSurvived: boolean;
  waterGuestDied: boolean;
};

export const ENDING_SCENE_COPY: Record<
  EndingType,
  {
    badge: string;
    title: string;
    intro: string;
    sceneClass: string;
  }
> = {
  perfect_homecoming: {
    badge: "完美归乡",
    title: "归乡 · 风浪中的客批",
    intro:
      "水客凭归乡票装船启航。风浪掀起，客批散落空中——伸手护住这些牵挂，土楼灯火已在彼岸等候。",
    sceneClass: "kepi-ending-scene--perfect",
  },
  regretful_stay: {
    badge: "遗憾留守",
    title: "留守 · 寨子里的客批",
    intro:
      "寨子守住了，土楼也亮了灯，但归乡的票还差几封客批。风里仍有信飘来——护住它们，便是护住未竟的乡愁。",
    sceneClass: "kepi-ending-scene--regret",
  },
  storm_rescue: {
    badge: "风浪抢救",
    title: "抢救 · 风浪中的侨批碎片",
    intro:
      "风浪卷走了归途，寨子没能撑到最后。但散落的侨批碎片仍在浪里——伸手，从风浪中一封封救起它们。",
    sceneClass: "kepi-ending-scene--storm",
  },
};

/** Envelope count for the shared gesture catch phase. */
export function endingLetterCount(
  endingType: EndingType,
  ctx: EndingNarrativeContext,
): number {
  const cap = ARCHIVAL_LETTERS.length;
  switch (endingType) {
    case "perfect_homecoming":
      return Math.max(1, Math.min(ctx.kebi, cap));
    case "regretful_stay":
      return Math.max(1, Math.min(ctx.kebi, cap));
    case "storm_rescue":
      return Math.max(1, Math.min(Math.max(ctx.kebi, ctx.pawnedKebi), cap));
  }
}

export function endingSubtitle(
  endingType: EndingType,
  ctx: EndingNarrativeContext,
): string {
  switch (endingType) {
    case "perfect_homecoming":
      return `你让 ${ctx.kebi} 个客家人的牵挂回了家。土楼灯火通明，水客踏上了归船。侨批于 2013 年入选《世界记忆名录》。`;
    case "regretful_stay": {
      const tulouNote =
        ctx.homeRepairTier >= 2
          ? "土楼已修缮一新，"
          : ctx.homeRepairTier >= 1
            ? "土楼渐有生气，"
            : "";
      const pawnNote =
        ctx.pawnedKebi > 0
          ? `其中 ${ctx.pawnedKebi} 封曾典当救急，`
          : "";
      return `${tulouNote}人活着，寨子保住了，但只攒下 ${ctx.kebi}/${ctx.kebiThreshold} 封客批${pawnNote}归乡的票还差一程。侨批于 2013 年入选《世界记忆名录》。`;
    }
    case "storm_rescue":
      if (ctx.kebi > 0) {
        return `风浪卷走了归途，但 ${ctx.kebi} 封客批已被护在怀中。${ctx.waterGuestDied ? "水客没能走完最后一程，" : ""}你至少护住了一份牵挂。侨批于 2013 年入选《世界记忆名录》。`;
      }
      return "风浪卷走了归途，但寨子的牵挂仍在。你从浪里救起侨批碎片，便是护住客家人的乡愁。侨批于 2013 年入选《世界记忆名录》。";
  }
}

export function buildEndingBattleSummary(
  endingType: EndingType,
  ctx: EndingNarrativeContext,
  stage: number,
): string {
  const base = `第 ${stage} 关收束 · 客批 ${ctx.kebi}/${ctx.kebiThreshold}`;
  switch (endingType) {
    case "perfect_homecoming":
      return `${base} · 归乡票已成，水客${ctx.waterGuestSurvived ? "平安" : ""}收齐客批。`;
    case "regretful_stay":
      return `${base} · 寨子守住，${ctx.pawnedKebi > 0 ? `曾典当 ${ctx.pawnedKebi} 封，` : ""}归乡不足。`;
    case "storm_rescue":
      return `${base} · 存续度归零，${ctx.waterGuestDied ? "水客战死，" : ""}风浪中抢救侨批。`;
  }
}

/** @deprecated Use endingSubtitle(endingType, ctx) — kept for preview page compat. */
export const ENDING_SUBTITLES = {
  win: (kebi: number) =>
    endingSubtitle("perfect_homecoming", {
      kebi,
      kebiThreshold: 4,
      pawnedKebi: 0,
      homeRepairTier: 2,
      waterGuestSurvived: true,
      waterGuestDied: false,
    }),
  lose: (kebi: number) =>
    kebi > 0
      ? endingSubtitle("storm_rescue", {
          kebi,
          kebiThreshold: 4,
          pawnedKebi: 0,
          homeRepairTier: 0,
          waterGuestSurvived: false,
          waterGuestDied: false,
        })
      : endingSubtitle("storm_rescue", {
          kebi: 0,
          kebiThreshold: 4,
          pawnedKebi: 0,
          homeRepairTier: 0,
          waterGuestSurvived: false,
          waterGuestDied: false,
        }),
} as const;

/** Local fallback pool when AI digital-letter generation fails — PRD §6.13. */
export const DIGITAL_LETTER_FALLBACKS: readonly DigitalLetterFallback[] = [
  {
    id: "fallback-01",
    title: "番客家书",
    body: "阿娘，儿在叻埠做工安稳，勿念。今寄银贰元，家中吃穿莫省。儿夜夜梦回乡井，待银两稍积，便买船票归唐侍奉。",
    tags: ["early", "sangzi"],
  },
  {
    id: "fallback-02",
    title: "番客家书",
    body: "贤妻安好。此番风浪大，信迟几日，万勿挂心。儿省下一口粮，多寄几文钱修井砌墙，望族中老少平安。",
    tags: ["mid", "homeRepair"],
  },
  {
    id: "fallback-03",
    title: "番客家书",
    body: "胞弟收阅。寨中可还安稳？儿这边橡胶园苦役，手磨出茧，心却念着祖屋炊烟。待得放工，再汇银信。",
    tags: ["struggle"],
  },
  {
    id: "fallback-04",
    title: "番客家书",
    body: "族长尊前：儿在外谨守本分，每得闲便念宗族教诲。今略汇薄银，烦请乡贤修缮祠堂门楣，不敢忘根本。",
    tags: ["clan", "homeRepair"],
  },
  {
    id: "fallback-05",
    title: "番客家书",
    body: "阿爸，儿梦见土楼天井又亮了灯。此信附银不多，先修歪了的门扇。儿还在攒，总有一天要踏回门槛。",
    tags: ["homeRepair", "hope"],
  },
  {
    id: "fallback-06",
    title: "番客家书",
    body: "吾妻，儿名已在船票上写下又划去三回。路费还差一截，且把信先寄回。你在乡中保重，莫让等候空了心肠。",
    tags: ["late", "ticket"],
  },
  {
    id: "fallback-07",
    title: "番客家书",
    body: "乡里诸亲：儿在海外得同乡照应，尚能温饱。所寄之银，一半奉母，一半请贤达修桥补路，略尽绵薄。",
    tags: ["sangzi", "community"],
  },
  {
    id: "fallback-08",
    title: "番客家书",
    body: "母亲，儿昨夜听潮声，像极韩江。此身虽远，心系桑梓。信到之日，便请水客代儿叩首。",
    tags: ["emotional"],
  },
] as const;

export const LETTERS = {
  archival: ARCHIVAL_LETTERS,
  museum: MUSEUM_LETTERS,
  fallbacks: DIGITAL_LETTER_FALLBACKS,
} as const;

export function pickDigitalLetterFallback(seed = Date.now()): DigitalLetterFallback {
  const index = Math.abs(seed) % DIGITAL_LETTER_FALLBACKS.length;
  return DIGITAL_LETTER_FALLBACKS[index]!;
}

export function archivalLetterById(id: string): ArchivalLetter | undefined {
  return ARCHIVAL_LETTERS.find((letter) => letter.id === id);
}

export function toAILetterResponse(fallback: DigitalLetterFallback) {
  return {
    title: fallback.title,
    body: fallback.body,
    source: "local-fallback",
  };
}
