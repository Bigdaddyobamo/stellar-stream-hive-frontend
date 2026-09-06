"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { NetworkSelector } from "@/components/wallet/NetworkSelector";

const LINKS = [
  { href: "/streams/new", label: "Create Stream" },
  { href: "/sending", label: "Sending" },
  { href: "/receiving", label: "Receiving" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <HiveLogo />
          <span className="hidden sm:inline">Stellar Stream Hive</span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === link.href ? "bg-surface text-white" : "text-muted hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <NetworkSelector />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}

function HiveLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className="text-primary" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 2 20 6.5v9L12 20 4 15.5v-9L12 2Z" />
      <path d="M12 8 16 10v4l-4 2-4-2v-4l4-2Z" />
    </svg>
  );
}
