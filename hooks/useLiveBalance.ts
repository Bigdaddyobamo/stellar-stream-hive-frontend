"use client";

import { useEffect, useRef, useState } from "react";
import { fetchLatestLedgerSnapshot, type LedgerSnapshot } from "@/lib/stellar";
import { computeProgress, computeWithdrawable, computeStreamedAmount, estimateCurrentLedger } from "@/lib/streaming";
import type { LiveBalanceState } from "@/types";
import { RESYNC_MS, TICK_MS } from "@/lib/constants";

export interface UseLiveBalanceParams {
  totalAmount: bigint;
  withdrawnAmount: bigint;
  startLedger: number;
  endLedger: number;
  cliffLedger?: number;
  /**
   * Supplies a fixed ledger/time reference instead of fetching one from
   * chain, and skips periodic re-sync. Used for the landing page's
   * no-wallet-required demo simulation — never for a real stream.
   */
  simulatedReference?: LedgerSnapshot;
  /** Set false to freeze the ticker (e.g. cancelled/completed streams). */
  enabled?: boolean;
}

/**
 * Drives the signature "live balance" experience: ticks the withdrawable
 * amount upward once per second by estimating the current ledger from the
 * last known chain snapshot, then re-syncs with chain every 30s to correct
 * for drift between Stellar's actual (variable) ledger close times and our
 * ~5s estimate.
 *
 * All amount math is BigInt and floors — this hook will never report a
 * withdrawable amount larger than the contract would actually allow.
 */
export function useLiveBalance(params: UseLiveBalanceParams): LiveBalanceState {
  const { totalAmount, withdrawnAmount, startLedger, endLedger, cliffLedger, simulatedReference, enabled = true } =
    params;

  const [reference, setReference] = useState<LedgerSnapshot | null>(simulatedReference ?? null);
  const [isLoading, setIsLoading] = useState(!simulatedReference);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(simulatedReference ? Date.now() : null);
  const [, setTick] = useState(0);

  const isSimulated = !!simulatedReference;
  const mountedRef = useRef(true);

  // Initial fetch + periodic re-sync from chain (skipped entirely in simulated mode).
  useEffect(() => {
    mountedRef.current = true;
    if (isSimulated || !enabled) {
      setIsLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    async function sync() {
      try {
        const snapshot = await fetchLatestLedgerSnapshot();
        if (!mountedRef.current) return;
        setReference(snapshot);
        setLastSyncedAt(Date.now());
        setError(null);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : "Failed to sync with the Stellar network.");
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    }

    sync();
    const resyncInterval = setInterval(sync, RESYNC_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(resyncInterval);
    };
  }, [isSimulated, enabled]);

  // Per-second UI tick. Purely forces a re-render so the derived values below
  // recompute against the current wall-clock time.
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(interval);
  }, [enabled]);

  if (!reference) {
    return {
      withdrawable: 0n,
      streamed: 0n,
      progress: 0,
      isLoading,
      error,
      lastSyncedAt,
    };
  }

  const currentLedger = enabled
    ? estimateCurrentLedger({ lastKnownLedger: reference.ledger, lastKnownLedgerTimestampMs: reference.timestampMs })
    : reference.ledger;

  const streamed = computeStreamedAmount({ totalAmount, startLedger, endLedger, currentLedger });
  const withdrawable = computeWithdrawable({
    totalAmount,
    withdrawnAmount,
    startLedger,
    endLedger,
    currentLedger,
    cliffLedger,
  });
  const progress = computeProgress({ startLedger, endLedger, currentLedger });

  return {
    withdrawable,
    streamed,
    progress,
    isLoading,
    error,
    lastSyncedAt,
  };
}
