# 09 - Handback template (new machine -> original machine)

(Last synced {{STAMP}}.) Copy this file to `HANDBACK-<YYYY-MM-DD>.md`, fill it in at the end of a session on the other machine, and carry it back with the changed files (or push to GitHub). On the original machine, give Claude Code this file and say: "Apply this handback to the project, then run build, static, e2e and the deploy script."

```markdown
# Handback <YYYY-MM-DD> from <machine name>

## Starting point
- Based on migration sync of: <STAMP from 00-README or last entry of 10-sync-log.md>
- Git commit (if used): <hash>

## Summary (3 to 6 lines, plain words)

## Files added / changed / removed
- added:
- changed:
- removed:

## Decisions made (and why)

## Test results (real output)
- npm run build:
- npm run test:static:
- browser tests (which browser, how many passed):
- npm run test:examples / extract:code (if run):
- C# compile results (if run):

## Content status changes
- Lessons whose code status changed (not run -> executed / compiled):
- New or changed numbers, facts or sources (add URLs to CONTENT_SOURCES.md):

## Counts after the session
- lessons / capstones / cases / glossary terms / diagrams:

## Unfinished or risky
-

## What the original machine must do
- apply files, run checks, run scripts/deploy.ps1, rerun UpdateMigration.exe
```

## Rules for applying a handback

1. Compare the changed-file list with `10-sync-log.md` to be sure the original machine did not change the same files in the meantime. If it did, merge by hand.
2. Apply, then `npm run build`, `npm run test:static`, `npm run test:e2e:edge`.
3. If counts changed (lessons, capstones), update the hard-coded counts in tests and docs (see 02 "Adding things").
4. Run `scripts/deploy.ps1`, then run UpdateMigration.exe so the pack reflects the merged state.
