import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Award,
  Flame,
  TrendingUp,
  Trophy,
  Timer as TimerIcon,
  Sparkles,
  Target,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { DaySession } from "@/lib/types";
import { rankToNumber, numberToRank, formatRank } from "@/lib/ranks";
import { formatDateShort, formatDuration } from "@/lib/format";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/overview")({
  head: () => ({
    meta: [
      { title: "Overview — Overwatch Competitive Journal" },
      { name: "description", content: "Personal bests, averages and progress charts across your competitive journey." },
    ],
  }),
  component: OverviewPage,
});

const RANGE_OPTIONS = [
  { value: "2", label: "2 Days" },
  { value: "4", label: "4 Days" },
  { value: "7", label: "7 Days" },
  { value: "14", label: "14 Days" },
  { value: "30", label: "30 Days" },
  { value: "90", label: "90 Days" },
  { value: "season", label: "Season (60d)" },
  { value: "year", label: "Year" },
  { value: "all", label: "All Time" },
];

function totalsFor(d: DaySession) {
  return d.roles.reduce(
    (acc, r) => {
      acc.wins += r.wins;
      acc.losses += r.losses;
      acc.winBonus += r.winBonus;
      acc.lossBonus += r.lossBonus;
      return acc;
    },
    { wins: 0, losses: 0, winBonus: 0, lossBonus: 0 },
  );
}

