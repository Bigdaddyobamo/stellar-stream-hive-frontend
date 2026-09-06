"use client";

import { useEffect, useState } from "react";
import { fetchLatestLedgerSnapshot, type LedgerSnapshot } from "@/lib/stellar";
import { dateToEstimatedLedger } from "@/lib/streaming";

export interface ScheduleInputProps {
  startDate: Date;
  onStartDateChange: (date: Date) => void;
  cliffDate: Date | null;
  onCliffDateChange: (date: Date | null) => void;
  endDate: Date;
  onEndDateChange: (date: Date) => void;
}

function toLocalInputValue(date: Date): string {
  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

/**
 * Start / optional cliff / end date pickers. Converts each date into an
 * estimated ledger number (shown for transparency) using a single fetched
 * chain reference point — the actual ledger numbers submitted on-chain are
 * recomputed at transaction build time, so drift here only affects the
 * preview, not correctness.
 */
export function ScheduleInput({
  startDate,
  onStartDateChange,
  cliffDate,
  onCliffDateChange,
  endDate,
  onEndDateChange,
}: ScheduleInputProps) {
  const [reference, setReference] = useState<LedgerSnapshot | null>(null);
  const [hasCliff, setHasCliff] = useState(cliffDate !== null);

  useEffect(() => {
    let cancelled = false;
    fetchLatestLedgerSnapshot()
      .then((snap) => {
        if (!cancelled) setReference(snap);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const orderError =
    endDate.getTime() <= startDate.getTime()
      ? "End date must be after the start date."
      : cliffDate && (cliffDate.getTime() < startDate.getTime() || cliffDate.getTime() > endDate.getTime())
        ? "Cliff date must be between the start and end dates."
        : null;

  function ledgerLabel(date: Date): string {
    if (!reference) return "";
    const ledger = dateToEstimatedLedger(date, { ledger: reference.ledger, timestampMs: reference.timestampMs });
    return `≈ ledger ${ledger.toLocaleString()}`;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="start-date">
            Start date
          </label>
          <input
            id="start-date"
            type="datetime-local"
            value={toLocalInputValue(startDate)}
            onChange={(e) => e.target.value && onStartDateChange(new Date(e.target.value))}
            className="input-field"
          />
          <p className="mt-1 text-xs text-muted">{ledgerLabel(startDate)}</p>
        </div>
        <div>
          <label className="label" htmlFor="end-date">
            End date
          </label>
          <input
            id="end-date"
            type="datetime-local"
            value={toLocalInputValue(endDate)}
            onChange={(e) => e.target.value && onEndDateChange(new Date(e.target.value))}
            className="input-field"
          />
          <p className="mt-1 text-xs text-muted">{ledgerLabel(endDate)}</p>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={hasCliff}
            onChange={(e) => {
              setHasCliff(e.target.checked);
              onCliffDateChange(e.target.checked ? new Date(startDate.getTime() + 86_400_000) : null);
            }}
            className="h-4 w-4 rounded border-border bg-background accent-primary"
          />
          Add a cliff date (no funds withdrawable before this date)
        </label>
        {hasCliff && (
          <div className="mt-2">
            <input
              type="datetime-local"
              value={toLocalInputValue(cliffDate ?? startDate)}
              onChange={(e) => e.target.value && onCliffDateChange(new Date(e.target.value))}
              className="input-field"
            />
            {cliffDate && <p className="mt-1 text-xs text-muted">{ledgerLabel(cliffDate)}</p>}
          </div>
        )}
      </div>

      {orderError && <p className="text-xs text-danger">{orderError}</p>}
    </div>
  );
}
