import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Archive, Clock, Trash2, Pencil, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { useStore, newRole } from "@/lib/store";
import type { DaySession, RoleEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { formatDate, formatDuration, signed } from "@/lib/format";
import { formatRank } from "@/lib/ranks";
import { RoleCard } from "@/components/RoleCard";
import { RichNotes } from "@/components/RichNotes";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — Overwatch Competitive Journal" },
      { name: "description", content: "Browse and edit every archived competitive session." },
    ],
  }),
  component: HistoryPage,
});

function dayTotals(d: DaySession) {
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

function HistoryPage() {
  const { history, updateHistory, deleteHistory } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = useMemo(() => history.find((h) => h.id === openId) || null, [history, openId]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 font-display text-xs uppercase tracking-[0.35em] text-primary">
          <Archive className="h-4 w-4" /> History
        </div>
        <h1 className="font-display text-3xl font-bold tracking-wide">Archived Sessions</h1>
      </div>

      {history.length === 0 ? (
        <div className="panel clip-notch p-12 text-center">
          <Archive className="mx-auto h-10 w-10 text-muted-foreground" />
          <div className="mt-3 font-display text-lg">No archived sessions yet</div>
          <p className="text-sm text-muted-foreground">Archive a day from the Dashboard to see it here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {history.map((d) => {
            const t = dayTotals(d);
            const first = d.roles[0];
            return (
              <button
                key={d.id}
                onClick={() => setOpenId(d.id)}
                className="panel clip-notch group animate-slide-up cursor-pointer p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_0_40px_var(--color-glow)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      {formatDate(d.date)}
                    </div>
                    <div className="mt-1 flex items-baseline gap-2 font-display tabular-nums">
                      <span className="text-3xl font-bold text-[color:var(--color-win)]">{t.wins}</span>
                      <span className="text-2xl text-muted-foreground">–</span>
                      <span className="text-3xl font-bold text-[color:var(--color-loss)]">{t.losses}</span>
                      <span className={`text-lg ${t.winBonus >= 0 ? "text-[color:var(--color-win)]" : "text-[color:var(--color-loss)]"}`}>
                        {signed(t.winBonus)}
                      </span>
                      <span className={`text-lg ${t.lossBonus >= 0 ? "text-[color:var(--color-win)]" : "text-[color:var(--color-loss)]"}`}>
                        {signed(t.lossBonus)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(d.timer.accumulatedMs, { compact: true })}
                  </div>
                </div>
                {first && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    {d.roles.map((r) => (
                      <span key={r.id} className="rounded-md border border-border/60 bg-secondary/50 px-2 py-1 uppercase tracking-wider text-muted-foreground">
                        <span className="text-foreground">{r.role}</span> {formatRank(r.startingRank)} → <span className="text-primary">{formatRank(r.currentRank)}</span>
                      </span>
                    ))}
                  </div>
                )}
                {(d.rating || d.ratingNote) && (
                  <div className="mt-3 flex items-start gap-2 border-t border-border/40 pt-3 text-xs">
                    {d.rating ? (
                      <div className="flex shrink-0 items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`h-3.5 w-3.5 ${
                              n <= (d.rating || 0)
                                ? "fill-primary text-primary"
                                : "text-muted-foreground/40"
                            }`}
                          />
                        ))}
                      </div>
                    ) : null}
                    {d.ratingNote && (
                      <p className="line-clamp-2 italic text-muted-foreground">"{d.ratingNote}"</p>
                    )}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-end gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  <Pencil className="h-3 w-3" /> Edit
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {open && (
            <EditSession
              day={open}
              onPatch={(fn) => updateHistory(open.id, fn)}
              onDelete={() => {
                deleteHistory(open.id);
                setOpenId(null);
                toast.success("Session deleted");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditSession({
  day,
  onPatch,
  onDelete,
}: {
  day: DaySession;
  onPatch: (fn: (d: DaySession) => DaySession) => void;
  onDelete: () => void;
}) {
  const patchRole = (id: string, patch: Partial<RoleEntry>) =>
    onPatch((d) => ({ ...d, roles: d.roles.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const addRole = () => onPatch((d) => ({ ...d, roles: [...d.roles, newRole("Damage")] }));
  const removeRole = (id: string) => onPatch((d) => ({ ...d, roles: d.roles.filter((r) => r.id !== id) }));

  const setTimerMinutes = (mins: number) =>
    onPatch((d) => ({ ...d, timer: { accumulatedMs: Math.max(0, mins) * 60_000, runningSince: null } }));

  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle className="font-display text-2xl tracking-wide">{formatDate(day.date)}</DialogTitle>
      </DialogHeader>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Date
          </label>
          <Input
            type="date"
            value={day.date}
            onChange={(e) => onPatch((d) => ({ ...d, date: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Playtime (min)
          </label>
          <Input
            type="number"
            min={0}
            value={Math.round(day.timer.accumulatedMs / 60000)}
            onChange={(e) => setTimerMinutes(parseInt(e.target.value || "0", 10))}
            className="w-28"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">Roles</div>
        <Button size="sm" variant="outline" onClick={addRole} className="border-primary/40 text-primary">
          <Plus className="mr-1 h-3.5 w-3.5" /> Add
        </Button>
      </div>
      <div className="space-y-3">
        {day.roles.map((r) => (
          <RoleCard
            key={r.id}
            role={r}
            onChange={(patch) => patchRole(r.id, patch)}
            onRemove={day.roles.length > 1 ? () => removeRole(r.id) : undefined}
          />
        ))}
      </div>

      <div>
        <div className="mb-2 font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">Notes</div>
        <RichNotes
          html={day.notesHtml}
          onChange={(html) => onPatch((d) => ({ ...d, notesHtml: html }))}
          placeholder="Add notes for this session…"
          className="min-h-[200px]"
        />
      </div>

      <DialogFooter className="!justify-between">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="text-destructive hover:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" /> Delete session
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this session?</AlertDialogTitle>
              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogFooter>
    </div>
  );
}