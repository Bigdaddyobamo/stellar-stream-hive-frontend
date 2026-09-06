"use client";

import { useState } from "react";
import { cancelStreamOnChain, fetchStreamOnChain, ContractNotConfiguredError } from "@/lib/contracts";
import { fetchLatestLedgerSnapshot } from "@/lib/stellar";
import { computeStreamedAmount } from "@/lib/streaming";
import { describeFreighterError } from "@/lib/freighter";
import { formatTokenAmount, stellarExpertTxUrl } from "@/lib/format";
import { STELLAR_EXPERT_NETWORK } from "@/lib/stellar";
import { Spinner } from "@/components/ui/Spinner";

type Status = "idle" | "loadingSplit" | "confirming" | "signing" | "success" | "error";

export interface CancelButtonProps {
  streamId: string;
  senderAddress: string;
  connectedAddress: string | null;
  cancellable: boolean;
  tokenSymbol: string;
  tokenDecimals?: number;
  onCancelled?: () => void;
}

interface Split {
  recipientGets: bigint;
  senderGets: bigint;
}

/**
 * Lets the sender cancel a cancellable stream. Before submitting, it fetches
 * the live on-chain streamed amount and shows the exact resulting split:
 * the recipient keeps everything streamed so far (minus what they already
 * withdrew), and the sender is refunded the unstreamed remainder.
 */
export function CancelButton({
  streamId,
  senderAddress,
  connectedAddress,
  cancellable,
  tokenSymbol,
  tokenDecimals = 7,
  onCancelled,
}: CancelButtonProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [split, setSplit] = useState<Split | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const isSender = connectedAddress && connectedAddress === senderAddress;
  if (!isSender || !cancellable) return null;

  async function openModal() {
    setOpen(true);
    setStatus("loadingSplit");
    setError(null);
    try {
      const [stream, ledgerSnapshot] = await Promise.all([fetchStreamOnChain(streamId), fetchLatestLedgerSnapshot()]);
      if (!stream) throw new Error("Stream not found on-chain.");

      const streamedNow = computeStreamedAmount({
        totalAmount: BigInt(stream.totalAmount),
        startLedger: stream.startLedger,
        endLedger: stream.endLedger,
        currentLedger: ledgerSnapshot.ledger,
      });

      const recipientGets = streamedNow - BigInt(stream.withdrawnAmount);
      const senderGets = BigInt(stream.totalAmount) - streamedNow;

      setSplit({
        recipientGets: recipientGets > 0n ? recipientGets : 0n,
        senderGets: senderGets > 0n ? senderGets : 0n,
      });
      setStatus("confirming");
    } catch (err) {
      setError(err instanceof ContractNotConfiguredError ? err.message : describeFreighterError(err));
      setStatus("error");
    }
  }

  async function handleConfirm() {
    setStatus("signing");
    setError(null);
    try {
      const result = await cancelStreamOnChain({ streamId, sender: senderAddress });
      setTxHash(result.hash);
      setStatus("success");
      onCancelled?.();
    } catch (err) {
      setError(describeFreighterError(err));
      setStatus("error");
    }
  }

  function close() {
    setOpen(false);
    setStatus("idle");
    setSplit(null);
    setError(null);
    setTxHash(null);
  }

  if (!open) {
    return (
      <button type="button" onClick={openModal} className="btn-danger">
        Cancel stream
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6">
        <h3 className="mb-1 text-lg font-semibold">Cancel this stream?</h3>
        <p className="mb-4 text-sm text-muted">
          This ends the stream immediately and splits the funds based on what has streamed so far. This cannot be
          undone.
        </p>

        {status === "loadingSplit" && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted">
            <Spinner size="sm" /> Calculating exact split from chain…
          </div>
        )}

        {status === "error" && <p className="mb-4 text-sm text-danger">{error}</p>}

        {split && (status === "confirming" || status === "signing") && (
          <div className="mb-4 space-y-2 rounded-xl border border-border bg-background p-4">
            <SplitRow label="Recipient receives" value={formatTokenAmount(split.recipientGets, tokenSymbol, tokenDecimals, 7)} />
            <SplitRow label="Sender refunded" value={formatTokenAmount(split.senderGets, tokenSymbol, tokenDecimals, 7)} />
          </div>
        )}

        {status === "success" && txHash && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-primary">Stream cancelled.</p>
            <a
              href={stellarExpertTxUrl(txHash, STELLAR_EXPERT_NETWORK)}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-accent underline"
            >
              View transaction on Stellar Expert
            </a>
          </div>
        )}

        <div className="flex gap-2">
          {status === "success" ? (
            <button type="button" onClick={close} className="btn-secondary flex-1">
              Close
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={status !== "confirming"}
                className="btn-danger flex-1"
              >
                {status === "signing" ? (
                  <>
                    <Spinner size="sm" /> Confirm in wallet…
                  </>
                ) : (
                  "Yes, cancel stream"
                )}
              </button>
              <button type="button" onClick={close} disabled={status === "signing"} className="btn-secondary flex-1">
                Keep streaming
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SplitRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="mono-tabular font-semibold">{value}</span>
    </div>
  );
}
