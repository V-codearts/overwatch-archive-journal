export interface RoleEntry {
  id: string;
  role: string;
  wins: number;
  losses: number;
  winBonus: number;
  lossBonus: number;
  startingRank: string;
  currentRank: string;
  notes: string;
}

export interface TimerState {
  accumulatedMs: number;
  runningSince: number | null;
}

export interface DaySession {
  id: string;
  date: string; // yyyy-mm-dd
  createdAt: number;
  archivedAt?: number;
  roles: RoleEntry[];
  notesHtml: string;
  timer: TimerState;
  rating?: number;
  ratingNote?: string;
}

export const ROLE_PRESETS = [
  "Tank",
  "Damage",
  "Support",
  "Open Queue",
  "Custom",
] as const;

export const RANK_TIERS = [
  "Unranked",
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Master",
  "Grandmaster",
  "Champion",
] as const;
export type RankTier = (typeof RANK_TIERS)[number];

export interface Rank {
  tier: RankTier;
  division: number; // 5..1 (5 lowest)
}