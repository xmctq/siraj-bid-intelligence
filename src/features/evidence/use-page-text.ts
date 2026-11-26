"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

export type PageTextState = { status: "idle" | "loading" } | { status: "error"; message: string } | { status: "ready"; text: string };

const cache = new Map<string, string>();

/** Loads (and caches per session) the extracted text of one tender page. */
export function usePageText(tenderId: string | null, page: number | null): PageTextState & { retry: () => void } {
  const key = tenderId && page ? `${tenderId}:${page}` : null;
  const [result, setResult] = useState<{ key: string; state: PageTextState } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!key || cache.has(key)) return;
    let cancelled = false;
    apiFetch<{ text: string }>(`/api/tenders/${tenderId}/pages/${page}`)
      .then(({ text }) => {
        cache.set(key, text);
        if (!cancelled) setResult({ key, state: { status: "ready", text } });
      })
      .catch((error: Error) => !cancelled && setResult({ key, state: { status: "error", message: error.message } }));
    return () => {
      cancelled = true;
    };
  }, [key, tenderId, page, attempt]);

  const retry = () => {
    setResult(null);
    setAttempt((n) => n + 1);
  };

  if (!key) return { status: "idle", retry };
  const cached = cache.get(key);
  if (cached !== undefined) return { status: "ready", text: cached, retry };
  if (result?.key === key) return { ...result.state, retry };
  return { status: "loading", retry };
}
