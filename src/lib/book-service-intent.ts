/** Cross-section intent: service card → booking form with that service selected. */

export const BOOK_SERVICE_EVENT = "paperchai:book-service";

export interface BookServiceDetail {
  service: string;
}

export function requestBookService(serviceTitle: string): void {
  if (typeof window === "undefined") return;
  const title = serviceTitle.trim();
  if (!title) return;

  const url = new URL(window.location.href);
  url.searchParams.set("service", title);
  url.hash = "booking";
  window.history.replaceState(
    {},
    "",
    `${url.pathname}${url.search}${url.hash}`
  );
  window.dispatchEvent(
    new CustomEvent<BookServiceDetail>(BOOK_SERVICE_EVENT, {
      detail: { service: title },
    })
  );
  document.getElementById("booking")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export function readBookServiceFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const value = new URL(window.location.href).searchParams.get("service");
  const trimmed = value?.trim();
  return trimmed || null;
}
