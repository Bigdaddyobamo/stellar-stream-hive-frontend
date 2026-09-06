"use client";

import { useCallback, useEffect, useState } from "react";
import {
  checkFreighterInstalled,
  connectFreighter,
  describeFreighterError,
  getFreighterAddress,
  getFreighterNetwork,
} from "@/lib/freighter";
import { NETWORK } from "@/lib/stellar";
import type { WalletState } from "@/types";

const STORAGE_KEY = "ssh:wallet-connected";

export interface UseWalletResult extends WalletState {
  isConnecting: boolean;
  error: string | null;
  isWrongNetwork: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
}

/**
 * Manages the Freighter wallet connection: install detection, connect/
 * disconnect, the active public key, and the selected network — with the
 * connection remembered across reloads (but never auto-prompting Freighter,
 * only silently re-reading its already-granted state).
 */
export function useWallet(): UseWalletResult {
  const [isFreighterInstalled, setIsFreighterInstalled] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const installed = await checkFreighterInstalled();
      if (cancelled) return;
      setIsFreighterInstalled(installed);

      const wasConnected = typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY) === "1";
      if (installed && wasConnected) {
        const address = await getFreighterAddress();
        const net = await getFreighterNetwork();
        if (cancelled) return;
        if (address) {
          setPublicKey(address);
          setNetwork(net);
        }
      }
      if (!cancelled) setHydrated(true);
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const address = await connectFreighter();
      const net = await getFreighterNetwork();
      setPublicKey(address);
      setNetwork(net);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, "1");
      }
    } catch (err) {
      setError(describeFreighterError(err));
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setNetwork(null);
    setError(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    isConnected: hydrated && !!publicKey,
    publicKey,
    network,
    isFreighterInstalled,
    isConnecting,
    error,
    isWrongNetwork: !!network && network !== NETWORK,
    connect,
    disconnect,
    clearError,
  };
}
