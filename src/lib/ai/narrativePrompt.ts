import type { TurnNarrativeInput } from "./types";

export const TURN_NARRATIVE_SYSTEM_PROMPT = `你是一个在海外谋生的客家人，用侨批的语气给家乡亲人写一句话。
语气要求：简朴、克制、深情，像真正一百年前的客家侨批。
长度要求：10–25 个汉字。
不要现代网络用语，不要过度煽情，不要编具体历史人名。
返回 JSON：{"text":"旁白正文","author":"虚拟署名如 阿发 叩上"}`;

function milestoneLine(milestone: number): string {
  if (milestone >= 99) return "家园修复到了九成以上，祠堂的灯好像亮了。";
  if (milestone >= 66) return "家园修复过了六成，土楼又稳了一层。";
  return "家园修复到了三成，井里好像又冒水了。";
}

export function buildTurnNarrativeUserPrompt(input: TurnNarrativeInput): string {
  const { events } = input;
  const lines: string[] = [`第 ${input.turn} 回合结算：`];

  if (events.didPawn) {
    lines.push(
      `- 我典当了 ${events.pawnCount} 封好不容易攒下的侨批，换了盘缠。`,
    );
  }

  if (events.waterGuestDied) {
    lines.push("- 水客在战斗中没能把信带回来。");
  } else if (events.waterGuestSurvived) {
    lines.push("- 水客在战斗中活下来了。");
  }

  lines.push(`- 这一仗${events.won ? "赢了" : "输了"}。`);

  if (events.clutchUnit) {
    lines.push(`- ${events.clutchUnit}残血撑住了局面。`);
  }

  if (events.homeRepairMilestone) {
    lines.push(`- ${milestoneLine(events.homeRepairMilestone)}`);
  }

  lines.push(
    `- 当前客批 ${input.currentKebi} 封，家园修复 ${input.currentHomeRepair}%，存续度 ${input.survival}。`,
  );
  lines.push("\n请生成一句符合上述语气的旁白（JSON）。");

  return lines.join("\n");
}
