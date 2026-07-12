import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Archive, Sword, Skull, Star } from "lucide-react";
import { toast } from "sonner";
import { newRole, useStore } from "@/lib/store";
import type { RoleEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { signed, formatDate, formatClock } from "@/lib/format";

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
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingNote, setRatingNote] = useState("");

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
    archiveDay({ rating: rating || undefined, ratingNote: ratingNote.trim() || undefined });
    setArchiveOpen(false);
    setRating(0);
    setRatingNote("");
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
            <div className="font-display text-4xl font-bold tabular-nums tracking-wider text-foreground sm:text-5xl">
              {formatClock(now)}
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
            <span className="font-display uppercase tracking-widest">Win</span>
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
            <span className="font-display uppercase tracking-widest">Loss</span>
          </Button>
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
      <div className="panel clip-notch flex items-center justify-center p-6 sm:p-8">
        <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
          <AlertDialogTrigger asChild>
            <Button size="lg" className="bg-primary text-primary-foreground shadow-[0_0_30px_var(--color-glow)] hover:bg-primary/90">
              <Archive className="mr-2 h-4 w-4" /> Archive Day
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rate & archive this session</AlertDialogTitle>
              <AlertDialogDescription>
                Give this session a personal rating and a few words before it's saved to History. A fresh day begins immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <div className="mb-2 font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Rating
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n === rating ? 0 : n)}
                      className="rounded p-1 transition-transform hover:scale-110"
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`h-7 w-7 ${
                          n <= rating
                            ? "fill-primary text-primary drop-shadow-[0_0_8px_var(--color-glow)]"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 font-display text-sm tabular-nums text-muted-foreground">
                      {rating} / 5
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="mb-2 font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  A few words
                </div>
                <Textarea
                  value={ratingNote}
                  onChange={(e) => setRatingNote(e.target.value)}
                  placeholder="How did the session feel?"
                  maxLength={200}
                  rows={3}
                />
              </div>
            </div>
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
