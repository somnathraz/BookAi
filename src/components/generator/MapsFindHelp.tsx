"use client";

import { ClipboardPaste, ExternalLink, Monitor, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

import {
  MAPS_FIND_DESKTOP_STEPS,
  MAPS_FIND_MOBILE_STEPS,
  isLikelyMobileDevice,
  openGoogleMapsSearch,
} from "@/lib/maps-find-business";

type DeviceTab = "mobile" | "desktop";

export function MapsFindHelp({
  query,
  notFoundNotice = false,
  onOpenedMaps,
  onPasteReady,
}: {
  query: string;
  /** Show “couldn’t find” banner after a failed search. */
  notFoundNotice?: boolean;
  onOpenedMaps?: () => void;
  onPasteReady?: () => void;
}) {
  const [tab, setTab] = useState<DeviceTab>("mobile");

  useEffect(() => {
    setTab(isLikelyMobileDevice() ? "mobile" : "desktop");
  }, []);

  const steps = tab === "mobile" ? MAPS_FIND_MOBILE_STEPS : MAPS_FIND_DESKTOP_STEPS;
  const openLabel =
    tab === "mobile" ? "Open Google Maps app" : "Open Google Maps";

  function handleOpenMaps() {
    onOpenedMaps?.();
    openGoogleMapsSearch(query);
  }

  return (
    <div className="space-y-4">
      {notFoundNotice ? (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-3 text-sm text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100">
          <p className="font-semibold">We couldn’t find that business here</p>
          <p className="mt-1 text-xs leading-5 text-amber-900/80 dark:text-amber-100/75">
            No problem — open Google Maps, copy the Share link from your listing,
            then paste it back.
          </p>
        </div>
      ) : null}

      <div>
        <p className="font-semibold text-stone-950 dark:text-stone-50">
          Exact steps to find it in Maps
        </p>
        <p className="mt-1 text-sm leading-6 text-stone-500 dark:text-stone-400">
          Use the Share link from your business listing (maps.app.goo.gl/…).
        </p>
      </div>

      <div className="flex rounded-xl border border-stone-900/10 p-1 dark:border-white/10">
        {(["mobile", "desktop"] as const).map((next) => (
          <button
            key={next}
            type="button"
            onClick={() => setTab(next)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
              tab === next
                ? "bg-[#214f43] text-white dark:bg-[#9cc2b3] dark:text-[#0d0f0d]"
                : "text-stone-500 hover:text-stone-950 dark:text-stone-400 dark:hover:text-white"
            }`}
          >
            {next === "mobile" ? (
              <Smartphone className="size-3.5" />
            ) : (
              <Monitor className="size-3.5" />
            )}
            {next === "mobile" ? "Phone / Maps app" : "Desktop browser"}
          </button>
        ))}
      </div>

      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-stone-950 text-xs font-semibold text-white dark:bg-stone-100 dark:text-stone-950">
              {index + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-stone-950 dark:text-stone-50">
                {step.title}
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-stone-500 dark:text-stone-400">
                {step.detail}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleOpenMaps}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#214f43] px-5 text-sm font-semibold text-white transition hover:bg-[#173b32]"
        >
          {openLabel}
          <ExternalLink className="size-4" />
        </button>
        {onPasteReady ? (
          <button
            type="button"
            onClick={onPasteReady}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-stone-900/15 px-5 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 dark:border-white/15 dark:text-stone-200 dark:hover:bg-white/[0.06]"
          >
            <ClipboardPaste className="size-4" />
            Paste copied link
          </button>
        ) : null}
      </div>
    </div>
  );
}
