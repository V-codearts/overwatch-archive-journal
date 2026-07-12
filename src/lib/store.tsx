import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { db } from "./db";
import type { DaySession, RoleEntry } from "./types";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function newRole(role = "Tank"): RoleEntry {
  return {
    id: uid(),
    role,
    wins: 0,
    losses: 0,
    winBonus: 0,
    lossBonus: 0,
    startingRank: "Unranked",
    currentRank: "Unranked",
    notes: "",
  };
}

export function newDay(): DaySession {
  return {
    id: uid(),
    date: todayISO(),
    createdAt: Date.now(),
    roles: [newRole("Tank")],
    notesHtml: "",
    timer: { accumulatedMs: 0, runningSince: null },
  };
}

interface Ctx {
  loaded: boolean;
  current: DaySession;
  history: DaySession[];
  updateCurrent: (fn: (d: DaySession) => DaySession) => void;
  updateHistory: (id: string, fn: (d: DaySession) => DaySession) => void;
  deleteHistory: (id: string) => void;
  archiveDay: (opts?: { rating?: number; ratingNote?: string }) => void;
  resetCurrent: () => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [current, setCurrent] = useState<DaySession>(() => newDay());
  const [history, setHistory] = useState<DaySession[]>([]);
  const saveCurRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveHisRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const [c, h] = await Promise.all([db.getCurrent(), db.getHistory()]);
      if (c) setCurrent(c);
      if (h) setHistory(h);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveCurRef.current) clearTimeout(saveCurRef.current);
    saveCurRef.current = setTimeout(() => db.setCurrent(current), 250);
  }, [current, loaded]);

  useEffect(() => {
    if (!loaded) return;
    if (saveHisRef.current) clearTimeout(saveHisRef.current);
    saveHisRef.current = setTimeout(() => db.setHistory(history), 250);
  }, [history, loaded]);

  const updateCurrent = useCallback((fn: (d: DaySession) => DaySession) => {
    setCurrent((prev) => fn(prev));
  }, []);

  const updateHistory = useCallback((id: string, fn: (d: DaySession) => DaySession) => {
    setHistory((prev) => prev.map((d) => (d.id === id ? fn(d) : d)));
  }, []);

  const deleteHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const archiveDay = useCallback(
    (opts?: { rating?: number; ratingNote?: string }) => {
      setCurrent((prev) => {
        const now = Date.now();
        const accumulated =
          prev.timer.accumulatedMs +
          (prev.timer.runningSince ? now - prev.timer.runningSince : 0);
        const archived: DaySession = {
          ...prev,
          archivedAt: now,
          rating: opts?.rating,
          ratingNote: opts?.ratingNote,
          timer: { accumulatedMs: accumulated, runningSince: null },
        };
        // Guard against StrictMode double-invocation of the setState updater
        // duplicating the archived entry in history.
        setHistory((h) => (h.some((d) => d.id === archived.id) ? h : [archived, ...h]));
        return newDay();
      });
    },
    [],
  );

  const resetCurrent = useCallback(() => setCurrent(newDay()), []);

  const value = useMemo<Ctx>(
    () => ({
      loaded,
      current,
      history,
      updateCurrent,
      updateHistory,
      deleteHistory,
      archiveDay,
      resetCurrent,
    }),
    [loaded, current, history, updateCurrent, updateHistory, deleteHistory, archiveDay, resetCurrent],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

// Live timer hook: computes total ms including running portion, updates each second.
export function useLiveTimer(timer: { accumulatedMs: number; runningSince: number | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!timer.runningSince) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer.runningSince]);
  const total = timer.accumulatedMs + (timer.runningSince ? now - timer.runningSince : 0);
  return total;
}