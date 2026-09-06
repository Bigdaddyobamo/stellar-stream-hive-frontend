import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Receiving — Stellar Stream Hive",
  description: "Streams you're receiving as the connected wallet, with live withdrawable balances.",
};

export default function ReceivingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
