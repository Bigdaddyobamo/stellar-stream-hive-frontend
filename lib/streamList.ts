/**
 * Pure helpers for the /sending and /receiving lists: status filtering,
 * per-status counts, and CSV export. Kept free of React so they're unit tested
 * directly (see `lib/streamList.test.ts`).
 */
import { formatBaseUnits } from "./format";
import type { Stream, StreamStatus } from "@/types";

export type StreamFilter = "all" | "live" | "completed" | "cancelled";

export const STREAM_FILTERS: { value: StreamFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

/** "Live" = anything that can still accrue or become withdrawable. */
const LIVE_STATUSES: ReadonlySet<StreamStatus> = new Set<StreamStatus>(["scheduled", "cliff", "active"]);

export function matchesFilter(stream: Stream, filter: StreamFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "live":
      return LIVE_STATUSES.has(stream.status);
    case "completed":
      return stream.status === "completed";
    case "cancelled":
      return stream.status === "cancelled";
  }
}

export function filterStreams(streams: Stream[], filter: StreamFilter): Stream[] {
  return filter === "all" ? streams : streams.filter((s) => matchesFilter(s, filter));
}

export function countByFilter(streams: Stream[]): Record<StreamFilter, number> {
  return {
    all: streams.length,
    live: streams.filter((s) => matchesFilter(s, "live")).length,
    completed: streams.filter((s) => matchesFilter(s, "completed")).length,
    cancelled: streams.filter((s) => matchesFilter(s, "cancelled")).length,
  };
}

const CSV_HEADER = [
  "id",
  "status",
  "sender",
  "recipient",
  "token",
  "total_amount",
  "withdrawn",
  "start_ledger",
  "end_ledger",
  "cliff_ledger",
  "cancellable",
];

/**
 * RFC 4180 escaping, plus a guard against spreadsheet formula injection:
 * a cell that starts with `=`, `+`, `-` or `@` is prefixed with a single quote
 * so it is never evaluated when the file is opened in Excel/Sheets.
 */
export function csvCell(value: string | number | boolean | undefined): string {
  let text = value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Serializes streams to CSV. Amounts are human-readable decimals in the token's own units. */
export function streamsToCsv(streams: Stream[]): string {
  const rows = streams.map((s) => [
    s.id,
    s.status,
    s.sender,
    s.recipient,
    s.token.symbol,
    formatBaseUnits(BigInt(s.totalAmount), s.token.decimals, { grouped: false, minDecimals: 0 }),
    formatBaseUnits(BigInt(s.withdrawnAmount), s.token.decimals, { grouped: false, minDecimals: 0 }),
    s.startLedger,
    s.endLedger,
    s.cliffLedger,
    s.cancellable,
  ]);
  return [CSV_HEADER, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
