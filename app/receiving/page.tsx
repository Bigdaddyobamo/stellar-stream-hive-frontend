"use client";

import { useMemo, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useStreams } from "@/hooks/useStreams";
import { StreamCard } from "@/components/stream/StreamCard";
import { StreamFilterBar } from "@/components/stream/StreamFilterBar";
import { RefreshButton } from "@/components/stream/RefreshButton";
import { TotalWithdrawable } from "@/components/stream/TotalWithdrawable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { countByFilter, filterStreams, sortStreams, type StreamFilter, type StreamSort } from "@/lib/streamList";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { fetchWithdrawableOnChain, withdrawOnChain, ContractNotConfiguredError } from "@/lib/contracts";
import { describeFreighterError } from "@/lib/freighter";

export default function ReceivingPage() {
  const wallet = useWallet();
  const { streams, isLoading, error, apiConfigured, refetch } = useStreams(wallet.publicKey, "recipient");
  const [filter, setFilter] = useState<StreamFilter>("all");
  const [sort, setSort] = useState<StreamSort>("default");
  const counts = useMemo(() => countByFilter(streams), [streams]);
  const visibleStreams = useMemo(() => sortStreams(filterStreams(streams, filter), sort), [streams, filter, sort]);
  const [withdrawAllStatus, setWithdrawAllStatus] = useState<"idle" | "running" | "done">("idle");
  const [withdrawAllError, setWithdrawAllError] = useState<string | null>(null);

  if (!wallet.isConnected) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Streams you&apos;re receiving</h1>
        <p className="mx-auto mt-3 max-w-sm text-muted">Connect your wallet to see streams where you&apos;re the recipient.</p>
        <div className="mt-6 flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  const withdrawableStreams = streams.filter((s) => s.status === "active" || s.status === "cliff");

  async function handleWithdrawAll() {
    setWithdrawAllStatus("running");
    setWithdrawAllError(null);
    try {
      for (const stream of withdrawableStreams) {
        const amount = await fetchWithdrawableOnChain(stream.id);
        if (amount > 0n && wallet.publicKey) {
          await withdrawOnChain({ streamId: stream.id, recipient: wallet.publicKey, amount });
        }
      }
      setWithdrawAllStatus("done");
      await refetch();
    } catch (err) {
      setWithdrawAllError(err instanceof ContractNotConfiguredError ? err.message : describeFreighterError(err));
      setWithdrawAllStatus("idle");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Streams you&apos;re receiving</h1>
          <p className="mt-1 text-muted">Streams where your connected wallet is the recipient.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RefreshButton onRefresh={refetch} isLoading={isLoading} />
          {withdrawableStreams.length > 0 && (
            <>
              <TotalWithdrawable streams={withdrawableStreams} />
              <button
                type="button"
                onClick={handleWithdrawAll}
                disabled={withdrawAllStatus === "running"}
                className="btn-primary"
              >
                {withdrawAllStatus === "running" ? (
                  <>
                    <Spinner size="sm" /> Withdrawing…
                  </>
                ) : (
                  `Withdraw All (${withdrawableStreams.length})`
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {withdrawAllError && <p className="mb-4 text-sm text-danger">{withdrawAllError}</p>}
      {withdrawAllStatus === "done" && (
        <p className="mb-4 text-sm text-primary">Withdrawal requests submitted for all eligible streams.</p>
      )}

      {!apiConfigured && (
        <div className="mb-6 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          The Stellar Stream Hive indexer API isn&apos;t configured yet, so this list may be incomplete. Set
          NEXT_PUBLIC_API_BASE_URL once the API is deployed.
        </div>
      )}

      {!isLoading && !error && streams.length > 0 && (
        <StreamFilterBar
          value={filter}
          onChange={setFilter}
          sort={sort}
          onSortChange={setSort}
          counts={counts}
          exportable={visibleStreams}
          exportName="stellar-stream-hive-receiving-streams"
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : streams.length === 0 ? (
        <EmptyState
          title="No incoming streams yet"
          description="Streams sent to your address will appear here once the indexer picks them up."
        />
      ) : visibleStreams.length === 0 ? (
        <EmptyState title="No matching streams" description="Try a different status filter." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleStreams.map((stream) => (
            <StreamCard key={stream.id} stream={stream} role="recipient" />
          ))}
        </div>
      )}
    </div>
  );
}