function avgRankFor(d: DaySession, which: "startingRank" | "currentRank"): number | null {
  const nums = d.roles.map((r) => rankToNumber(r[which])).filter((n): n is number => n != null);
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function OverviewPage() {
  const { history, current } = useStore();
  const [range, setRange] = useState("30");

  const allDays = useMemo(() => {
    const list = [...history];
    // include current day in some stats but keep charts to archived
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [history]);

  const filtered = useMemo(() => {
    if (allDays.length === 0) return [];
    if (range === "all") return allDays;
    const now = new Date();
    let days = parseInt(range, 10);
    if (range === "season") days = 60;
    if (range === "year") days = 365;
    if (isNaN(days)) days = 30;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffIso = cutoff.toISOString().slice(0, 10);
    return allDays.filter((d) => d.date >= cutoffIso);
  }, [allDays, range]);

  // Current status
  const allWithCurrent = [current, ...history];
  const totalWins = allWithCurrent.reduce((s, d) => s + totalsFor(d).wins, 0);
  const totalLosses = allWithCurrent.reduce((s, d) => s + totalsFor(d).losses, 0);
  const totalGames = totalWins + totalLosses;
  const overallWR = totalGames ? (totalWins / totalGames) * 100 : 0;
  const totalMs = allWithCurrent.reduce((s, d) => s + d.timer.accumulatedMs, 0);
  const totalBonus = allWithCurrent.reduce((s, d) => {
    const t = totalsFor(d);
    return s + t.winBonus + t.lossBonus;
  }, 0);

  // Current rank — latest archived day's highest rank
  const latest = history[0];
  const currentRankStr = latest
    ? latest.roles
        .map((r) => r.currentRank)
        .filter((r) => rankToNumber(r) != null)
        .sort((a, b) => (rankToNumber(b) || 0) - (rankToNumber(a) || 0))[0] || "Unranked"
    : "Unranked";

  // Personal bests
  const pb = useMemo(() => {
    if (allDays.length === 0) return null;
    let mostWins = 0, mostWinsDay: DaySession | null = null;
    let bestWR = -1, bestWRDay: DaySession | null = null;
    let longest = 0, longestDay: DaySession | null = null;
    let bestRankImp = -Infinity, bestRankDay: DaySession | null = null;
    let bestBonus = -Infinity, bestBonusDay: DaySession | null = null;
    for (const d of allDays) {
      const t = totalsFor(d);
      const g = t.wins + t.losses;
      if (t.wins > mostWins) { mostWins = t.wins; mostWinsDay = d; }
      if (g >= 3) {
        const wr = t.wins / g;
        if (wr > bestWR) { bestWR = wr; bestWRDay = d; }
      }
      if (d.timer.accumulatedMs > longest) { longest = d.timer.accumulatedMs; longestDay = d; }
      const start = avgRankFor(d, "startingRank");
      const end = avgRankFor(d, "currentRank");
      if (start != null && end != null) {
        const imp = end - start;
        if (imp > bestRankImp) { bestRankImp = imp; bestRankDay = d; }
      }
      const bonus = t.winBonus + t.lossBonus;
      if (bonus > bestBonus) { bestBonus = bonus; bestBonusDay = d; }
    }
    // streaks over chronological days (a day is "win" if wins > losses)
    let bestWinStreak = 0, curWin = 0;
    let worstLossStreak = 0, curLoss = 0;
    for (const d of allDays) {
      const t = totalsFor(d);
      if (t.wins > t.losses) { curWin++; bestWinStreak = Math.max(bestWinStreak, curWin); curLoss = 0; }
      else if (t.losses > t.wins) { curLoss++; worstLossStreak = Math.max(worstLossStreak, curLoss); curWin = 0; }
      else { curWin = 0; curLoss = 0; }
    }
    return {
      mostWins, mostWinsDay,
      bestWR: bestWR < 0 ? null : bestWR, bestWRDay,
      longest, longestDay,
      bestRankImp: isFinite(bestRankImp) ? bestRankImp : null, bestRankDay,
      bestBonus: isFinite(bestBonus) ? bestBonus : null, bestBonusDay,
      bestWinStreak, worstLossStreak,
    };
  }, [allDays]);

  // Averages over filtered
  const avg = useMemo(() => {
    if (filtered.length === 0) return null;
    let wins = 0, losses = 0, bonus = 0, ms = 0;
    let startSum = 0, startCount = 0, endSum = 0, endCount = 0, gainSum = 0, gainCount = 0;
    for (const d of filtered) {
      const t = totalsFor(d);
      wins += t.wins; losses += t.losses;
      bonus += t.winBonus + t.lossBonus;
      ms += d.timer.accumulatedMs;
      const s = avgRankFor(d, "startingRank");
      const e = avgRankFor(d, "currentRank");
      if (s != null) { startSum += s; startCount++; }
      if (e != null) { endSum += e; endCount++; }
      if (s != null && e != null) { gainSum += (e - s); gainCount++; }
    }
    const n = filtered.length;
    const games = wins + losses;
    return {
      days: n,
      wins: wins / n,
      losses: losses / n,
      games: games / n,
      wr: games ? (wins / games) * 100 : 0,
      playtimeMs: ms / n,
      bonus: bonus / n,
      startRank: startCount ? startSum / startCount : null,
      endRank: endCount ? endSum / endCount : null,
      dailyGain: gainCount ? gainSum / gainCount : 0,
    };
  }, [filtered]);

  // Chart data
  const chartData = useMemo(() => {
    return filtered.map((d) => {
      const t = totalsFor(d);
      const g = t.wins + t.losses;
      const end = avgRankFor(d, "currentRank");
      return {
        date: formatDateShort(d.date),
        winRate: g ? Math.round((t.wins / g) * 100) : 0,
        rank: end,
        games: g,
        hours: +(d.timer.accumulatedMs / 3_600_000).toFixed(2),
        bonus: t.winBonus + t.lossBonus,
        net: t.wins - t.losses,
      };
    });
  }, [filtered]);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 font-display text-xs uppercase tracking-[0.35em] text-primary">
          <TrendingUp className="h-4 w-4" /> Overview
        </div>
        <h1 className="font-display text-3xl font-bold tracking-wide">Your Competitive Journey</h1>
      </div>

      {/* Current status */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Current Rank" value={formatRank(currentRankStr)} icon={<Award />} large />
        <StatCard label="Total Wins" value={<AnimatedCounter value={totalWins} />} tone="win" icon={<Trophy />} />
        <StatCard label="Total Losses" value={<AnimatedCounter value={totalLosses} />} tone="loss" icon={<Target />} />
        <StatCard label="Overall Win Rate" value={<AnimatedCounter value={overallWR} decimals={1} suffix="%" />} tone="win" icon={<TrendingUp />} />
        <StatCard label="Hours Played" value={<AnimatedCounter value={totalMs / 3_600_000} decimals={1} />} icon={<TimerIcon />} />
        <StatCard label="Archived Days" value={<AnimatedCounter value={history.length} />} icon={<Sparkles />} />
        <StatCard label="Total Bonus" value={<AnimatedCounter value={totalBonus} />} tone={totalBonus >= 0 ? "win" : "loss"} icon={<Flame />} />
        <StatCard label="Roles Today" value={<AnimatedCounter value={current.roles.length} />} icon={<Award />} />
      </section>

      {/* Personal bests */}
      <section>
        <SectionTitle>Personal Bests</SectionTitle>
        {pb ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <PBCard label="Most Wins in One Day" value={pb.mostWins} sub={pb.mostWinsDay?.date} />
            <PBCard label="Highest Win Rate" value={pb.bestWR != null ? `${Math.round(pb.bestWR * 100)}%` : "—"} sub={pb.bestWRDay?.date} />
            <PBCard label="Longest Session" value={formatDuration(pb.longest, { compact: true })} sub={pb.longestDay?.date} />
            <PBCard label="Biggest Rank Gain" value={pb.bestRankImp != null ? `+${pb.bestRankImp.toFixed(1)}` : "—"} sub={pb.bestRankDay?.date} />
            <PBCard label="Highest Bonus Day" value={pb.bestBonus ?? "—"} sub={pb.bestBonusDay?.date} />
            <PBCard label="Best / Worst Streak" value={`${pb.bestWinStreak}W · ${pb.worstLossStreak}L`} sub="consecutive days" />
          </div>
        ) : (
          <EmptyChart text="Archive a session to unlock personal bests." />
        )}
      </section>

      {/* Averages */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle noMargin>Average Day</SectionTitle>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[160px] border-primary/30 bg-secondary/60 font-display uppercase tracking-wider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {avg ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Avg Wins" tone="win" value={<AnimatedCounter value={avg.wins} decimals={1} />} />
            <StatCard label="Avg Losses" tone="loss" value={<AnimatedCounter value={avg.losses} decimals={1} />} />
            <StatCard label="Avg Games" value={<AnimatedCounter value={avg.games} decimals={1} />} />
            <StatCard label="Avg Win Rate" tone="win" value={<AnimatedCounter value={avg.wr} decimals={1} suffix="%" />} />
            <StatCard label="Avg Playtime" value={formatDuration(avg.playtimeMs, { compact: true })} />
            <StatCard label="Avg Bonus" tone={avg.bonus >= 0 ? "win" : "loss"} value={<AnimatedCounter value={avg.bonus} decimals={1} />} />
            <StatCard label="Avg Start Rank" value={avg.startRank != null ? numberToRank(avg.startRank) : "—"} />
            <StatCard label="Avg End Rank" value={avg.endRank != null ? numberToRank(avg.endRank) : "—"} />
            <StatCard label="Avg Daily Rank Gain" tone={avg.dailyGain >= 0 ? "win" : "loss"} value={<AnimatedCounter value={avg.dailyGain} decimals={2} />} />
            <StatCard label="Sample Size" value={<AnimatedCounter value={avg.days} suffix=" days" />} />
          </div>
        ) : (
          <EmptyChart text="No sessions in this range." />
        )}
      </section>

      {/* Progress charts */}
      <section className="space-y-4">
        <SectionTitle>Progress</SectionTitle>
        {chartData.length > 1 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Win Rate over Time">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="wr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {axes()}
                  <Tooltip {...tooltipProps} formatter={(v) => [`${v}%`, "Win Rate"]} />
                  <Area type="monotone" dataKey="winRate" stroke="var(--color-primary)" strokeWidth={2} fill="url(#wr)" isAnimationActive animationDuration={800} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Rank Progression">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  {axes()}
                  <Tooltip {...tooltipProps} formatter={(v: number) => [numberToRank(v), "Rank"]} />
                  <Line type="monotone" dataKey="rank" stroke="var(--color-chart-2)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive animationDuration={800} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Games Played per Day">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  {axes()}
                  <Tooltip {...tooltipProps} />
                  <Bar dataKey="games" fill="var(--color-chart-5)" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Playtime (hours)">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="pt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {axes()}
                  <Tooltip {...tooltipProps} />
                  <Area type="monotone" dataKey="hours" stroke="var(--color-chart-2)" strokeWidth={2} fill="url(#pt)" isAnimationActive animationDuration={800} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Bonus Points">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  {axes()}
                  <Tooltip {...tooltipProps} />
                  <Bar dataKey="bonus" fill="var(--color-primary)" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Net Wins (W − L)">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  {axes()}
                  <Tooltip {...tooltipProps} />
                  <Line type="monotone" dataKey="net" stroke="var(--color-win)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive animationDuration={800} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        ) : (
          <EmptyChart text="Archive at least 2 sessions to see progress charts." />
        )}
      </section>
    </div>
  );
}

