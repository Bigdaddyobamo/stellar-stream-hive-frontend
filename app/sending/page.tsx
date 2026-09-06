"use client";

import { useWallet } from "@/hooks/useWallet";
import { useStreams } from "@/hooks/useStreams";
import { StreamCard } from "@/components/stream/StreamCard";
import { CancelButton } from "@/components/stream/CancelButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { formatTokenAmount } from "@/lib/format";

export default function SendingPage() {
  const wallet = useWallet();
  const { streams, isLoading, error, apiConfigured, refetch } = useStreams(wallet.publicKey, "sender");

  if (!wallet.isConnected) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Streams you&apos;re sending</h1>
        <p className="mx-auto mt-3 max-w-sm text-muted">Connect your wallet to see the streams you&apos;ve created.</p>
        <div className="mt-6 flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  const activeStreams = streams.filter((s) => s.status === "active" || s.status === "cliff" || s.status === "scheduled");
  const totalOutgoing = activeStreams.reduce((sum, s) => sum + BigInt(s.totalAmount) - BigInt(s.withdrawnAmount), 0n);
  const commonSymbol = activeStreams[0]?.token.symbol ?? "XLM";
  const commonDecimals = activeStreams[0]?.token.decimals ?? 7;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Streams you&apos;re sending</h1>
          <p className="mt-1 text-muted">Streams where your connected wallet is the sender.</p>
        </div>
        {activeStreams.length > 0 && (
          <div className="card px-5 py-3 text-right">
            <p className="text-xs text-muted">Total outgoing commitment</p>
            <p className="mono-tabular text-xl font-bold text-primary">
              {formatTokenAmount(totalOutgoing, commonSymbol, commonDecimals, 4)}
            </p>
          </div>
        )}
      </div>

      {!apiConfigured && (
        <div className="mb-6 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          The Stellar Stream Hive indexer API isn&apos;t configured yet, so this list may be incomplete. Set
          NEXT_PUBLIC_API_BASE_URL once the API is deployed.
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : streams.length === 0 ? (
        <EmptyState
          title="No outgoing streams yet"
          description="Streams you create will show up here once the indexer picks them up."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {streams.map((stream) => (
            <StreamCard
              key={stream.id}
              stream={stream}
              role="sender"
              actions={
                <CancelButton
                  streamId={stream.id}
                  senderAddress={stream.sender}
                  connectedAddress={wallet.publicKey}
                  cancellable={stream.cancellable && (stream.status === "active" || stream.status === "cliff")}
                  tokenSymbol={stream.token.symbol}
                  tokenDecimals={stream.token.decimals}
                  onCancelled={refetch}
                />
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
