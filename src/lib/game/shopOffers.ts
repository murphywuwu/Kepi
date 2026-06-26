import type { PieceType } from "@/types";

export type ShopOffer = {
  type: PieceType;
  count: number;
};

/** Collapse duplicate shop slots into one UI row per piece type (order preserved). */
export function groupShopOffers(slots: PieceType[]): ShopOffer[] {
  const order: PieceType[] = [];
  const counts = new Map<PieceType, number>();

  for (const slot of slots) {
    if (!counts.has(slot)) order.push(slot);
    counts.set(slot, (counts.get(slot) ?? 0) + 1);
  }

  return order.map((type) => ({ type, count: counts.get(type)! }));
}
