#!/usr/bin/env python3
"""
客批（Kepi）配乐生成脚本 —— 使用 Music Cog (CellCog) 生成成品 BGM。

为 7 个游戏场景各生成一首循环友好的成品 MP3，输出到：
    public/audio/bgm/kepi_bgm_<scene>.mp3

前端（src/lib/audio/bgmFiles.ts）会在场景切换时优先播放这些文件，
缺失时自动回退到程序化合成（断网可玩、缺素材不影响运行）。

用法：
    export CELLCOG_API_KEY="sk_..."      # 必需
    python3 scripts/gen_bgm.py           # 生成全部（已存在则跳过）
    python3 scripts/gen_bgm.py menu      # 仅生成指定场景

设计约束（见 docs/kepi_audio-design_v1.md）：
    - 客家五声音阶（宫商角徵羽），避免西方功能和声的强解决。
    - 民族乐器音色：椰胡/二胡（弓弦）、古筝/扬琴（拨弦）、笛/箫（气声）、
      木鱼/战鼓/大锣（打击）。
    - 主题统一：乡愁(nostalgia) 动机贯穿 menu/route/campfire/battle_final/ending。
"""

import os
import shutil
import sys
import time
from pathlib import Path

try:
    from cellcog import CellCogClient
except ImportError:
    sys.exit("请先安装 cellcog： pip install -U cellcog")

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "audio" / "bgm"
CHATS_DIR = Path(os.path.expanduser("~/.cellcog/chats"))

# 场景 → (输出文件名, 时长秒, 生成提示词)
TRACKS = {
    "menu": (
        90,
        "Compose a 90-second looping menu theme for a Hakka culture homecoming game. "
        "Mood: tender nostalgia with quiet hope — a homesick traveler remembering home. "
        "Style: Hakka mountain song (客家山歌), Chinese pentatonic scale (gong-shang-jue-zhi-yu, no Western functional harmony). "
        "Instrumentation: solo erhu/yehu (bowed string) carrying a singing, slightly sliding melody, "
        "soft guzheng (plucked zither) pad, distant dizi (flute), and a sparse wooden fish (muyu) heartbeat. "
        "Start with a lone bowed string, layer gentle plucked zither at 25s, build a warm swell, resolve softly and loop seamlessly. "
        "Warm, intimate, cinematic — think a calm evening remembering family. Looping ambient game soundtrack.",
    ),
    "route": (
        90,
        "Compose a 90-second looping travel/preparation theme for a Hakka homecoming journey game. "
        "Mood: steady walking forward, bittersweet determination, the road home. "
        "Style: Hakka pentatonic scale, folk-game soundtrack. "
        "Instrumentation: a walking wooden fish (muyu) pulse, low erhu drone bass, guzheng arpeggios, "
        "and a dizi flute stating a variant of the nostalgia motif. Moderate, moving tempo (~72 BPM feel). "
        "Build gentle momentum, keep it loopable, never aggressive. Warm and earthy.",
    ),
    "campfire": (
        80,
        "Compose an 80-second looping campfire-night theme for a Hakka storytelling scene. "
        "Mood: warm, intimate, safe — elders sharing family letters by the fire. "
        "Style: Hakka pentatonic, gentle acoustic folk. "
        "Instrumentation: soft guzheng, a low erhu hum, occasional wooden fish like fire crackle, "
        "and a wordless mountain-song melodic line on dizi. Slow, hushed, conversational. "
        "Loop seamlessly; feel like a quiet night that could go on forever.",
    ),
    "pawn_shop": (
        75,
        "Compose a 75-second looping tension theme for a pawn-shop /典当行 scene in a Hakka game. "
        "Mood: uneasy, transactional, a heavy secret — pawning family heirlooms to survive. "
        "Style: Hakka pentatonic but low, sparse, slightly detuned and shadowed. "
        "Instrumentation: low erhu with a wavering bow, a distant muted gong, creaking wood percussion, "
        "sparse guzheng notes with long reverb. Slow, oppressive, restrained. Loop seamlessly, keep it suffocating but not loud.",
    ),
    "battle": (
        75,
        "Compose a 75-second looping battle theme for a Hakka auto-chess game. "
        "Mood: protective pressure, the clash of history's resistance — guarding the family on the road home. "
        "Style: Hakka pentatonic, driving game-battle soundtrack. "
        "Instrumentation: taiko war drums (战鼓) driving the pulse, low erhu drone, sharp guzheng stabs, "
        "and a tense dizi line. Energetic, rhythmic, escalating tension but not frantic. Loop seamlessly. "
        "Think a determined stand rather than chaos.",
    ),
    "battle_final": (
        90,
        "Compose a 90-second looping FINAL battle theme for the last stage of a Hakka homecoming game. "
        "Mood: maximum pressure that resolves into triumphant homecoming — the final return. "
        "Style: Hakka pentatonic, epic game-battle soundtrack with emotional payoff. "
        "Instrumentation: big taiko drums, a heroic erhu/yehu melody stating the nostalgia motif in full, "
        "guzheng runs, dizi, and a grand gong (大锣) on strong beats. Build from tense to soaring, "
        "loop seamlessly. Climactic yet warm — the longing finally arriving home.",
    ),
    "ending": (
        120,
        "Compose a 120-second soft ambient bed for the ending of a Hakka homecoming game — a real "
        "remittance letter (侨批) is read aloud in Hakka while ocean waves sound. "
        "Mood: peaceful resolution, quiet tears of joy, the letter received at last. "
        "Style: Hakka pentatonic, very soft cinematic ambient. "
        "Instrumentation: a breathy pad like distant ocean + wordless erhu/yehu humming the nostalgia motif, "
        "sparse dizi, almost no percussion. Very quiet, spacious, loopable — it is a background bed under spoken voice, "
        "so keep dynamics low and let it breathe. Hopeful and tender closure.",
    ),
}


