---
name: safe-push
description: Pre-flight checks before git push -- large files, tests, uncommitted changes, diverged history
---

# Safe Push

Run these checks in order before pushing to any remote. Stop and report if any check fails.

## 1. Large file check

Run:
```powershell
git ls-files | ForEach-Object { Get-Item $_ -ErrorAction SilentlyContinue } | Where-Object { $_.Length -gt 52428800 } | Select-Object FullName, Length | Format-Table
```

If any file exceeds 50MB, STOP and report the filenames. Do not push until the user resolves it (add to .gitignore, use Git LFS, or remove from history).

## 2. Test suite check

Run the project's test command (check package.json scripts for "test"). If tests fail, STOP and report failures. Do not push until tests pass.

## 3. Uncommitted changes check

Run `git status --short`. If any modified or untracked files exist that the user likely intended to include, ask before proceeding.

## 4. Diverged history check

Run `git fetch --dry-run 2>&1` then `git status -b`. If the branch has diverged from the remote (shows "have X and Y different"), ASK the user explicitly: "The branch has diverged from remote. Force-push? (yes/no)". If the user does not confirm with yes, STOP immediately and do not push. Never force-push without explicit confirmation.

## 5. Push

Run `git push`. If the repo has a GitHub remote, report the PR URL using `gh pr view --web` or `gh pr create` if no PR exists yet.

## On success

Report: branch pushed, commit count ahead, any PR URL.
