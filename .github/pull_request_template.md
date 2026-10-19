## Summary

<!-- What does this PR change, and why? -->

## Related issue

Closes #

## Checklist

Mirrors [CONTRIBUTING.md](../CONTRIBUTING.md) — please confirm before requesting review.

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] Token amounts stay `BigInt` end to end and are floored, never rounded up
- [ ] No stroop/base-unit amount is represented as a JS `number`; conversion to a display string happens only at render via `lib/format.ts`
- [ ] Wallet and network errors (Freighter missing, wrong network, rejected signature, RPC timeout) render a helpful state, not an uncaught exception
- [ ] No fabricated data: unavailable data shows a loading, empty, or error state
- [ ] Transaction amounts are re-fetched on-chain immediately before submitting, not taken from the client-side estimate

## Screenshots (UI changes)

<!-- Before / after screenshots or a short recording. Delete this section if there is no UI change. -->
