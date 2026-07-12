import { createFileRoute } from "@tanstack/react-router";
import { StickyNote, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { RichNotes } from "@/components/RichNotes";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Session Notes — Overwatch Competitive Journal" },
      { name: "description", content: "Write notes, paste screenshots, capture ideas during your competitive session." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { current, updateCurrent } = useStore();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!current.notesHtml) return;
    const id = setTimeout(() => setSavedAt(Date.now()), 300);
    return () => clearTimeout(id);
  }, [current.notesHtml]);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 font-display text-xs uppercase tracking-[0.35em] text-primary">
            <StickyNote className="h-4 w-4" /> Session Notes
          </div>
          <h1 className="font-display text-3xl font-bold tracking-wide">Notes</h1>
        </div>
        {savedAt && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-[color:var(--color-win)]" /> Saved
          </div>
        )}
      </div>
      <RichNotes
        html={current.notesHtml}
        onChange={(html) => updateCurrent((d) => ({ ...d, notesHtml: html }))}
        placeholder=""
        className="min-h-[60vh]"
      />
    </div>
  );
}