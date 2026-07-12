// Minimal IndexedDB wrapper with localStorage fallback.
import type { DaySession } from "./types";

const DB_NAME = "owcj";
const STORE = "kv";
const KEY_CURRENT = "currentDay";
const KEY_HISTORY = "history";

let dbPromise: Promise<IDBDatabase> | null = null;
function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  try {
    const db = await openDb();
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    const raw = localStorage.getItem(`owcj:${key}`);
    return raw ? (JSON.parse(raw) as T) : undefined;
  }
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    localStorage.setItem(`owcj:${key}`, JSON.stringify(value));
  }
}

export const db = {
  getCurrent: () => idbGet<DaySession>(KEY_CURRENT),
  setCurrent: (d: DaySession) => idbSet(KEY_CURRENT, d),
  getHistory: () => idbGet<DaySession[]>(KEY_HISTORY),
  setHistory: (h: DaySession[]) => idbSet(KEY_HISTORY, h),
};