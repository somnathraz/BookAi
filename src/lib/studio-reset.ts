/** Landing URL that always starts (or restarts) the site builder. */
export const STUDIO_CREATE_HREF = "/?new=1";

export const STUDIO_RESET_EVENT = "paperchai:studio-reset";

export function dispatchStudioReset(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(STUDIO_RESET_EVENT));
}
