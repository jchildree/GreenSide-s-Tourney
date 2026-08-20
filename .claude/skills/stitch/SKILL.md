---
name: stitch
version: "1.0"
category: superpowers
execution_speed: medium
token_efficiency: medium
triggers:
  - "stitch the plans"
  - "check the seam"
  - "verify plans fit together"
  - "look for scars"
  - "stitch plan"
cache_key: "stitch-1.0"
dependencies:
  - parallel-wave-planning
  - verification-before-completion
disable-model-invocation: false
description: >
  Use AFTER two or more plans have been executed, to verify that adjacent
  plans fit together coherently and completely -- with no "scar" at the seam
  where one plan's work meets the next. Treats the last ~30% of Plan N plus
  the first ~30% of Plan N+1 as its own mini-plan and verifies it for
  functionality and completeness, then removes, fixes, or wires up any scars.
  Trigger on "stitch the plans", "check the seam", "verify plans fit
  together", "look for scars".
---

# Stitch

## Overview

Two plans can each pass their own tests in isolation and still leave a
**scar** where they meet: a dropped contract, duplicated helper, orphaned
scaffolding, missing glue, or a test gap that nobody's suite covers because
each plan only tested its own half. `stitch` runs after execution, looks at
the seam between adjacent plans as if it were a single mini-plan, and verifies
it end to end for functionality and completeness -- then fixes what it finds.

The seam window is deliberately narrow: **the last ~30% of Plan N through the
first ~30% of Plan N+1.** That's where integration debt collects. The middle
of each plan is self-contained and already verified by its own run; the edges
are where two separate execution sessions had to agree without talking.

**Announce at start:** "I'm using the stitch skill to verify the seam between
Plan N and Plan N+1."

**This skill edits code.** It is not a read-only report -- it removes, fixes,
and wires up. Run it on a branch, commit the stitch fixes separately from the
plan work so the seam repairs are legible in history.

## Which pairs to stitch

- **Sequential plans:** stitch each consecutive numbered pair (01->02,
  02->03, ...).
- **A parallel wave:** the plans within a wave own disjoint files, so they
  have no direct seam with each other -- but each has a seam with the plans in
  the NEXT wave that consume from it. Stitch every (Wave N plan -> Wave N+1
  plan) pair listed in the orchestration index's seam map.
- Read `docs/superpowers/plans/00-orchestration-index.md` first: its seam map
  tells you exactly which pairs exist and what contract each shares.

## The Process

### Step 1: Compute the seam window

For the pair (Plan N, Plan N+1):

1. Count the tasks in each plan (the `### Task K:` headers).
2. Window = the **last ceil(30%)** of Plan N's tasks, through the **first
   ceil(30%)** of Plan N+1's tasks. Round up, and always include at least the
   final task of N and the first task of N+1.
   - Example: Plan N has 10 tasks -> last 3 (Tasks 8, 9, 10). Plan N+1 has 6
     tasks -> first 2 (Tasks 1, 2). Window = N.8-10 + (N+1).1-2.
   - Example: Plan N has 4 tasks -> last 2 (ceil(1.2)=2, Tasks 3, 4). Plan N+1
     has 4 -> first 2. Window = N.3-4 + (N+1).1-2.
3. If the plans declared **Consumes/Produces** seam contracts (they should, if
   built with `parallel-wave-planning`), the contract IS the spec for this
   window -- pull it into view alongside the tasks.

### Step 2: Read the window as one mini-plan

Gather, for only the files touched by the windowed tasks:

- The plan text for those tasks (both plans).
- The **actual executed code** now in the tree -- current file state, not what
  the plan said would happen. Plans drift during execution.
- `git log --oneline -- <seam files>` to see what each plan's execution
  actually committed at the seam.

Now hold the whole seam in context at once and ask: *if this window were a
single plan I was verifying, is it functionally complete and correct?*

### Step 3: Hunt scars

Check the seam against this taxonomy. Each is a real defect two isolated plans
routinely produce:

| Scar                | Symptom at the seam                                        |
|---------------------|-----------------------------------------------------------|
| Contract mismatch   | N+1 calls the artifact N produced with the wrong shape/name/arity, or a different return type than N actually delivered. |
| Missing glue        | Both plans assumed the OTHER wired the integration; nothing actually connects them (route not registered, component not mounted, handler not subscribed). |
| Orphaned scaffolding| N built a placeholder/stub that N+1 replaced, but N's version is still in the tree, still imported, or still routed. |
| Duplicate impl      | Both plans built the same helper/type/util independently. Two sources of truth now drift. |
| Naming drift        | Same concept, two names across the seam (`clearLayers` vs `clearFullLayers`, `actorId` vs `userId`). Compiles, confuses. |
| Half-migration      | N+1 migrated some callers to the new path but left N's old path live and reachable. |
| Test gap            | Each plan's tests pass alone; nothing exercises N's output flowing INTO N+1's input. The seam has zero coverage. |
| Status drift        | A tracker/status doc says both plans are "done" while the seam is functionally incomplete. |

Verify the Consumes/Produces contract literally: does the produced artifact,
as it exists in the tree now, match what the consumer expects, as it calls it
now? Not as the plans described -- as the code is.

### Step 4: Fix the scars

Apply the smallest fix that closes each scar, at the seam:

- Contract mismatch -> reconcile to ONE shape; update the fewer-callers side.
- Missing glue -> add the single wiring point (register/mount/subscribe).
- Orphaned scaffolding -> delete it and its imports/routes. Deletion is a fix.
- Duplicate impl -> keep one, delete the other, repoint callers.
- Naming drift -> pick one name, rename across the seam.
- Half-migration -> finish it or revert it; do not leave both paths live.
- Test gap -> add ONE test that exercises the seam (N's output -> N+1's input),
  not a full suite.
- Status drift -> correct the tracker to reflect real state.

Fix at the shared point, not in every caller (root cause, not symptom).

### Step 5: Verify

Per `verification-before-completion` -- evidence before claims:

1. Run the seam test you added (or the existing tests that span both files).
2. Run each plan's own test command to confirm you did not regress either half.
3. If there is a runnable end-to-end path across the seam (a request that hits
   N's output and N+1's consumer), exercise it and observe the real result.

Paste the actual output. Do not claim the seam is clean without it.

### Step 6: Report

Output a compact seam report:

```
Seam: Plan 03 (backend) -> Plan 05 (frontend)
Window: 03.T4-6 + 05.T1-2
Scars found: 3
  - [contract] capture_signature returned SignatureRef; CAPCloseModal expected {id}. FIXED: unwrapped .id at call site.
  - [orphaned]  Plan 03 left stub_sign() + its route. FIXED: deleted (commit abc123).
  - [test-gap]  no test crossed the seam. FIXED: added test_cap_close_signs_via_backend.
Verify: backend 121/121 PASS, frontend 76/76 PASS, seam test PASS.
Clean: yes.
```

Then move to the next pair.

## Remember

- The seam is the last ~30% of N through the first ~30% of N+1 -- by task count,
  rounded up, always including N's last task and N+1's first task.
- Verify against the code as it IS, not as the plans said it would be.
- Consumes/Produces contracts are the seam spec; check them literally.
- This skill deletes and rewires -- it is a fix pass, not a report. Commit the
  repairs separately.
- Evidence before "clean": run the tests, paste the output.
