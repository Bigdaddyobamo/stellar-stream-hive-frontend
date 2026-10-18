"use client";

import { STREAM_FILTERS, streamsToCsv, type StreamFilter } from "@/lib/streamList";
import type { Stream } from "@/types";

interface StreamFilterBarProps {
  value: StreamFilter;
  onChange: (filter: StreamFilter) => void;
  counts: Record<StreamFilter, number>;
  /** Streams to include in the CSV export (typically the currently visible list). */
  exportable: Stream[];
  exportName: string;
}

/** Filter tabs plus a "Download CSV" action for the /sending and /receiving lists. */
export function StreamFilterBar({ value, onChange, counts, exportable, exportName }: StreamFilterBarProps) {
  function downloadCsv() {
    const blob = new Blob([streamsToCsv(exportable)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportName}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div role="group" aria-label="Filter streams by status" className="flex flex-wrap gap-2">
        {STREAM_FILTERS.map((filter) => {
          const selected = filter.value === value;
          return (
            <button
              key={filter.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(filter.value)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                selected
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted hover:text-white"
              }`}
            >
              {filter.label} <span className="mono-tabular opacity-70">{counts[filter.value]}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={downloadCsv}
        disabled={exportable.length === 0}
        className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Download CSV
      </button>
    </div>
  );
}
