"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BALANCE } from "@/data/balance";
import { JOURNEY } from "@/data/journey";
import { createInitialSnapshot, reduceGameState } from "@/engine";
import { enterJourneyNode } from "@/engine/journey";
import { enterEnding } from "@/engine/progression";
import { AI_REQUEST_TIMEOUT_MS } from "@/lib/ai/types";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import type { GameAction } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToastHost } from "@/components/game/ToastHost";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const QUICK_ACTIONS: GameAction[] = [
  { type: "REFRESH_SHOP" },
  { type: "BUY_POPULATION" },
  { type: "START_BATTLE" },
  { type: "END_BATTLE" },
  { type: "ADVANCE_STAGE" },
  { type: "ADVANCE_JOURNEY" },
  { type: "BORROW_AGAINST_RETURN" },
  { type: "SKIP_OPENING_BUFF" },
  { type: "LEAVE_PAWN_SHOP" },
];

export default function DebugPage() {
  const snapshot = useGameStore((state) => state.snapshot);
  const dispatch = useGameStore((state) => state.dispatch);
  const resetGame = useGameStore((state) => state.resetGame);
  const replaceSnapshot = useGameStore((state) => state.replaceSnapshot);
  const pushToast = useUIStore((state) => state.pushToast);
  const [draft, setDraft] = useState("");

  const pretty = useMemo(() => JSON.stringify(snapshot, null, 2), [snapshot]);

  const jumpToEnding = (variant: "perfect_homecoming" | "regretful_stay" | "storm_rescue") => {
    let base = enterJourneyNode(snapshot, 6);
    if (variant === "perfect_homecoming") {
      base = {
        ...base,
        state: {
          ...base.state,
          kebi: 5,
          kebiThreshold: 5,
          survival: 1,
          homeRepairTier: 3,
          pawnedKebi: 0,
        },
      };
    } else if (variant === "regretful_stay") {
      base = {
        ...base,
        state: {
          ...base.state,
          kebi: 3,
          kebiThreshold: 5,
          survival: 1,
          homeRepairTier: 2,
          pawnedKebi: 1,
        },
      };
    } else {
      base = {
        ...base,
        state: {
          ...base.state,
          kebi: 1,
          survival: 0,
          homeRepairTier: 0,
        },
      };
    }
    const ending = enterEnding(base, variant === "storm_rescue" ? "elimination" : "final_stage");
    replaceSnapshot(ending);
    pushToast(`已进入 ${variant} 结局`, "default");
  };

  const jumpToNode = (index: number) => {
    const next = enterJourneyNode(snapshot, index);
    replaceSnapshot(next);
    pushToast(`已跳转到归途 ${index + 1}`, "default");
  };

  const setBloodDebt = (count: number) => {
    replaceSnapshot({
      ...snapshot,
      state: {
        ...snapshot.state,
        bloodDebtCount: count,
        kebiThreshold: BALANCE.journey.baseKebiThreshold + count,
      },
    });
  };

  return (
    <main className="mx-auto flex min-h-full w-full max-w-6xl flex-1 flex-col gap-4 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">调试页</h1>
          <p className="text-muted-foreground">
            V3.1 引擎快照、路线跳转与 JSON 导入导出
          </p>
        </div>
        <div className="flex gap-2">
          <Button nativeButton={false} variant="outline" render={<Link href="/" />}>
            返回主战场
          </Button>
          <Button variant="secondary" onClick={resetGame}>
            重置对局
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>当前快照</CardTitle>
            <CardDescription>
              phase={snapshot.phase} · node={snapshot.state.journeyIndex + 1}/
              {snapshot.state.totalNodes} · threshold={snapshot.state.kebiThreshold}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>金币 {snapshot.state.gold}</Badge>
              <Badge variant="secondary">
                客批 {snapshot.state.kebi}/{snapshot.state.kebiThreshold}
              </Badge>
              <Badge variant="outline">透支 {snapshot.state.bloodDebtCount}</Badge>
              <Badge variant="outline">修复 {snapshot.state.homeRepair}%</Badge>
            </div>
            <pre className="max-h-[420px] overflow-auto rounded-lg bg-muted/40 p-3 text-xs leading-relaxed">
              {pretty}
            </pre>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>V3.1 快捷项</CardTitle>
              <CardDescription>路线、典当、归途 phase、AI 熔断</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {JOURNEY.nodes.map((node, index) => (
                <Button key={node.id} size="sm" variant="outline" onClick={() => jumpToNode(index)}>
                  归途 {index + 1}
                </Button>
              ))}
              <Button size="sm" onClick={() => setBloodDebt(0)}>
                阈值 5
              </Button>
              <Button size="sm" onClick={() => setBloodDebt(1)}>
                阈值 6
              </Button>
              <Button size="sm" onClick={() => setBloodDebt(2)}>
                阈值 7
              </Button>
              <Button size="sm" variant="secondary" onClick={() => jumpToNode(2)}>
                典当行
              </Button>
              <Button size="sm" variant="secondary" onClick={() => jumpToNode(0)}>
                篝火
              </Button>
              <Button size="sm" variant="secondary" onClick={() => jumpToEnding("perfect_homecoming")}>
                完美结局
              </Button>
              <Button size="sm" variant="secondary" onClick={() => jumpToEnding("regretful_stay")}>
                遗憾结局
              </Button>
              <Button size="sm" variant="secondary" onClick={() => jumpToEnding("storm_rescue")}>
                风浪结局
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => pushToast(`AI 熔断 ${AI_REQUEST_TIMEOUT_MS}ms`, "default")}
              >
                AI {AI_REQUEST_TIMEOUT_MS}ms
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>快捷动作</CardTitle>
              <CardDescription>直接 dispatch 到引擎 reducer</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.type}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    dispatch(action);
                    pushToast(`已 dispatch ${action.type}`, "default");
                  }}
                >
                  {action.type}
                </Button>
              ))}
              <Button
                size="sm"
                onClick={() =>
                  dispatch({ type: "PICK_CAMPFIRE_CHOICE", choiceId: "share-gold" })
                }
              >
                CAMPFIRE pick
              </Button>
              <Button
                size="sm"
                onClick={() => dispatch({ type: "BUY_PIECE", pieceType: "farmer" })}
              >
                BUY farmer
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>快照导入</CardTitle>
              <CardDescription>粘贴 JSON 后 LOAD_SNAPSHOT</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="min-h-[160px] w-full rounded-lg border border-input bg-background p-3 font-mono text-xs"
                placeholder="粘贴 GameSnapshot JSON"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(draft) as Parameters<
                        typeof replaceSnapshot
                      >[0];
                      replaceSnapshot(parsed);
                      pushToast("快照已导入", "success");
                    } catch {
                      pushToast("JSON 解析失败", "error");
                    }
                  }}
                >
                  导入
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setDraft(pretty)}>
                  复制当前
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const initial = createInitialSnapshot();
                    const stepped = reduceGameState(initial, {
                      type: "BUY_PIECE",
                      pieceType: "farmer",
                    });
                    setDraft(JSON.stringify(stepped, null, 2));
                  }}
                >
                  生成样例
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ToastHost />
    </main>
  );
}