const tooltipProps = {
  contentStyle: {
    background: "oklch(0.19 0.025 250)",
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    fontFamily: "var(--font-display)",
    fontSize: 12,
  },
  labelStyle: { color: "var(--color-muted-foreground)" },
};

function axes() {
  return (
    <>
      <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" opacity={0.4} />
      <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
      <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={40} />
    </>
  );
}

function SectionTitle({ children, noMargin }: { children: React.ReactNode; noMargin?: boolean }) {
  return (
    <h2 className={`font-display text-sm uppercase tracking-[0.35em] text-muted-foreground ${noMargin ? "" : "mb-3"}`}>
      {children}
    </h2>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
  large,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "win" | "loss";
  large?: boolean;
}) {
  const color =
    tone === "win"
      ? "text-[color:var(--color-win)]"
      : tone === "loss"
        ? "text-[color:var(--color-loss)]"
        : "text-foreground";
  return (
    <div className="panel clip-notch group flex flex-col gap-2 p-4 transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        {icon && <span className="text-primary/70 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}
      </div>
      <div className={`font-display font-bold tabular-nums ${large ? "text-2xl" : "text-3xl"} ${color}`}>
        {value}
      </div>
    </div>
  );
}

function PBCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="panel clip-notch p-5">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold text-primary">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel clip-notch p-5">
      <div className="mb-3 font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="panel clip-notch p-10 text-center text-sm text-muted-foreground">{text}</div>
  );
}