"use client";

import { useWallet } from "@/hooks/useWallet";
import { NETWORK } from "@/lib/stellar";

/**
 * Displays the network the app is configured for, and warns loudly if the
 * connected Freighter wallet is pointed at a different one — signing a
 * transaction against the wrong network is a common, confusing failure mode.
 */
export function NetworkSelector() {
  const wallet = useWallet();

  return (
    <div className="flex items-center gap-2">
      <span className="hidden items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted sm:inline-flex">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {NETWORK}
      </span>
      {wallet.isConnected && wallet.isWrongNetwork && (
        <span
          className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-medium text-warning"
          title={`Freighter is set to ${wallet.network}, but this app is configured for ${NETWORK}. Switch networks in Freighter.`}
        >
          Wrong network: {wallet.network}
        </span>
      )}
    </div>
  );
}
