import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trophy, Archive, Sword, Skull } from "lucide-react";
import { toast } from "sonner";
import { newRole, useStore } from "@/lib/store";
import type { RoleEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Timer } from "@/components/Timer";
import { RoleCard } from "@/components/RoleCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { signed, formatDate } from "@/lib/format";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Dashboard() {
  const { current, updateCurrent, archiveDay } = useStore();
  const now = useLiveClock();

  const totals = current.roles.reduce(
    (acc, r) => {
      acc.wins += r.wins;
      acc.losses += r.losses;
      acc.winBonus += r.winBonus;
      acc.lossBonus += r.lossBonus;
      return acc;
    },
    { wins: 0, losses: 0, winBonus: 0, lossBonus: 0 },
  );

  const patchRole = (id: string, patch: Partial<RoleEntry>) =>
    updateCurrent((d) => ({
      ...d,
      roles: d.roles.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));

  const addRole = () =>
    updateCurrent((d) => ({ ...d, roles: [...d.roles, newRole("Damage")] }));

  const removeRole = (id: string) =>
    updateCurrent((d) => ({ ...d, roles: d.roles.filter((r) => r.id !== id) }));

  const handleArchive = () => {
    archiveDay();
    toast.success("Day archived. New session started.");
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="panel clip-notch flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <div className="font-display text-xs uppercase tracking-[0.35em] text-primary">
              Active Session
            </div>
            <div className="mt-1 font-display text-2xl font-bold tracking-wide text-foreground sm:text-3xl">
              {formatDate(current.date)}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Local Time
            </div>
            <div className="font-display text-4xl font-bold tabular-nums text-foreground sm:text-5xl">
              {now.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          </div>
        </div>
        <Timer />
      </div>

      {/* Daily record */}
      <div className="panel clip-notch relative overflow-hidden p-6 sm:p-10">
        <div className="absolute inset-0 -z-10 opacity-40" style={{
          background:
            "radial-gradient(600px 200px at 50% 0%, var(--color-glow), transparent 70%)",
        }} />
        <div className="mb-4 text-center font-display text-xs uppercase tracking-[0.4em] text-muted-foreground">
          Daily Record
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-display font-bold tabular-nums">
          <span className="text-6xl text-[color:var(--color-win)] drop-shadow-[0_0_20px_rgba(140,220,140,0.35)] sm:text-8xl">
            <AnimatedCounter value={totals.wins} />
          </span>
          <span className="text-5xl text-muted-foreground sm:text-7xl">–</span>
          <span className="text-6xl text-[color:var(--color-loss)] drop-shadow-[0_0_20px_rgba(240,120,100,0.35)] sm:text-8xl">
            <AnimatedCounter value={totals.losses} />
          </span>
          <span
            className={`ml-2 text-3xl sm:text-4xl ${
              totals.winBonus >= 0 ? "text-[color:var(--color-win)]" : "text-[color:var(--color-loss)]"
            }`}
          >
            {signed(totals.winBonus)}
          </span>
          <span
            className={`text-3xl sm:text-4xl ${
              totals.lossBonus >= 0 ? "text-[color:var(--color-win)]" : "text-[color:var(--color-loss)]"
            }`}
          >
            {signed(totals.lossBonus)}
          </span>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Button
            size="lg"
            className="bg-[color:var(--color-win)] text-background hover:brightness-110"
            onClick={() =>
              patchRole(current.roles[0].id, { wins: current.roles[0].wins + 1 })
            }
          >
            <Sword className="mr-2 h-5 w-5" />
            Win
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="bg-[color:var(--color-loss)]/90 text-background hover:brightness-110"
            onClick={() =>
              patchRole(current.roles[0].id, { losses: current.roles[0].losses + 1 })
            }
          >
            <Skull className="mr-2 h-5 w-5" />
            Loss
          </Button>
        </div>
        <div className="mt-3 text-center text-xs text-muted-foreground">
          Quick buttons record to <span className="text-foreground">{current.roles[0]?.role}</span>. Edit any role below.
        </div>
      </div>

      {/* Roles */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg uppercase tracking-[0.25em] text-muted-foreground">
          Roles Played
        </h2>
        <Button onClick={addRole} variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
          <Plus className="mr-2 h-4 w-4" /> Add Role
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {current.roles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            onChange={(patch) => patchRole(role.id, patch)}
            onRemove={current.roles.length > 1 ? () => removeRole(role.id) : undefined}
          />
        ))}
      </div>

      {/* Archive */}
      <div className="panel clip-notch flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-between sm:p-8">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <Trophy className="h-5 w-5 text-primary" />
            Ready to end the day?
          </div>
          <p className="text-sm text-muted-foreground">
            Archive this session to your History. A fresh day begins immediately.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="lg" className="bg-primary text-primary-foreground shadow-[0_0_30px_var(--color-glow)] hover:bg-primary/90">
              <Archive className="mr-2 h-4 w-4" /> Archive Day
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive this session?</AlertDialogTitle>
              <AlertDialogDescription>
                Your current day, roles, notes and timer will be saved to History and a new empty day will begin. Archived data remains editable.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
