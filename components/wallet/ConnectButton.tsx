"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { shortenAddress } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Connects/disconnects Freighter and shows the active address once connected.
 * Handles the "Freighter not installed" case with a link to install it, and
 * surfaces connection errors (rejected access, etc.) inline rather than
 * throwing.
 */
export function ConnectButton() {
  const wallet = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!wallet.isFreighterInstalled) {
    return (
      <a
        href="https://www.freighter.app/"
        target="_blank"
        rel="noreferrer"
        className="btn-secondary text-sm"
        title="Freighter wallet extension is required"
      >
        Install Freighter
      </a>
    );
  }

  if (wallet.isConnected && wallet.publicKey) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="btn-secondary text-sm"
        >
          <span className="h-2 w-2 rounded-full bg-primary" />
          {shortenAddress(wallet.publicKey)}
        </button>
        {menuOpen && (
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-border bg-surface p-1 shadow-xl">
            <div className="px-3 py-2 text-xs text-muted">{wallet.network ?? "Unknown network"}</div>
            <button
              type="button"
              onClick={() => {
                wallet.disconnect();
                setMenuOpen(false);
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={wallet.connect} disabled={wallet.isConnecting} className="btn-primary text-sm">
        {wallet.isConnecting ? (
          <>
            <Spinner size="sm" /> Connecting…
          </>
        ) : (
          "Connect Wallet"
        )}
      </button>
      {wallet.error && <span className="max-w-[220px] text-right text-xs text-danger">{wallet.error}</span>}
    </div>
  );
}