def find_mp3(chat_id: str) -> Path | None:
    d = CHATS_DIR / chat_id
    if not d.exists():
        return None
    for p in sorted(d.rglob("*.mp3")):
        return p
    return None


def generate(scene: str, seconds: int, prompt: str) -> bool:
    out_path = OUT_DIR / f"kepi_bgm_{scene}.mp3"
    if out_path.exists():
        print(f"[skip] {scene}: {out_path.name} 已存在")
        return True

    print(f"[gen ] {scene}: {seconds}s ...")
    client = CellCogClient(agent_provider="codebuddy")
    res = client.create_chat(
        prompt=f"{prompt}\n\nDuration: exactly {seconds} seconds. Output a seamless loopable MP3.",
        task_label=f"kepi-bgm-{scene}",
        chat_mode="agent",
        delivery="wait_for_completion",
        timeout=1800,
    )
    chat_id = res.get("chat_id")
    # 等待文件落盘
    mp3 = None
    for _ in range(20):
        mp3 = find_mp3(chat_id) if chat_id else None
        if mp3:
            break
        time.sleep(1)
    if not mp3:
        print(f"[fail] {scene}: 未找到生成文件。message=\n{res.get('message', '')[:500]}")
        return False
    shutil.copy(mp3, out_path)
    print(f"[ ok ] {scene}: -> {out_path.name}")
    return True


def main() -> int:
    if not os.environ.get("CELLCOG_API_KEY"):
        sys.exit("缺少 CELLCOG_API_KEY：请先 export CELLCOG_API_KEY=\"sk_...\"")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    wanted = sys.argv[1:]
    scenes = wanted if wanted else list(TRACKS.keys())
    for s in scenes:
        if s not in TRACKS:
            print(f"[warn] 未知场景: {s}")
            continue
        secs, prompt = TRACKS[s]
        ok = generate(s, secs, prompt)
        if not ok:
            return 1
    print("完成。生成的文件位于:", OUT_DIR)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
