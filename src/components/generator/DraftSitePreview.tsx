"use client";

import { useEffect, useState } from "react";

import { GeneratedSite } from "@/components/generated/GeneratedSite";
import { loadDraftSitePreview } from "@/lib/studio-draft";
import type { SiteData, ThemeMode } from "@/lib/types";

export function DraftSitePreview() {
  const [site, setSite] = useState<SiteData | null>(null);
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const draft = loadDraftSitePreview();
    if (!draft) return;
    // The iframe is a separate document and must hydrate from the parent tab's
    // session draft before it can render the real responsive site.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSite(draft.site);
    setTheme(draft.theme);
  }, []);

  if (!site) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f3ef] px-6 text-center text-sm text-stone-500">
        Preparing mobile preview…
      </div>
    );
  }

  return (
    <GeneratedSite
      site={site}
      theme={theme}
      onThemeChange={(nextTheme) => {
        setTheme(nextTheme);
        window.parent.postMessage(
          { type: "paperchai-preview-theme", theme: nextTheme },
          window.location.origin
        );
      }}
    />
  );
}
