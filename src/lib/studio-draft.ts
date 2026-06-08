import type { AnalysisResult, GeneratorInput } from "@/lib/types";
import type { SourceId } from "@/lib/types";

const STORAGE_KEY = "paperchai_studio_draft";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // keep import data for a week

export type DraftStep = "source" | "analysis" | "review";

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
  } catch {
    /* ignore */
  }
}
