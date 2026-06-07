# ADR-009 Integration Client Seam

**Status:** ACCEPTED
**Date:** 2026-06-04
**Layers:** Backend

## Decision

Integration client interfaces deferred. `ipc.ts` imports `google.ts` and `challonge.ts` directly. No `GoogleIntegration` or `ChallongeIntegration` interface extracted.

Integration functions already accept injected credentials as parameters - the partial seam exists at the function-signature level. A formal interface requires restructuring `registerIpcHandlers` to accept injected clients, which only pays off once a test harness exists. Build the interface when the first test needs to mock an integration.

## Consequences

| Positive | Negative |
|----------|----------|
| No premature abstraction | `ipc.ts` tightly coupled to concrete modules |
| No interface designed in a vacuum | Adding integration requires editing `ipc.ts` import |

## Source

Full ADR: `docs/adr/ADR-009-integration-client-seam-deferral.md`

## Related

- [[ADR Index]]
- [[ADR-004 Application Runtime]]
- [[External Integrations]]
