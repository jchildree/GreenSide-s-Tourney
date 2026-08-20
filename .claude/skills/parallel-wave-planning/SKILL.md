---
name: parallel-wave-planning
version: "1.0"
category: superpowers
execution_speed: medium
token_efficiency: low
triggers:
  - "parallel wave plan"
  - "break this project into plans"
  - "split into plans"
  - "wave plan"
  - "plan the whole project"
cache_key: "parallel-wave-planning-1.0"
dependencies:
  - writing-plans
  - executing-plans
disable-model-invocation: false
description: >
  Use when you have a whole project idea or spec and need to break it into
  MULTIPLE execution-ready plan docs organized into parallel waves. Each plan
  is sized to run in ~100k execution tokens (+/-10%) so a single execution
  session finishes before compaction. Produces numbered plan docs with
  explicit seam contracts plus an orchestration index. Trigger on "parallel
  wave plan", "break this project into plans", "split into plans", "plan the
  whole project", "wave plan".
---

# Parallel-Wave Planning

## Overview

Takes ONE whole-project idea and breaks it into a set of numbered,
execution-ready plan docs. Plans are grouped into **waves**: plans within a
wave touch disjoint files and can be executed in parallel (one subagent
each); plans in a later wave depend on earlier waves. Each plan is sized so
that executing it consumes roughly **100k tokens (+/-10%)** -- small enough
that a fresh execution session finishes the whole plan before it has to
compact, which keeps execution quality high.

Every plan doc itself follows the `writing-plans` format exactly (Goal /
Architecture / Tech Stack, bite-sized checkbox steps, exact paths, real code,
verify commands, Self-Review). This skill is the layer ABOVE that: it decides
how many plans there are, what each one owns, what order they run in, and how
they hand off to each other cleanly so `stitch` can later verify the seams.

**Announce at start:** "I'm using the parallel-wave-planning skill to break
this project into wave-sized plans."

**Save plans to:** `docs/superpowers/plans/YYYY-MM-DD-<NN>-<slice-name>.md`
where `NN` is a zero-padded sequence number (`01`, `02`, ...). The number is
load-bearing: `stitch` uses it to find adjacent plans. User plan-location
preferences override this default.

## Prerequisite: you need a real spec

If you were handed a raw idea rather than a spec, stop and get one first --
use `brainstorming` (ideation to spec) and optionally `grill-me` to
stress-test it. Do not decompose a fuzzy idea into plans; you will produce
scars by construction. One paragraph of "what and why" per subsystem is the
minimum before decomposing.

## The Process

### Step 1: Decompose into vertical slices

List the subsystems the project needs. Split by **responsibility and
delivery**, not by technical layer -- each slice should produce working,
testable software on its own (a slice that delivers "just the DB tables" with
nothing using them is a bad slice). A good slice is one cohesive vertical:
schema + repository + service + route + frontend + tests for one feature
area.

Write the slice list before sizing anything.

### Step 2: Size each slice against the 100k budget

For each slice, estimate its execution cost with this structural heuristic
(calibrated so a plan in-band lands near 100k execution tokens):

| Signal                         | In-band target | Split if...        | Merge if...      |
|--------------------------------|----------------|--------------------|------------------|
| Tasks in the plan              | 4 - 8          | > 8                | < 3              |
| Total bite-sized steps         | 15 - 25        | > 30               | < 10             |
| Distinct files created/modified| 6 - 10         | > 12               | < 3              |
| Full test-suite runs           | 1 - 3          | > 4                | 0                |
| New external surfaces (routes/screens/migrations) | 1 - 4 | > 5 | 0 |

Rules:
- A slice over the "split" line becomes 2+ plans (cut along the smallest
  interface -- e.g. backend plan + frontend plan sharing one contract).
- A slice under the "merge" line joins an adjacent slice IF they can share a
  file-ownership boundary without collision (see Step 4).
- Sizing is per-plan-in-isolation: assume a fresh execution session with no
  prior context, reading the files it touches for the first time.

**Calibration knob (do not skip):** these bands are a starting calibration,
not physics. After the first wave actually executes, check the real context
usage at each plan's end (the executing agent reports it, or you eyeball the
transcript length). If plans routinely finish at 60k, widen the bands; if
they compact before the last task, tighten them. Record the adjusted bands in
the orchestration index so later planning stays calibrated to THIS project's
codebase.

### Step 3: Assign seam contracts

