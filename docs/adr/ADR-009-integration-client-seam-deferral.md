# ADR-009: Integration Client Interface Deferred

**Project:** Custom Game Tourney Application
Status: ACCEPTED
Date: 2026-06-04
Authors: Joseph Childree
Affected Layers: Backend

---

## Context

During an architecture review, Candidate 2 proposed extracting a `GoogleIntegration` and `ChallongeIntegration` interface so `ipc.ts` depends on abstractions rather than concrete modules. The intent was to create a testable seam: swap in a stub adapter without hitting the network.

The integration functions (`updateGoogleForm`, `fetchSignups`, `pushToChallonge`) already accept injected credentials as parameters - they do not reach into `keychain.ts` themselves. `ipc.ts` does the credential lookup and passes the result in. A partial seam already exists at the function-signature level.

## Decision

Do not extract integration client interfaces now.

The coupling in `ipc.ts` is direct module imports, not instantiated objects, so there is no injection point without restructuring `registerIpcHandlers` to accept injected clients - a significant change. The only benefit is test mocking, and the project has no test harness yet. Building the interface before the test infrastructure exists is premature: the interface will be designed in a vacuum and may not match what the tests actually need.

Revisit when: a test file needs to import `registerIpcHandlers` and mock either integration.

## Consequences

`ipc.ts` continues to import `google.ts` and `challonge.ts` directly. Adding a third integration requires editing `ipc.ts` to import the new module, which is the expected change surface for now.
