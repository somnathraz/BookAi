"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, User, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { fileToResizedDataUrl } from "@/lib/image";

export function PhotoUpload({
  value,
  onChange,
  label = "Add your photo",
  hint = "A headshot or logo makes the site feel personal. Optional.",
  className,
}: {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
  hint?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const { dataUrl } = await fileToResizedDataUrl(file);
      onChange(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that image.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-3 sm:gap-4", className)}>
      <div className="relative size-16 shrink-0 overflow-hidden rounded-full border bg-card">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <User className="size-7" strokeWidth={1.5} />
          </div>
        )}
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove photo"
            className="absolute right-0 top-0 flex size-5 items-center justify-center rounded-full bg-foreground text-background"
          >
            <X className="size-3" />
          </button>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="flex w-fit max-w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin" />
          ) : (
            <ImagePlus className="size-4 shrink-0" />
          )}
          <span className="truncate">{value ? "Replace photo" : label}</span>
        </button>
        <span className="break-words text-xs text-muted-foreground">
          {error ? <span className="text-destructive">{error}</span> : hint}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
