import { db } from "./db";
import type { DaySession } from "./types";

const BACKUP_VERSION = 1;

export interface BackupFile {
  version: number;
  exportedAt: number;
  current: DaySession;
  history: DaySession[];
}

export async function exportBackup(): Promise<Blob> {
  const [current, history] = await Promise.all([db.getCurrent(), db.getHistory()]);
  const payload: BackupFile = {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    current: current ?? {
      id: "",
      date: "",
      createdAt: 0,
      roles: [],
      notesHtml: "",
      timer: { accumulatedMs: 0, runningSince: null },
    },
    history: history ?? [],
  };
  return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
}

export function downloadBackup(blob: Blob, filename?: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = filename ?? `owcj-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function isValidBackup(data: unknown): data is BackupFile {
  if (typeof data !== "object" || data === null) return false;
  const b = data as Partial<BackupFile>;
  if (typeof b.version !== "number") return false;
  if (typeof b.exportedAt !== "number") return false;
  if (!b.current || typeof b.current !== "object") return false;
  if (!Array.isArray(b.history)) return false;
  return true;
}

export async function readBackupFile(file: File): Promise<BackupFile> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file.");
  }
  if (!isValidBackup(parsed)) {
    throw new Error("Backup file is missing required fields.");
  }
  return parsed;
}

export async function applyBackup(backup: BackupFile) {
  await Promise.all([db.setCurrent(backup.current), db.setHistory(backup.history)]);
}
