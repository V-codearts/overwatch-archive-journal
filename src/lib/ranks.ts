import { RANK_TIERS, type Rank, type RankTier } from "./types";

export function parseRank(s: string | undefined | null): Rank | null {
  if (!s) return null;
  const trimmed = s.trim();
  if (!trimmed || trimmed.toLowerCase() === "unranked") return { tier: "Unranked", division: 0 };
  const m = trimmed.match(/^([a-zA-Z]+)\s*([1-5])?$/);
  if (!m) return null;
  const tierRaw = m[1].toLowerCase();
  const tier = RANK_TIERS.find((t) => t.toLowerCase() === tierRaw) as RankTier | undefined;
  if (!tier) return null;
  const div = m[2] ? parseInt(m[2], 10) : 5;
  return { tier, division: div };
}

export function rankToNumber(s: string | undefined | null): number | null {
  const r = parseRank(s);
  if (!r) return null;
  if (r.tier === "Unranked") return null;
  const idx = RANK_TIERS.indexOf(r.tier) - 1; // Bronze=0
  return idx * 5 + (6 - r.division);
}

export function numberToRank(n: number): string {
  if (n < 1) return "Bronze 5";
  const clamped = Math.min(40, Math.max(1, Math.round(n)));
  const idx = Math.floor((clamped - 1) / 5) + 1; // 1..8
  const tier = RANK_TIERS[idx] ?? "Champion";
  const div = 6 - ((clamped - 1) % 5 + 1);
  return `${tier} ${div}`;
}

export function formatRank(s: string | undefined | null): string {
  const r = parseRank(s);
  if (!r) return s || "—";
  if (r.tier === "Unranked") return "Unranked";
  return `${r.tier} ${r.division}`;
}

export function rankDelta(from: string, to: string): number {
  const a = rankToNumber(from);
  const b = rankToNumber(to);
  if (a == null || b == null) return 0;
  return b - a;
}

export const RANK_OPTIONS: string[] = (() => {
  const list: string[] = ["Unranked"];
  for (const tier of RANK_TIERS.slice(1)) {
    for (let d = 5; d >= 1; d--) list.push(`${tier} ${d}`);
  }
  return list;
})();