import Link from "next/link";
import type { Stream } from "@/types";
import { formatTokenAmount, shortenAddress } from "@/lib/format";
import { StreamStatusBadge } from "@/components/stream/StreamStatusBadge";
import { LiveBalance } from "@/components/stream/LiveBalance";
import { CopyButton } from "@/components/ui/CopyButton";

export interface StreamCardProps {
  stream: Stream;
  /** Which side of the stream the current viewer is on, to decide what to emphasize. */
  role: "sender" | "recipient";
  actions?: React.ReactNode;
}

/** A compact summary card for a stream, used on the Sending and Receiving pages. */
export function StreamCard({ stream, role, actions }: StreamCardProps) {
  const counterpartLabel = role === "sender" ? "Recipient" : "Sender";
  const counterpartAddress = role === "sender" ? stream.recipient : stream.sender;
  const isLive = stream.status === "active" || stream.status === "cliff";

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">{counterpartLabel}</p>
          <div className="flex items-center gap-1">
            <p className="font-mono text-sm" title={counterpartAddress}>
              {shortenAddress(counterpartAddress)}
            </p>
            <CopyButton value={counterpartAddress} label="Copy address" />
          </div>
        </div>
        <StreamStatusBadge status={stream.status} />
      </div>

      {role === "recipient" ? (
        <LiveBalance
          totalAmount={stream.totalAmount}
          withdrawnAmount={stream.withdrawnAmount}
          startLedger={stream.startLedger}
          endLedger={stream.endLedger}
          cliffLedger={stream.cliffLedger}
          tokenSymbol={stream.token.symbol}
          tokenDecimals={stream.token.decimals}
          enabled={isLive}
          size="sm"
          label="Withdrawable"
        />
      ) : (
        <div>
          <p className="text-xs text-muted">Total commitment</p>
          <p className="mono-tabular text-xl font-semibold">
            {formatTokenAmount(BigInt(stream.totalAmount), stream.token.symbol, stream.token.decimals, 4)}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Link href={`/streams/${stream.id}`} className="text-sm font-medium text-accent hover:underline">
          View details →
        </Link>
        {actions}
      </div>
    </div>
  );
}
