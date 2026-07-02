import type { EnemyType } from "@/types";

export type LevelTone =
  | "warm"
  | "edict"
  | "checkpoint"
  | "contract"
  | "mountain"
  | "harbor"
  | "fire";

export type StageBriefSupportCard = {
  title: string;
  hint: string;
  primaryNote: string;
  secondaryNote: string;
};

export type StageBriefSupportFocus = {
  dismissCta: string;
  footnote: string;
  enemyLine: string;
  shuike: StageBriefSupportCard;
  xiangyin: StageBriefSupportCard;
};

export type LevelInteractionDefinition = {
  nodeId: string;
  level: number;
  title: string;
  shortTitle: string;
  tone: LevelTone;
  tagline: string;
  /** Dual-card player brief for early tutorial battles. */
  stageBrief?: StageBriefSupportFocus;
  historicalFocus: string;
  featuredEnemy: EnemyType;
  enemyComposition: readonly EnemyType[];
  difficultyLabel: "教学" | "普通" | "困难" | "险峻" | "极难";
  opening: {
    actName: string;
    body: string;
    cta: string;
  };
  prep: {
    actName: string;
    body: string;
    objective: string;
    cta: string;
  };
  mechanic: {
    id:
      | "protect_shuike"
      | "inspection"
      | "chain_bind"
      | "mountain_pounce"
      | "fare_pressure"
      | "lock_letter";
    label: string;
    description: string;
    battleHint: string;
    warning?: string;
  };
  xiangyinBuff: {
    label: string;
    description: string;
  };
  settlement: {
    actName: string;
    cta: string;
    win: string;
    winNoLetter: string;
    loss: string;
    nextHook: string;
  };
  acceptance: string;
};

