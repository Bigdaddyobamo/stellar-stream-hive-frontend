import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sending — Stellar Stream Hive",
  description: "Streams you're sending as the connected wallet, with total outgoing commitment.",
};

export default function SendingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
