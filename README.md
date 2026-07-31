# The Colosseum

A desktop app for running custom video game tournaments end-to-end - no manual updates to external services needed.

Built with Electron + React + TypeScript.

## What it does

| View | Purpose |
|---|---|
| **Setup** | Configure tourney name, game, date/time, signup deadline, draft style, player count |
| **Draft** | Sleeper-style draft board with pick wheel randomizer and per-pick timer |
| **Bracket** | Push finalized teams to Challonge; auto-fills names, dates, stream links |
| **Control** | Start the tournament - triggers updates across all integrated services |

## Integrations

- **Google Forms** - auto-updates signup form template with tourney details
- **Challonge** - pushes finalized bracket to your community via v1 REST API
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

## OAuth setup

The app needs a real Google OAuth client to authorize Forms access. Without one,
the connect flow fails with `Error 401: invalid_client`.

1. Copy `src/main/auth/oauth-config.example.ts` to `src/main/auth/oauth-config.ts`
   (gitignored, so secrets stay local).
2. In the [Google Cloud Console](https://console.cloud.google.com/): create a
   project, then enable the **Google Forms API** under APIs & Services > Library.
3. Configure the OAuth consent screen (User type: External) and add your Google
   account as a **Test user**.
4. Create credentials > OAuth client ID with application type **Desktop app**.
   Desktop is required: the app redirects to a `http://127.0.0.1:{port}/callback`
   loopback URL, which Google only allows for Desktop clients. A Web client fails
   with `redirect_uri_mismatch`.
5. Paste the generated Client ID and Client secret into `oauth-config.ts`.

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
  main/          # Electron main process - IPC, integrations, keychain, store
  preload/       # Context bridge
  renderer/      # React UI - views (Setup, Draft, Bracket, Control) + components
  shared/        # Shared types (Tourney, Player, Team, Draft, Sync)
tests/           # Vitest unit tests mirroring src/
```

## License

Private.
