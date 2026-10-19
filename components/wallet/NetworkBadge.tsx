"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { getFreighterNetworkDetails } from "@/lib/freighter";
import { NETWORK, SOROBAN_RPC_URL } from "@/lib/stellar";

/**
 * Displays the network the app is configured for, and warns loudly if the
 * connected Freighter wallet is pointed at a different one — signing a
 * transaction against the wrong network is a common, confusing failure mode.
 */
export function NetworkBadge() {
  const wallet = useWallet();
  const [rpcTooltip, setRpcTooltip] = useState(`This app talks to ${SOROBAN_RPC_URL}`);

  useEffect(() => {
    if (!wallet.isConnected) return;
    let cancelled = false;
    getFreighterNetworkDetails().then((details) => {
      if (!cancelled && details?.sorobanRpcUrl) {
        setRpcTooltip(`This app: ${SOROBAN_RPC_URL}\nFreighter: ${details.sorobanRpcUrl}`);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [wallet.isConnected]);

  return (
    <div className="flex items-center gap-2">
      <span
        className="hidden items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted sm:inline-flex"
        title={rpcTooltip}
      >
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
