import { Minus, Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import type { RoleEntry } from "@/lib/types";
import { ROLE_PRESETS } from "@/lib/types";
import { RANK_OPTIONS, rankDelta } from "@/lib/ranks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatedCounter } from "./AnimatedCounter";
import { signed } from "@/lib/format";

interface Props {
  role: RoleEntry;
  onChange: (patch: Partial<RoleEntry>) => void;
  onRemove?: () => void;
}

export function RoleCard({ role, onChange, onRemove }: Props) {
  const games = role.wins + role.losses;
  const wr = games > 0 ? Math.round((role.wins / games) * 100) : 0;
  const delta = rankDelta(role.startingRank, role.currentRank);

  return (
    <div className="panel clip-notch animate-slide-up flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={role.role} onValueChange={(v) => onChange({ role: v })}>
          <SelectTrigger className="h-10 w-[160px] border-primary/30 bg-secondary/60 font-display uppercase tracking-wider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_PRESETS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-1 items-center gap-3">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Win Rate</div>
          <div className="font-display text-lg font-bold text-primary">
            <AnimatedCounter value={wr} suffix="%" />
          </div>
          <div className="text-xs text-muted-foreground">
            <AnimatedCounter value={games} /> games
          </div>
        </div>
        {onRemove && (
          <Button variant="ghost" size="icon" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Counter
          label="Wins"
          value={role.wins}
          onChange={(v) => onChange({ wins: v })}
          tone="win"
        />
        <Counter
          label="Losses"
          value={role.losses}
          onChange={(v) => onChange({ losses: v })}
          tone="loss"
        />
        <Counter
          label="Win Bonus"
          value={role.winBonus}
          onChange={(v) => onChange({ winBonus: v })}
          tone="win"
          allowNegative
        />
        <Counter
          label="Loss Bonus"
          value={role.lossBonus}
          onChange={(v) => onChange({ lossBonus: v })}
          tone="loss"
          allowNegative
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <RankSelect
          label="Starting Rank"
          value={role.startingRank}
          onChange={(v) => onChange({ startingRank: v })}
        />
        <div className="hidden items-end justify-center pb-2 sm:flex">
          {delta !== 0 ? (
            <div
              className={`flex items-center gap-1 font-display text-sm font-bold ${
                delta > 0 ? "text-[color:var(--color-win)]" : "text-[color:var(--color-loss)]"
              }`}
            >
              {delta > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {signed(delta)}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">→</div>
          )}
        </div>
        <RankSelect
          label="Current Rank"
          value={role.currentRank}
          onChange={(v) => onChange({ currentRank: v })}
        />
      </div>

      <Textarea
        placeholder="Role notes (optional)…"
        value={role.notes}
        onChange={(e) => onChange({ notes: e.target.value })}
        className="min-h-[70px] resize-none border-border/60 bg-secondary/40 text-sm"
      />
    </div>
  );
}

function Counter({
  label,
  value,
  onChange,
  tone,
  allowNegative,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  tone?: "win" | "loss";
  allowNegative?: boolean;
}) {
  const color =
    tone === "win" ? "text-[color:var(--color-win)]" : tone === "loss" ? "text-[color:var(--color-loss)]" : "";
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/40 p-3">
      <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 hover:bg-primary/10"
          onClick={() => onChange(allowNegative ? value - 1 : Math.max(0, value - 1))}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Input
          type="number"
          value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value || "0", 10);
            onChange(allowNegative ? n : Math.max(0, n || 0));
          }}
          className={`h-8 border-0 bg-transparent p-0 text-center font-display text-xl font-bold tabular-nums shadow-none focus-visible:ring-0 ${color}`}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 hover:bg-primary/10"
          onClick={() => onChange(value + 1)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function RankSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <Select value={value || "Unranked"} onValueChange={onChange}>
        <SelectTrigger className="h-10 border-border/60 bg-secondary/40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {RANK_OPTIONS.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}