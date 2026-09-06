# Contributing to Stellar Stream Hive (Frontend)

Thanks for your interest in contributing! This repo is the Next.js frontend for Stellar Stream
Hive. Contributions of all sizes are welcome — bug fixes, new components, accessibility
improvements, documentation, and design polish.

## Repository layout

See the "Project structure" section of [`README.md`](./README.md) for a map of `app/`,
`components/`, `hooks/`, and `lib/`.

Related repositories, if your change touches contract behavior or indexed data instead of the
frontend itself:

- Contracts: https://github.com/Stellar-Hive/stellar-stream-hive-contract
- API / indexer: https://github.com/Stellar-Hive/stellar-stream-hive-api

## Getting set up

```bash
git clone https://github.com/Stellar-Hive/stellar-stream-hive-frontend.git
cd stellar-stream-hive-frontend
npm install
cp .env.example .env.local
npm run dev
```

You'll need the [Freighter](https://www.freighter.app/) browser extension to exercise
wallet-connected flows locally, set to **Testnet**.

Contract-calling features (create/withdraw/cancel a stream) require
`NEXT_PUBLIC_STREAM_CONTRACT_ID` (and friends) to point at a real deployed contract. If you're
only working on UI/UX that doesn't touch live contract state, you can leave these unset — the
app will show a clear "not yet configured" state rather than erroring.

## Development guidelines

- **TypeScript strictness**: the project builds with `strict: true`. Please don't introduce
  `any` where a real type is available.
- **Token amounts are BigInt, always.** Never represent a stroop/base-unit amount as a JS
  `number` — floating point cannot represent Stellar's fixed-point precision safely. Convert to
  a human-readable string only at the final render step, via `lib/format.ts`.
- **Round down, never up.** Anywhere you compute a withdrawable or streamed amount, floor it.
  Showing a user a balance they can't actually withdraw is treated as a bug, not a rounding
  nuance.
- **Never trust the client-side estimate for a transaction amount.** `useLiveBalance` and
  `StreamProgress` exist to make the UI feel alive; the actual withdraw call must re-fetch the
  real on-chain withdrawable amount immediately before submitting (see
  `lib/contracts.ts#fetchWithdrawableOnChain` and how `WithdrawButton` uses it).
- **Handle wallet/network errors explicitly.** Freighter not installed, wrong network, rejected
  signature, RPC timeouts — all of these should render a helpful `ErrorState` or inline message,
  never an uncaught exception or a silently-failed button.
- **No fabricated data.** If the indexer API or a contract call isn't available, show a loading
  or empty state that says so. Never invent numbers, contract IDs, or transaction hashes to make
  a screen look populated.

## Before opening a PR

```bash
npm run lint
npm run build
```

Both should pass cleanly. If you touched `lib/streaming.ts` or `lib/format.ts`, please double
check the BigInt math with a couple of manual examples — these functions are load-bearing for
correctness across the whole app.

## Commit style

Use clear, present-tense commit messages describing *why* a change was made where it's not
obvious from the diff (e.g. `fix: clamp withdrawable to zero before a stream's cliff` rather
than `fix bug`).

## Reporting issues

Please include: what you expected, what happened instead, your browser/Freighter version, and
which network (testnet/futurenet) you were connected to. Screenshots or a short recording help a
lot for anything involving `LiveBalance` or the create-stream flow.
