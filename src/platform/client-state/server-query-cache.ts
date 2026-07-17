"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type ServerQueryStatus = "idle" | "loading" | "success" | "error";

export interface ServerQuerySnapshot<T> {
  readonly data: T | undefined;
  readonly error: unknown;
  readonly status: ServerQueryStatus;
  readonly isRefreshing: boolean;
  readonly updatedAt: number | undefined;
}

interface ServerQueryEntry<T> extends ServerQuerySnapshot<T> {
  inFlight: Promise<T> | undefined;
}

interface FetchOptions {
  readonly force?: boolean;
  readonly staleTimeMs: number;
}

const emptySnapshot: ServerQuerySnapshot<never> = {
  data: undefined,
  error: undefined,
  status: "idle",
  isRefreshing: false,
  updatedAt: undefined,
};

const entries = new Map<string, ServerQueryEntry<unknown>>();
const listeners = new Map<string, Set<() => void>>();

function notify(key: string): void {
  listeners.get(key)?.forEach((listener) => listener());
}

function currentEntry<T>(key: string): ServerQueryEntry<T> | undefined {
  return entries.get(key) as ServerQueryEntry<T> | undefined;
}

function isFresh(entry: ServerQueryEntry<unknown> | undefined, staleTimeMs: number): boolean {
  return Boolean(entry?.updatedAt && Date.now() - entry.updatedAt < staleTimeMs);
}

export function getServerQuerySnapshot<T>(key: string): ServerQuerySnapshot<T> {
  return currentEntry<T>(key) ?? (emptySnapshot as ServerQuerySnapshot<T>);
}

export function subscribeToServerQuery(key: string, listener: () => void): () => void {
  const keyListeners = listeners.get(key) ?? new Set<() => void>();
  keyListeners.add(listener);
  listeners.set(key, keyListeners);

  return () => {
    keyListeners.delete(listener);
    if (keyListeners.size === 0) listeners.delete(key);
  };
}

export async function fetchServerQuery<T>(
  key: string,
  load: () => Promise<T>,
  options: FetchOptions
): Promise<T> {
  const existing = currentEntry<T>(key);
  if (!options.force && isFresh(existing, options.staleTimeMs) && existing?.data !== undefined) {
    return existing.data;
  }
  if (existing?.inFlight) return existing.inFlight;

  const pending: ServerQueryEntry<T> = {
    data: existing?.data,
    error: undefined,
    status: existing?.data === undefined ? "loading" : "success",
    isRefreshing: existing?.data !== undefined,
    updatedAt: existing?.updatedAt,
    inFlight: undefined,
  };

  const inFlight = load()
    .then((data) => {
      entries.set(key, {
        data,
        error: undefined,
        status: "success",
        isRefreshing: false,
        updatedAt: Date.now(),
        inFlight: undefined,
      });
      notify(key);
      return data;
    })
    .catch((error: unknown) => {
      const previous = currentEntry<T>(key);
      entries.set(key, {
        data: previous?.data,
        error,
        status: previous?.data === undefined ? "error" : "success",
        isRefreshing: false,
        updatedAt: previous?.updatedAt,
        inFlight: undefined,
      });
      notify(key);
      throw error;
    });

  pending.inFlight = inFlight;
  entries.set(key, pending as ServerQueryEntry<unknown>);
  notify(key);
  return inFlight;
}

export function setServerQueryData<T>(key: string, data: T): void {
  entries.set(key, {
    data,
    error: undefined,
    status: "success",
    isRefreshing: false,
    updatedAt: Date.now(),
    inFlight: undefined,
  });
  notify(key);
}

export function invalidateServerQueries(prefixes: readonly string[]): void {
  for (const key of entries.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      entries.delete(key);
      notify(key);
    }
  }
}

export function useServerQuery<T>(
  key: string,
  load: () => Promise<T>,
  options: { readonly staleTimeMs?: number } = {}
): ServerQuerySnapshot<T> & { readonly refresh: () => Promise<T> } {
  const staleTimeMs = options.staleTimeMs ?? 30_000;
  const subscribe = useCallback(
    (listener: () => void) => subscribeToServerQuery(key, listener),
    [key]
  );
  const getSnapshot = useCallback(() => getServerQuerySnapshot<T>(key), [key]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    void fetchServerQuery(key, load, { staleTimeMs }).catch(() => undefined);
  }, [key, load, staleTimeMs]);

  const refresh = useCallback(
    () => fetchServerQuery(key, load, { force: true, staleTimeMs }),
    [key, load, staleTimeMs]
  );

  return { ...snapshot, refresh };
}
