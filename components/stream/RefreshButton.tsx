"use client";

import { Spinner } from "@/components/ui/Spinner";

interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading: boolean;
}

/** Re-fetches the stream list on demand, so the indexer catching up doesn't need a page reload. */
export function RefreshButton({ onRefresh, isLoading }: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? <Spinner size="sm" /> : null}
      Refresh
    </button>
  );
}
