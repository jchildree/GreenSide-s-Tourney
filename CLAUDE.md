# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A desktop/web dashboard for managing custom video game tournaments. The admin uses the dashboard to configure and run a tournament end-to-end — no manual updates to external services needed.

## Current state

**Planning phase.** No source code exists yet. Design intent lives in three markdown documents:

| File | Contents |
|---|---|
| `Custom Game Tourney App Overview.md` | Full feature flow (steps 0–5) |
| `challonge connection.md` | Challonge community URL and auth strategy |
| `Google Forms.md` | Form template link and fallback strategy |

The `.claude/` directory contains the Claud-itect skill pack (see `Claud-itect-Skill-main/CLAUDE.md` for how hooks and skills work).

## Intended feature flow

1. **Setup** — Admin sets tourney name, game, date/time, sign-up deadline, draft style, min/max players
2. **Google Forms sync** — Dashboard auto-updates the existing form template with those values
3. **Draft board** — After deadline, a Sleeper-style board populates; admin drafts teams using a picker-wheel-style randomizer or manual selection; per-pick timer admin can reset
4. **Challonge output** — Finalized teams push to the pre-existing Challonge community bracket; names, dates, times, stream links auto-filled
5. **Pre-start editing** — Admin can still adjust teams/dates after bracket creation
6. **Start tourney** — Single button triggers updates across all integrated services

## External integrations

- **Google Forms** — template at the URL in `Google Forms.md`; requires OAuth or a service account with edit access
- **Challonge** — community bracket at the URL in `challonge connection.md`; credentials stored at first-run setup or via a credentials store; uses Challonge v1 REST API
- Both integrations should prompt for credentials on first launch and persist them securely (OS keychain or encrypted local store — not plaintext files)

## Architecture direction (not yet decided)

When implementation begins, choices to make:
- **Runtime**: Electron (desktop + local creds store) vs. local web server + browser
- **Google auth**: OAuth2 PKCE flow vs. service account JSON
- **State**: SQLite local DB vs. JSON flat files for tourney state
- **Draft board UI**: Which framework (React, Svelte, plain HTML)

These are open — use `/brainstorming` before committing to any of them.

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

LOTR-themed label vocabulary (e.g. `cast-it-into-the-fire` for wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at project root. See `docs/agents/domain.md`.
