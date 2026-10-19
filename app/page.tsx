import Link from "next/link";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { PlatformStats } from "@/components/landing/PlatformStats";

const STEPS = [
  {
    title: "Create",
    description:
      "An employer sets a recipient, total amount, token, and schedule. Funds are locked into the stream contract up front.",
  },
  {
    title: "Accrue",
    description:
      "The recipient's balance streams upward every second on-chain. No batch payroll runs, no waiting for a payday.",
  },
  {
    title: "Withdraw",
    description:
      "The recipient withdraws whatever has accrued, whenever they want — the full balance or a partial amount.",
  },
];

const FAQS = [
  {
    question: "What is a cliff?",
    answer:
      "An optional date before which nothing can be withdrawn. Streaming still runs from the start date, so once the cliff passes, everything accrued since the start becomes withdrawable at once. Until then the stream shows as Cliff pending.",
  },
  {
    question: "Can I cancel a stream?",
    answer:
      "Only if the sender chose to make it cancellable when creating it. Cancelling stops accrual: the recipient keeps what had streamed up to that moment, and the unstreamed remainder is refunded to the sender. Cancelling before the cliff refunds the full deposit, since nothing has accrued yet.",
  },
  {
    question: "Can the recipient withdraw part of the balance?",
    answer:
      "Yes. The recipient can withdraw the full withdrawable balance or any custom amount up to it, as often as they like. The withdrawable amount is re-checked on-chain before every withdrawal.",
  },
  {
    question: "Where are the funds held?",
    answer:
      "The full amount is deposited into the vault contract when the stream is created. Stream contracts never hold funds themselves; the vault releases tokens only as the recipient withdraws or the sender cancels.",
  },
  {
    question: "What do I need to get started?",
    answer:
      "A Freighter wallet browser extension set to the network this app is deployed on, the token you want to stream, and a small amount of XLM to cover network fees.",
  },
];

export default function LandingPage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              Built on Stellar · Soroban smart contracts
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Stream payments <span className="text-primary">by the second</span> on Stellar
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">
              Stellar Stream Hive lets employers pay salaries and grants as continuous streams instead of lump sums.
              Recipients watch their balance accrue in real time and withdraw whenever they want.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/streams/new" className="btn-primary">
                Create a Stream
              </Link>
              <Link href="/receiving" className="btn-secondary">
                View My Streams
              </Link>
            </div>
          </div>

          <LiveDemo />
        </div>
      </section>

      <section className="border-t border-border bg-surface/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-muted">Platform activity</h2>
          <div className="mt-6">
            <PlatformStats />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold">How it works</h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-mono font-bold text-primary">
                {i + 1}
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold">Frequently asked questions</h2>
        <div className="mt-10 space-y-3">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group rounded-xl border border-border bg-surface px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-bold">Ready to start streaming?</h2>
          <p className="max-w-md text-muted">
            Connect your wallet and set up a stream in minutes — no code, no spreadsheets, no waiting for payday.
          </p>
          <div className="flex gap-3">
            <Link href="/streams/new" className="btn-primary">
              Create a Stream
            </Link>
            <Link href="/sending" className="btn-secondary">
              My Sending Streams
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