export const LEVEL_INTERACTIONS: Record<string, LevelInteractionDefinition> = {
  "battle-1": {
    nodeId: "battle-1",
    level: 1,
    title: "南洋余波",
    shortTitle: "南洋",
    tone: "warm",
    tagline: "南洋同乡把信交到你手里——归乡路从这里开始。",
    stageBrief: {
      dismissCta: "进入备战，护住水客",
      footnote:
        "水客负责送客批；乡音符是开战前的增益；乡贤可在商店招募，让桑梓修楼更快（本关可选）。",
      enemyLine: "劲敌：迁海碑 · 路引关吏",
      shuike: {
        title: "水客 · 护信",
        hint: "后排收信的人。前排替他挡刀。",
        primaryNote: "水客活着打赢 → 客批 +1、桑梓 +1",
        secondaryNote: "水客阵亡 → 赢了也收不到信",
      },
      xiangyin: {
        title: "乡音符 · 开局增益",
        hint: "进入战斗后，音符会飘落——点一下抓住。",
        primaryNote: "本关效果：祖灵庇佑（点击乡音符获得开局增益）",
        secondaryNote: "没点到也有弱增益，但最好别漏。",
      },
    },
    historicalFocus: "南洋同乡递信托归，归乡路从一封家书开始。",
    featuredEnemy: "qianhaibei",
    enemyComposition: ["qianhaibei", "luyinguanli", "qianhaibei"],
    difficultyLabel: "教学",
    opening: {
      actName: "同乡托信",
      body: "南洋的余温还没散尽，同乡把一封客批递到水客手里。",
      cta: "接过这封信",
    },
    prep: {
      actName: "启程备战",
      body: "前排挡住第一波阻力，别让敌人冲到后排。",
      objective: "招募水客并放到后排，胜利且水客存活才有客批。",
      cta: "护信启程",
    },
    mechanic: {
      id: "protect_shuike",
      label: "护信教学",
      description: "胜利且水客存活才产出客批与桑梓值。",
      battleHint: "首战斗 — 稳住前排，水客在后排收信。",
    },
    xiangyinBuff: {
      label: "祖灵庇佑",
      description: "点击乡音符，获得本场开局增益。",
    },
    settlement: {
      actName: "信起南洋",
      cta: "继续归途",
      win: "水客护住了第一封信，归乡路真正开始。",
      winNoLetter: "仗打赢了，但信没有跟上人。",
      loss: "第一段路被挡住，信还压在南洋的风里。",
      nextHook: "前路浮起朱红封令，海禁余波压了过来。",
    },
    acceptance: "有人把信交给我，我要把它带回家。",
  },
  "battle-2": {
    nodeId: "battle-2",
    level: 2,
    title: "海禁余波",
    shortTitle: "海禁",
    tone: "edict",
    tagline: "朱印封令压境——赢了不算，信要跟人到家。",
    stageBrief: {
      dismissCta: "进入备战，护住水客",
      footnote:
        "水客负责送客批；乡音符是开战前的增益；乡贤可在商店招募，让桑梓修楼更快（本关可选）。",
      enemyLine: "劲敌：迁海碑（前排重压）×2 · 路引关吏（侧翼试探）",
      shuike: {
        title: "水客 · 护信",
        hint: "后排收信的人。前排替他挡刀。",
        primaryNote: "水客活着打赢 → 客批 +1、桑梓 +1",
        secondaryNote: "水客阵亡 → 赢了也收不到信",
      },
      xiangyin: {
        title: "乡音符 · 开局增益",
        hint: "进入战斗后，音符会飘落——点一下抓住。",
        primaryNote: "本关效果：海令护甲（全队护甲 +10%）",
        secondaryNote: "没点到也有弱增益，但最好别漏。",
      },
    },
    historicalFocus: "海禁与迁海令让返乡、通邮与渡海都变成制度阻力。",
    featuredEnemy: "qianhaibei",
    enemyComposition: ["qianhaibei", "qianhaibei", "luyinguanli"],
    difficultyLabel: "教学",
    opening: {
      actName: "海令压境",
      body: "盖红印的禁海令压到卷轴中央，碑影拦住归路。",
      cta: "揭开封令",
    },
    prep: {
      actName: "备战护信",
      body: "前排挡住碑影，别让侧翼漏进来。",
      objective: "确认水客在后排落位，胜利且水客存活才有客批。",
      cta: "开战",
    },
    mechanic: {
      id: "protect_shuike",
      label: "护水客",
      description: "胜利且水客存活才产出客批与桑梓值。",
      battleHint: "碑影压近，前排要拦住路。",
    },
    xiangyinBuff: {
      label: "海令护甲",
      description: "全队护甲 +10%，撑过迁海碑第一轮压制。",
    },
    settlement: {
      actName: "第一封信归家",
      cta: "收好这封信",
      win: "水客穿过碑影，把第一封客批递进土楼门缝。",
      winNoLetter: "人赢了，信没到。",
      loss: "信被海风吹回，水客跪地拾起纸角。",
      nextHook: "木牌浮出：无路引，不得过关。",
    },
    acceptance: "我不是只要打赢，我还要护住送信的人。",
  },
  "battle-3": {
    nodeId: "battle-3",
    level: 3,
    title: "关隘盘查",
    shortTitle: "关隘",
    tone: "checkpoint",
    tagline: "护信之外，还要把路打通。",
    historicalFocus: "水陆要道设卡盘查，无路引者被拦、被耗、被扣押。",
    featuredEnemy: "luyinguanli",
    enemyComposition: ["luyinguanli", "luyinguanli", "qianhaibei", "zhuzaiqi"],
    difficultyLabel: "普通",
    opening: {
      actName: "关口现形",
      body: "木制关门横在路上，路引牌垂下。关吏接过信封，朱印却盖下驳回。",
      cta: "递上路引",
    },
    prep: {
      actName: "路引审查",
      body: "路引关吏堵住中路。前排必须打穿，否则战线会被盘查拖住。",
      objective: "前排开路，后排护信。",
      cta: "破关开路",
    },
    mechanic: {
      id: "inspection",
      label: "盘查",
      description: "路引关吏周期性压低最近己方单位攻速，制造前排压力。",
      battleHint: "关吏正在盘查前排，尽快打穿中路。",
    },
    xiangyinBuff: {
      label: "破关",
      description: "前 8 秒全队攻击 +15%，帮助开局集火。",
    },
    settlement: {
      actName: "过关盖印",
      cta: "盖印放行",
      win: "关门打开，水客抱信低头穿过，信封角落被盖上红印。",
      winNoLetter: "关门开了，信却没能跟着水客过关。",
      loss: "关门合上，信被退回。",
      nextHook: "一页猪仔契残纸从门缝飘出：契未满，不得归。",
    },
    acceptance: "归乡不是有信就行，还要一关一关把路打通。",
  },
  "battle-4": {
    nodeId: "battle-4",
    level: 4,
    title: "契约束缚",
    shortTitle: "契约",
    tone: "contract",
    tagline: "挣脱那些把人拴在异乡的旧账。",
    historicalFocus: "契约华工被合约、债务与工头系统困住，想归也归不得。",
    featuredEnemy: "zhuzaiqi",
    enemyComposition: ["zhuzaiqi", "zhuzaiqi", "luyinguanli", "ehushan"],
    difficultyLabel: "困难",
    opening: {
      actName: "契纸缠身",
      body: "猪仔契从屏幕边缘卷来，墨字锁链缠住客批计数，像旧账拖住脚踝。",
      cta: "解开纸契",
    },
    prep: {
      actName: "债约选择",
      body: "有些债能换来眼前的路，也会压重归乡的门槛。阵容弱时，典当会变得诱人。",
      objective: "前排分散，输出别挤成一团，水客不要站得太前。",
      cta: "撕契备战",
    },
    mechanic: {
      id: "chain_bind",
      label: "锁链束缚",
      description: "猪仔契周期性束缚最近己方单位，使其短暂停止行动。",
      battleHint: "锁链缠住前排，换位或集火猪仔契。",
      warning: "首次受到控制时，乡音符可立刻解除并提升攻速。",
    },
    xiangyinBuff: {
      label: "断契",
      description: "首次受到控制时解除束缚，并获得 3 秒攻速提升。",
    },
    settlement: {
      actName: "撕契归信",
      cta: "撕契取信",
      win: "契纸裂开，水客从碎纸里捡起信，撕掉封口上的债印。",
      winNoLetter: "契解了，送信的人却没能走出账本。",
      loss: "锁链重新合拢，信被压回契纸底下。",
      nextHook: "契纸撕开，山路才露出来。",
    },
    acceptance: "归乡不只是过关，还要挣脱那些把人拴在异乡的旧账。",
  },
  "battle-5": {
    nodeId: "battle-5",
    level: 5,
    title: "饿虎山",
    shortTitle: "山路",
    tone: "mountain",
    tagline: "路本身也会吃人。",
    historicalFocus: "山路阻隔、匪患饥荒与空手返乡的险境，压在每一步上。",
    featuredEnemy: "ehushan",
    enemyComposition: ["ehushan", "ehushan", "zhuzaiqi", "luyinguanli", "hongtouchuan"],
    difficultyLabel: "险峻",
    opening: {
      actName: "山影压路",
      body: "卷轴路线入山，屏幕两侧山影合拢，只剩一点灯火照出窄路。",
      cta: "点灯入山",
    },
    prep: {
      actName: "夜入险径",
      body: "饿虎山会扑向薄弱处。水客不能只躲在角落裸站，侧翼也要有人。",
      objective: "前排要厚，侧翼要有人，水客身边必须有人护着。",
      cta: "越岭开战",
    },
    mechanic: {
      id: "mountain_pounce",
      label: "扑袭",
      description: "饿虎山低频扑向血量最低或最近后排单位，逼迫玩家保护侧翼。",
      battleHint: "山影扑向后排，护住水客侧翼。",
      warning: "扑袭前目标格会出现山影 / 爪痕预警。",
    },
    xiangyinBuff: {
      label: "山灯",
      description: "水客附近 1 格友军护甲 +15，持续 10 秒。",
    },
    settlement: {
      actName: "越岭归信",
      cta: "越岭前行",
      win: "水客提灯越岭，信封被山风吹起，又被他按回怀里。",
      winNoLetter: "山路通了，送信的人却留在了山里。",
      loss: "灯灭，山影合拢，信纸被压在石缝里。",
      nextHook: "山路尽头传来海风，红头船票价牌一闪：渡海，要钱。",
    },
    acceptance: "归乡路不只要过人关，还要扛过会吞人的山路。",
  },
  "battle-6": {
    nodeId: "battle-6",
    level: 6,
    title: "红头船",
    shortTitle: "船票",
    tone: "harbor",
    tagline: "钱能上船，信才能回家。",
    historicalFocus: "返乡船票、路费与盘缠高昂，让近在眼前的家变得遥远。",
    featuredEnemy: "hongtouchuan",
    enemyComposition: ["hongtouchuan", "hongtouchuan", "ehushan", "zhuzaiqi", "xiedouhuo"],
    difficultyLabel: "险峻",
    opening: {
      actName: "船影临岸",
      body: "红头船靠近海岸，船夫摊开票价牌。希望就在眼前，价格也压到眼前。",
      cta: "数一数手里的信",
    },
    prep: {
      actName: "船票索价",
      body: "看清客批、血债与归乡阈值。若终局前不足阈值，即使登船也无归乡票。",
      objective: "尽快集火红头船，别让票价压迫拖低阵容战力。",
      cta: "登船备战",
    },
    mechanic: {
      id: "fare_pressure",
      label: "票价压迫",
      description: "红头船周期性压低随机己方单位攻击或护甲，但战斗中不扣金币。",
      battleHint: "票价压迫落下，先拆红头船。",
    },
    xiangyinBuff: {
      label: "归帆",
      description: "开战前 10 秒全队移速 / 攻速小幅提升，快速接敌。",
    },
    settlement: {
      actName: "登船数信",
      cta: "登船",
      win: "水客站在跳板前数信，够则归乡票虚影浮现，不够则票影残缺。",
      winNoLetter: "船到了，送信的人却没能登上去。",
      loss: "红头船远去，票价牌沉入海水。",
      nextHook: "登船后海雾变红，远处械斗火映亮海面。",
    },
    acceptance: "钱能把人送上船，只有信能把人送回家。",
  },
  "battle-7": {
    nodeId: "battle-7",
    level: 7,
    title: "械斗火 / 风浪归乡",
    shortTitle: "终局",
    tone: "fire",
    tagline: "把信从所有风浪里接住。",
    historicalFocus: "土客械斗、乱世报复与近乡不敢归，是最后的火线。",
    featuredEnemy: "xiedouhuo",
    enemyComposition: ["xiedouhuo", "xiedouhuo", "hongtouchuan", "zhuzaiqi", "ehushan"],
    difficultyLabel: "极难",
    opening: {
      actName: "海上归帆",
      body: "红头船靠岸，海雾里露出土楼灯火。玩家看见家了，火光却从岸边升起。",
      cta: "看见家了",
    },
    prep: {
      actName: "火光压岸",
      body: "终局前看清客批、血债、归乡阈值与存续度。械斗火会直扑后排。",
      objective: "围住水客，快速处理械斗火，用前排和侧翼筑最后一道墙。",
      cta: "最后备战",
    },
    mechanic: {
      id: "lock_letter",
      label: "后排锁信",
      description: "械斗火跃向水客附近，优先威胁送信线。",
      battleHint: "火痕落在水客身边，护信！",
      warning: "跃击前目标格会出现红色火痕预警。",
    },
    xiangyinBuff: {
      label: "落叶归根",
      description: "短时间全队攻速 + 吸血；宗族羁绊满级时强化为全屏高光。",
    },
    settlement: {
      actName: "风浪抓信",
      cta: "抓住信",
      win: "水客抱着信冲过火线，信封边缘被烧焦，但字还在。",
      winNoLetter: "终局虽胜，水客未能护信；若客批已达标，只能险胜归乡。",
      loss: "风浪与火光卷回岸边，信差一点沉下去。",
      nextHook: "封令、关门、契纸、山路、船票、火光，都压到最后一封真实侨批上。",
    },
    acceptance: "归乡不是打败最后一个敌人，而是把信从所有风浪里接住。",
  },
};

export function levelInteractionForNode(
  nodeId: string | undefined,
): LevelInteractionDefinition | null {
  if (!nodeId) return null;
  return LEVEL_INTERACTIONS[nodeId] ?? null;
}

export function levelInteractionForStage(
  stage: number,
): LevelInteractionDefinition | null {
  return LEVEL_INTERACTIONS[`battle-${stage}`] ?? null;
}

export function levelToneClass(tone: LevelTone): string {
  return `kepi-level-tone--${tone}`;
}
