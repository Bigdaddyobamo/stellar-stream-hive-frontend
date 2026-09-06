import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a Stream — Stellar Stream Hive",
  description: "Set up a real-time payment stream on Stellar: recipient, amount, token, and schedule.",
};

export default function NewStreamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
