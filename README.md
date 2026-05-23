# Greenside's Tourney Time

A desktop app for running custom video game tournaments end-to-end — no manual updates to external services needed.

Built with Electron + React + TypeScript.

## What it does

| View | Purpose |
|---|---|
| **Setup** | Configure tourney name, game, date/time, signup deadline, draft style, player count |
| **Draft** | Sleeper-style draft board with pick wheel randomizer and per-pick timer |
| **Bracket** | Push finalized teams to Challonge; auto-fills names, dates, stream links |
| **Control** | Start the tournament — triggers updates across all integrated services |

## Integrations

- **Google Forms** — auto-updates signup form template with tourney details
- **Challonge** — pushes finalized bracket to your community via v1 REST API
- Credentials prompted on first launch, stored securely in OS keychain

## Requirements

- Node.js 20+
- npm 9+

## Getting started

```bash
npm install
npm run dev
```

First launch will prompt for Google and Challonge credentials.

## Scripts

```bash
npm run dev          # Start in development mode
npm run build        # Build for production
npm run package      # Build + package distributable
npm run test         # Run test suite
npm run typecheck    # TypeScript type check (no emit)
```

## Project structure

```
src/
  main/          # Electron main process — IPC, integrations, keychain, store
  preload/       # Context bridge
  renderer/      # React UI — views (Setup, Draft, Bracket, Control) + components
  shared/        # Shared types (Tourney, Player, Team, Draft, Sync)
tests/           # Vitest unit tests mirroring src/
```

## License

Private.
