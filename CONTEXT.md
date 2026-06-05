# Custom Game Tourney Application

Single-admin dashboard that manages a video game tournament end-to-end. The admin uses it to configure the event, run a player draft, and push results to external services without manual steps.

## Language

### Tournament lifecycle

**Tournament**:
The top-level event. Has a name, game, date/time, signup deadline, draft style, and player limits.
_Avoid_: Event, match, game

**Signup**:
A player's self-registration via the Google Form. Contains name, Discord handle, and submission timestamp.
_Avoid_: Registration, entry, RSVP

**Draft**:
The process of assigning signed-up players to teams. Proceeds pick-by-pick according to a Pick Queue.
_Avoid_: Assignment, selection, allocation

**Pick**:
A single assignment of one player to one team during a draft. Has a pick number, team name, and player name.
_Avoid_: Selection, slot, assignment

**Team**:
A named group of players assembled during the draft. Has a name and an ordered list of players.
_Avoid_: Squad, group, roster

**Draft Style**:
The algorithm that determines pick order. One of: `snake` (alternating), `linear` (same order each round), or `random` (randomized wheel).
_Avoid_: Draft type, pick mode

**Pick Queue**:
The full ordered sequence of upcoming picks for a draft, derived from team names, draft style, and number of rounds. Determines which team picks next.
_Avoid_: Pick order, queue, draft order

**Unassigned**:
Players who have signed up but have not yet been picked in the current draft.
_Avoid_: Available players, unpicked, remaining

### External integrations

**Form**:
The Google Form used for player signups. The admin owns an existing form template; the dashboard updates its title and description fields to match the current tournament.
_Avoid_: Survey, registration form, Google Form (in code)

**Bracket**:
The tournament bracket hosted on Challonge. The dashboard creates or updates it and bulk-adds teams as participants.
_Avoid_: Tournament (when referring specifically to the Challonge entity), ladder

**Push**:
The action of sending finalized team data to the Challonge bracket. Triggers a create-or-update sequence followed by bulk participant add.
_Avoid_: Sync, upload, submit, publish

**Sync**:
Metadata about the last successful push to each external service. Tracks tournament ID, last push timestamp, Form ID, and last form update time.
_Avoid_: State, status, integration state

### App concepts

**Onboarding**:
The first-run flow where the admin authenticates with Google and Challonge. Completed once; app skips it on subsequent launches.
_Avoid_: Setup, login, authentication flow

**Credential**:
An OAuth token or access key stored encrypted via Electron's safeStorage. Three credential slots: `google` (refresh token), `challonge` (access token), `challonge-refresh` (refresh token).
_Avoid_: Token, secret, key (when referring to the stored credential)

**Draft Session**:
Transient draft UI state persisted across app restarts: timer duration, remaining seconds, current pick index, and the computed pick queue.
_Avoid_: Draft state, session state

## Example dialogue

> **Dev:** When the admin clicks "Fetch Signups," what exactly comes back?
>
> **Admin:** All the signups from the Form - each one has the player's name and their Discord handle.
>
> **Dev:** And those signups become the pool for the draft?
>
> **Admin:** Right. Unassigned players show up in the wheel. Each pick takes one player and puts them on a team.
>
> **Dev:** What happens when the draft is done?
>
> **Admin:** I push to Challonge. That creates the bracket with all the teams as participants. If I already pushed once, it updates the existing bracket instead of creating a new one.
>
> **Dev:** So "push" always means Challonge, and "sync" is just the record of when I last pushed?
>
> **Admin:** Exactly.
