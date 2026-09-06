# Stellar Stream Hive — Frontend

A Next.js frontend for **Stellar Stream Hive**: employers create real-time payment streams to
employees on Stellar, and recipients watch their balance accrue by the second and withdraw
whenever they want. Built as part of an open-source Stellar Development Foundation grant
application.

## Related repositories

| Repo | Purpose |
| --- | --- |
| [`stellar-stream-hive-contract`](https://github.com/Stellar-Hive/stellar-stream-hive-contract) | Soroban smart contracts (Stream, Vault, Registry) |
| [`stellar-stream-hive-api`](https://github.com/Stellar-Hive/stellar-stream-hive-api) | Indexer/registry API used for stats and stream listings |
| `stellar-stream-hive-frontend` (this repo) | Next.js web app |

## The signature feature: LiveBalance

The core of the product is watching a recipient's withdrawable balance tick upward in real
time. `hooks/useLiveBalance.ts` mirrors the on-chain streaming formula client-side using BigInt
math (never floating point, always floored — the UI must never show more than the contract
would actually let you withdraw):

```
elapsed        = min(current_ledger, end_ledger) - start_ledger
total_duration = end_ledger - start_ledger
streamed       = floor(total_amount * elapsed / total_duration)
withdrawable   = streamed - withdrawn
```

It estimates the current ledger between chain reads using Stellar's ~5s average ledger close
time, ticks once per second for a smooth counter, and re-syncs with the Soroban RPC endpoint
every 30 seconds to correct for drift. Actual withdrawals always re-fetch the real on-chain
amount before submitting — the ticking estimate is a UI affordance, never the source of truth
for a transaction.

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) (dark mode by default)
- [`@stellar/stellar-sdk`](https://github.com/stellar/js-stellar-sdk) for building/simulating/submitting Soroban transactions
- [`@stellar/freighter-api`](https://github.com/stellar/freighter) for wallet connection and signing
- [Recharts](https://recharts.org/) for data visualization
- [date-fns](https://date-fns.org/) for date formatting

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in values, see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See [`.env.example`](./.env.example) for the full, documented list. In short:

- `NEXT_PUBLIC_STREAM_CONTRACT_ID`, `NEXT_PUBLIC_VAULT_CONTRACT_ID`, `NEXT_PUBLIC_REGISTRY_CONTRACT_ID` —
  Soroban contract IDs. **These are intentionally left blank in this repo.** The contracts repo
  deploys independently; once it has, fill these in from its `DEPLOYMENTS.md`. Until they're
  set, contract-calling features show a clear "not yet configured" state instead of failing
  silently or using a fabricated placeholder ID.
- `NEXT_PUBLIC_STELLAR_NETWORK`, `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`,
  `NEXT_PUBLIC_SOROBAN_RPC_URL`, `NEXT_PUBLIC_HORIZON_URL` — network configuration, defaulted to
  Stellar testnet.
- `NEXT_PUBLIC_API_BASE_URL` — base URL for the indexer API (`stellar-stream-hive-api`), used for
  platform-wide stats and listing streams by sender/recipient. If unset, the app shows a
  graceful empty/loading state rather than fabricating numbers.

## Project structure

```
app/
  page.tsx                    Landing page (hero, no-wallet live demo, platform stats)
  streams/new/page.tsx        Create a stream
  streams/[id]/page.tsx       Stream detail (timeline, live balance, withdraw/cancel)
  sending/page.tsx            Streams the connected wallet is sending
  receiving/page.tsx          Streams the connected wallet is receiving
components/
  wallet/                     Freighter connect button, network indicator
  stream/                     LiveBalance, StreamCard, timeline, withdraw/cancel, etc.
  create/                     Create-stream form fields and live preview
  landing/                    Landing-page-only sections (demo, stats)
  layout/                     Nav bar, footer
  ui/                         Generic primitives (spinner, empty/error states, copy button)
hooks/
  useWallet.ts                Freighter connection state
  useLiveBalance.ts           The per-second ticking balance hook
  useStream.ts / useStreams.ts  Data loading for one stream / lists of streams
lib/
  contracts.ts                Soroban contract call helpers (create/withdraw/cancel/approve)
  freighter.ts                Freighter API wrapper with normalized error handling
  stellar.ts                  Network config, RPC client, address validation
  streaming.ts                Client-side streamed-amount math (mirrors the contract)
  format.ts                   BigInt <-> decimal string formatting, address shortening
  api.ts                      Indexer API client
types/index.ts                 Shared domain types
```

## Verifying the build

```bash
npm run build
```

This runs a full TypeScript + Next.js production build and must succeed with no type errors.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

MIT
