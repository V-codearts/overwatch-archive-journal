import { Play, Pause, RotateCcw } from "lucide-react";
import { useStore, useLiveTimer } from "@/lib/store";
import { formatDuration } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function Timer() {
  const { current, updateCurrent } = useStore();
  const total = useLiveTimer(current.timer);
  const running = current.timer.runningSince != null;

  const start = () =>
    updateCurrent((d) => ({ ...d, timer: { ...d.timer, runningSince: Date.now() } }));
  const pause = () =>
    updateCurrent((d) => {
      if (!d.timer.runningSince) return d;
      const acc = d.timer.accumulatedMs + (Date.now() - d.timer.runningSince);
      return { ...d, timer: { accumulatedMs: acc, runningSince: null } };
    });
  const reset = () => updateCurrent((d) => ({ ...d, timer: { accumulatedMs: 0, runningSince: null } }));

  return (
    <div className="panel clip-notch flex flex-col items-center gap-4 p-6 sm:p-8">
      <div className="font-display text-xs uppercase tracking-[0.35em] text-muted-foreground">
        Session Timer
      </div>
      <div
        className={`font-display text-5xl font-bold tabular-nums tracking-wider sm:text-6xl ${
          running ? "text-primary" : "text-foreground"
        }`}
      >
        {formatDuration(total)}
      </div>
      <div className="flex items-center gap-2">
        {!running ? (
          <Button
            onClick={start}
            className="animate-pulse-glow bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Play className="mr-2 h-4 w-4" />
            {current.timer.accumulatedMs > 0 ? "Resume" : "Start"}
          </Button>
        ) : (
          <Button
            onClick={pause}
            variant="secondary"
            className="border border-primary/30"
          >
            <Pause className="mr-2 h-4 w-4" />
            Pause
          </Button>
        )}
        <Button variant="ghost" onClick={reset} className="text-muted-foreground">
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}