This is what makes plans stitchable. Every plan declares, in its header:

- **Consumes (inbound seam):** the exact artifacts it depends on from earlier
  plans -- function signatures, response shapes, table names, env vars, routes.
  Name them precisely. "Consumes `capture_signature(actor_id, reason) ->
  SignatureRef` from Plan 03."
- **Produces (outbound seam):** the exact artifacts later plans will consume,
  same precision.

A later plan's `Consumes` list must exactly match some earlier plan's
`Produces` list. If two plans both claim to produce the same artifact, or a
plan consumes something nobody produces, that is a planning bug -- fix it now,
before execution, not with `stitch` later.

### Step 4: Order into waves + enforce file ownership

Group plans into waves by dependency:

- **Within a wave:** plans must touch **disjoint file sets**. Two plans in the
  same wave may never write the same file -- they run in parallel and would
  collide. Compute each plan's file set (from its `Files:` blocks) and verify
  no overlap. If two plans must touch the same file, either merge them or put
  them in different waves under a single sequential owner (the collision rule).
- **Across waves:** a plan goes in a later wave than every plan it Consumes
  from. Wave N+1 starts only after Wave N is committed.

State the **collision rule** verbatim in the orchestration index so every
executing subagent obeys it:

> Before editing any file, run `git status <path>` and `git log -1 <path>` to
> confirm no other plan's agent has an in-flight or uncommitted change to it.
> On collision, stop and report rather than editing.

### Step 5: Write each plan doc

Use the `writing-plans` skill for the body of every plan -- same format, same
No-Placeholders rules, same bite-sized granularity, its own Self-Review. Add
one thing at the top of each plan, right under the header, the seam block:

```markdown
**Wave:** 2 (parallel with Plans 05, 06)
**Consumes:** `capture_signature(actor_id, reason) -> SignatureRef` (Plan 03);
  `sig.signatures` table (Plan 03).
**Produces:** `POST /api/cap/{id}/close` endpoint; `CAPCloseModal` component.
**Owns exclusively:** apps/eqms/frontend/src/cap/**, Backend/app/routes/cap.py
```

### Step 6: Write the orchestration index

Create `docs/superpowers/plans/00-orchestration-index.md`:

- The wave/plan table (Plan number, slice name, wave, owns-files, consumes,
  produces, status).
- The collision rule (verbatim, from Step 4).
- The calibrated budget bands (from Step 2's knob).
- A **seam map**: for each adjacent plan pair (01->02, 02->03, ... and each
  wave boundary), one line naming the shared contract. This is the checklist
  `stitch` runs against after execution.

Also create the live `.orchestration-status.md` tracker (Plan | Wave | Status)
so execution progress is recorded.

### Step 7: Self-Review

Run the `writing-plans` Self-Review on each plan doc, PLUS these cross-plan
checks:

1. **Budget:** every plan lands inside the Step 2 bands (or has a one-line
   note explaining why it is deliberately over/under).
2. **Coverage:** every subsystem from Step 1 maps to a plan. No orphans.
3. **Collisions:** no two same-wave plans share a file. Verified from the
   file sets, not assumed.
4. **Seam integrity:** every `Consumes` matches exactly one `Produces`.
   Nothing consumed is unproduced; nothing is produced twice.
5. **Numbering:** plan numbers are contiguous and match the seam map.

Fix issues inline.

## Execution Handoff

After saving all plans + the index:

> "Wave plan complete: N plans across W waves, saved to
> `docs/superpowers/plans/`. Each plan is budgeted to ~100k execution tokens.
> Two execution options:
>
> 1. **Subagent-Driven (recommended)** -- one subagent per plan, dispatched in
>    parallel within each wave, reviewed at each wave boundary. Use
>    `superpowers:subagent-driven-development`.
> 2. **Inline** -- execute plans one at a time in-session using
>    `superpowers:executing-plans`.
>
> After each wave (or the whole run), run the `stitch` skill on each adjacent
> plan pair to verify the seams executed cleanly.
>
> Which approach?"

## Remember

- One project idea in, many wave-sized plans out.
- ~100k execution tokens per plan is the whole point -- size to it.
- Same-wave plans own disjoint files; the collision rule is binding.
- Seam contracts (Consumes/Produces) are mandatory -- they are what makes the
  plans stitchable and what `stitch` verifies later.
- Each plan body is still just `writing-plans` -- do not reinvent that format.
