"use client";

import { useRef, useState } from "react";
import { Download, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { applyBackup, downloadBackup, exportBackup, readBackupFile } from "@/lib/backup";

export function BackupModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingInfo, setPendingInfo] = useState<{
    currentDate: string;
    historyCount: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const blob = await exportBackup();
      downloadBackup(blob);
      setStatus({ type: "success", message: "Backup downloaded." });
    } catch {
      setStatus({ type: "error", message: "Export failed." });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus({ type: "idle", message: "" });
    try {
      const backup = await readBackupFile(file);
      setPendingFile(file);
      setPendingInfo({
        currentDate: backup.current.date || "unsaved current session",
        historyCount: backup.history.length,
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Could not read backup.",
      });
    }
  };

  const confirmImport = async () => {
    if (!pendingFile) return;
    try {
      const backup = await readBackupFile(pendingFile);
      await applyBackup(backup);
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Restore failed.",
      });
    }
  };

  const cancelImport = () => {
    setPendingFile(null);
    setPendingInfo(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Backup</DialogTitle>
          <DialogDescription>Export or restore your journal data.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <Button onClick={handleExport} className="w-full gap-2">
            <Download className="h-4 w-4" />
            Export backup
          </Button>

          <div className="relative">
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileSelect}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <Button variant="outline" className="w-full gap-2" asChild>
              <span>
                <Upload className="h-4 w-4" />
                Import backup
              </span>
            </Button>
          </div>

          {pendingInfo && (
            <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
              <p className="mb-2">Restore backup?</p>
              <p className="text-muted-foreground">
                Current session: {pendingInfo.currentDate}
              </p>
              <p className="text-muted-foreground">
                History entries: {pendingInfo.historyCount}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                This will replace all local data.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="flex-1" onClick={confirmImport}>
                  Restore
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={cancelImport}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {status.type !== "idle" && !pendingInfo && (
            <div
              className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                status.type === "success"
                  ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                  : "border border-destructive/20 bg-destructive/10 text-destructive"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {status.message}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
