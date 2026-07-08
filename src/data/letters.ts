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
      return `你没能赢下所有的期冀，但你让 ${ctx.kebi} 个客家人的牵挂回了家。土楼灯火通明，水客踏上了归船。侨批于 2013 年入选《世界记忆名录》。`;
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
      kebiThreshold: 5,
      pawnedKebi: 0,
      homeRepairTier: 2,
      waterGuestSurvived: true,
      waterGuestDied: false,
    }),
  lose: (kebi: number) =>
    kebi > 0
      ? endingSubtitle("storm_rescue", {
          kebi,
          kebiThreshold: 5,
          pawnedKebi: 0,
          homeRepairTier: 0,
          waterGuestSurvived: false,
          waterGuestDied: false,
        })
      : endingSubtitle("storm_rescue", {
          kebi: 0,
          kebiThreshold: 5,
          pawnedKebi: 0,
          homeRepairTier: 0,
          waterGuestSurvived: false,
          waterGuestDied: false,
        }),
} as const;

/** Local fallback pool when AI digital-letter generation fails.
 *  Each entry is a complete narrative monologue (not a short snippet),
 *  meant to be shown as a single scrolling text in the finale. */
export const DIGITAL_LETTER_FALLBACKS: readonly DigitalLetterFallback[] = [
  {
    id: "fallback-01",
    title: "启程",
    body: `【启程】离家的那天，阿娘立在围屋门口，久久没有转身。我不敢回头看第二眼，怕一回头就走不动了。

【渡海】船离岸的时候，海风又咸又腥，像是把整片故乡吹进了骨头里。同船的人说，此番去叻埠，要三个月才到。三个月后，我该在哪里写信回家呢？

【乡忆】我在心里默念着围屋的样子——天井里的光、厅堂的香火、阿娘晾在竹竿上的衣裳。闭上眼睛还能闻到烧柴的味道。那些味道会陪我走很远很远。`,
    tags: ["early", "sangzi"],
  },
  {
    id: "fallback-02",
    title: "夜航",
    body: `【夜航】海上第十八天，我学会了一件事：想念一个人的时候，潮声会替你说话。

【望月】今晚月亮很圆，海面上铺了一层碎银。从前在家乡，这样的夜晚阿娘会在天井里摆上茶碗，阿爸卷一支烟，漫天虫鸣。如今只有风浪拍打船舷的声响。

【存粮】我把最后一块干饼掰成两半，一半放进嘴里嚼了很久，另一半收进包袱里——也不知道留着做什么，总觉得故乡的味道，丢一点就少一点了。`,
    tags: ["mid", "journey"],
  },
  {
    id: "fallback-03",
    title: "异乡",
    body: `【异乡】橡胶园的活比想象中重十倍。手掌磨出茧，破了再结，结了又破，最后变成厚厚一层，像是老天给我糊了一层能吃苦的皮。

【冬心】工头说叻埠没有冬天，可我的心一直凉凉的。夜里躺在工棚里，十几个人挤在一起，有人打鼾，有人说梦话，有人在梦里喊娘。

【枕金】我把攒下的工钱压在枕头底下——每天数一遍，数着数着，离回家的路就近了一寸。钱不多，但每文都带着体温。将来汇回家，阿娘可以买米，修一修漏雨的瓦。`,
    tags: ["struggle"],
  },
  {
    id: "fallback-04",
    title: "月信",
    body: `【家书】今天收到水客带来的信，阿娘托人写的，说围屋墙门又歪了一扇，雨水渗进西边的厢房。我捏着那页纸，指尖把字都捏糊了。

【寄梁】我寄了半年的工钱回去，刚好够请人换一根新梁。水客问我，自己不留一点？我说，人在外头，有口饭吃就够了。房子在，家就在；家在了，我回不回去都还有个念想。

【灯盏】水客走的时候，我把第二封信也塞给他——连同这个月省下的八文钱。阿娘拿到信时大概会笑吧，虽然我看不见。但我知道围屋的梁修好那天，她一定会在上面挂一盏灯。`,
    tags: ["clan", "homeRepair"],
  },
  {
    id: "fallback-05",
    title: "梦回",
    body: `【梦回】昨夜做了一个很长的梦。梦里土楼天井亮了灯，亮堂堂的，照得整座楼都暖了。我站在门槛外，脚却迈不进去。阿娘在厅里摆碗筷，阿爸在墙角修锄头，一切都和三年前走的时候一样。

【湿枕】醒来枕头是湿的。

【归灯】工友笑我，说这么大个人了还会哭。我说不是哭，是海风太潮。可我心里清楚——那是梦里的灯火烫出来的泪。等我攒够了船票钱，我一定要亲眼再看看那盏灯，坐在天井里，吃一碗阿娘煮的番薯粥。`,
    tags: ["homeRepair", "hope"],
  },
  {
    id: "fallback-06",
    title: "潮信",
    body: `【潮信】在叻埠住了两年，渐渐听懂几句番话，也学会了在水客来时把要说的话早早写好。可每次提笔，憋了几个月的话到了纸上只剩下三行：身体尚好、勿念、汇银附上。

【隐言】多余的话不敢写。怕写多了，阿娘更牵挂；怕写好的一封长信会变成一根线，把她的心扯得太紧。

【焐信】水客说，我家的回信越来越厚了。我拿着信不敢马上拆，先揣在怀里，让它在胸口焐一天。等夜里所有人都睡了，我再就着一盏油灯慢慢读。阿娘的字歪歪扭扭的，每一笔都像她在用力——用力告诉我：家里好，家里等你。`,
    tags: ["late", "ticket"],
  },
  {
    id: "fallback-07",
    title: "归计",
    body: `【归计】船票涨了又跌，跌了又涨。我把攒下的银钱数了三遍，离一张回唐的船票还差一截。

【望票】今天在水客那里碰见一个同乡，他已经买好了下个月的船票。我看着他手里的红色票纸，眼睛挪不开。他说，你也快了吧？我笑了笑，快了。

【算程】回工棚的路上，我在心里算了又算。再干四个月，应该够了。可这四个月里，阿娘会不会又病了？围屋的瓦会不会又漏了？弟弟的学费还差多少？

【方向】越想越觉得，归乡的路永远都比想象长。但好在我知道方向——朝着家的方向走，无论多慢，总有一天能走到。`,
    tags: ["sangzi", "community"],
  },
  {
    id: "fallback-08",
    title: "韩江",
    body: `【韩江】昨夜又听到了潮声。异乡的潮声和家乡的有什么不同？其实没有。都是一样的起落，一样的不知疲倦。

【听潮】只是在异乡听潮，心里总悬着一根弦——那潮声仿佛在说：该回来了，该回来了。

【三秋】我在这边三年，一共给家里寄了十二封信。每一封都写「儿在叻埠一切平安」。只有躺在铺上听着潮声的夜里，我才敢在心里说实话：儿想家了。想得厉害。

【归船】水客说再过些天有一班船回唐。我摸了摸枕头底下那包积攒的银钱——沉甸甸的，像极了阿娘做的那床厚棉被。这一次，我该踏上归船了。`,
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
