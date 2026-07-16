import type {
  AnalysisResult,
  GeneratorInput,
  SiteData,
  ThemeMode,
} from "@/lib/types";
import type { SourceId } from "@/lib/types";

const STORAGE_KEY = "paperchai_studio_draft";
export const DRAFT_PREVIEW_STORAGE_KEY = "paperchai_draft_preview";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // keep import data for a week

export type DraftStep = "source" | "analysis" | "review" | "preview";

export interface StudioDraft {
  step: DraftStep;
  analysis: AnalysisResult | null;
  initialValues: Partial<GeneratorInput> | undefined;
  activeSource: Exclude<SourceId, "manual"> | null;
  savedAt: number;
}

export function saveStudioDraft(draft: Omit<StudioDraft, "savedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StudioDraft = { ...draft, savedAt: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function loadStudioDraft(): StudioDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as StudioDraft;
    if (!draft.savedAt || Date.now() - draft.savedAt > MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function clearStudioDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(DRAFT_PREVIEW_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function saveDraftSitePreview(site: SiteData, theme: ThemeMode): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      DRAFT_PREVIEW_STORAGE_KEY,
      JSON.stringify({ site, theme })
    );
  } catch {
    /* quota / private mode */
  }
}

export function loadDraftSitePreview(): {
  site: SiteData;
  theme: ThemeMode;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_PREVIEW_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { site: SiteData; theme: ThemeMode }) : null;
  } catch {
    return null;
  }
}
