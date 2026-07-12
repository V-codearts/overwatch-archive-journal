import { useEffect, useRef } from "react";

interface Props {
  html: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichNotes({ html, onChange, placeholder, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const lastRef = useRef<string>(html);

  useEffect(() => {
    if (ref.current && html !== lastRef.current) {
      ref.current.innerHTML = html || "";
      lastRef.current = html || "";
      updateEmpty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  const updateEmpty = () => {
    if (!ref.current) return;
    const empty = ref.current.textContent?.trim() === "" && !ref.current.querySelector("img");
    ref.current.dataset.empty = empty ? "true" : "false";
  };

  const commit = () => {
    if (!ref.current) return;
    const val = ref.current.innerHTML;
    lastRef.current = val;
    onChange(val);
    updateEmpty();
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const dataUrl = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(file);
        });
        document.execCommand("insertHTML", false, `<img src="${dataUrl}" alt="pasted"/>`);
        commit();
        return;
      }
    }
    // Plain text paste: strip formatting
    const text = e.clipboardData.getData("text/plain");
    if (text) {
      e.preventDefault();
      document.execCommand("insertText", false, text);
      commit();
    }
  };

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={commit}
      onBlur={commit}
      onPaste={handlePaste}
      data-placeholder={placeholder || "Start writing…"}
      data-empty="true"
      className={`rich-notes min-h-[400px] whitespace-pre-wrap break-words rounded-2xl border border-border/60 bg-card/40 p-6 text-base leading-relaxed text-foreground outline-none focus:border-primary/40 ${className || ""}`}
    />
  );
}