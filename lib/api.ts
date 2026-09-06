/**
 * Client for the Stellar Stream Hive indexer/registry API
 * (https://github.com/Stellar-Hive/stellar-stream-hive-api).
 *
 * This service indexes on-chain stream events so the UI can list "streams
 * I'm sending" / "streams I'm receiving" and show platform-wide stats
 * without scanning the whole ledger from the browser.
 *
 * NEXT_PUBLIC_API_BASE_URL is optional. When it is not configured (e.g.
 * during early development before the API is deployed), every function here
 * resolves to `null` / an empty list rather than throwing, so pages can show
 * a graceful loading/empty state instead of fabricating data.
 */
import type { PlatformStats, Stream } from "@/types";

function apiBaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  return url && url.trim() !== "" ? url.replace(/\/$/, "") : null;
}

export function isApiConfigured(): boolean {
  return apiBaseUrl() !== null;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const base = apiBaseUrl();
  if (!base) return null;

  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: { Accept: "application/json", ...(init?.headers || {}) },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Fetches platform-wide stats for the landing page. Returns null if the API is unreachable/unconfigured. */
export async function fetchPlatformStats(): Promise<PlatformStats | null> {
  return apiFetch<PlatformStats>("/v1/stats");
}

/** Fetches streams where `address` is the sender. */
export async function fetchStreamsBySender(address: string): Promise<Stream[]> {
  const result = await apiFetch<Stream[]>(`/v1/streams?sender=${encodeURIComponent(address)}`);
  return result ?? [];
}

/** Fetches streams where `address` is the recipient. */
export async function fetchStreamsByRecipient(address: string): Promise<Stream[]> {
  const result = await apiFetch<Stream[]>(`/v1/streams?recipient=${encodeURIComponent(address)}`);
  return result ?? [];
}

/** Fetches a single stream by id from the indexer (faster than a chain read, used for initial page load). */
export async function fetchStreamById(id: string): Promise<Stream | null> {
  return apiFetch<Stream>(`/v1/streams/${encodeURIComponent(id)}`);
}
