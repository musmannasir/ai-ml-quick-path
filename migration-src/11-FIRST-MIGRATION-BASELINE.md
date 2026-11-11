# 11 - First migration: set up the baseline on the new machine

(Last synced {{STAMP}}.) Do this once. After it, the code lives on GitHub and later syncs are just `git pull` / `git push` plus the refreshed md files.

## Step A - Prepare (you, on the new machine)

1. Install Node.js 18+ (22 recommended) and Git. Optional but recommended: Python 3.10+ and the .NET SDK 8+.
2. Copy the whole `migration` folder from the original machine to the new one.
3. Create an empty working folder, for example `C:\dev\ai-ml-quick-path`.
4. Unzip `source-snapshot.zip`. It contains one folder named `ai-ml-quick-path`; move its contents into your working folder so that `package.json`, `CLAUDE.md`, `src/` and `scripts/` are directly inside it.
5. Keep the migration md files in a folder you can point Claude at, for example `C:\dev\migration` (outside the git repository, or in a `migration/` subfolder if you want them versioned too).
6. Create a **private** empty repository on GitHub (no README, no .gitignore, so the first push is clean).

## Step B - Paste this prompt into Claude Code (opened in the working folder)

```text
This is the FIRST migration (baseline) of an existing project, "AI & ML Quick Path: From Concepts to Industry", a
zero-dependency Node.js static site generator. The folder you are in was unzipped from source-snapshot.zip from the
original Windows machine. The migration notes are in <PATH TO MIGRATION FOLDER>. There is no git history yet.

Do these steps in order and report real results after each one. Do not change any lesson, data, style or test file
during the baseline.

1. Read CLAUDE.md, then the migration files 00, 01, 02, 03, 04, 05, 06, 07 and 10 in <PATH TO MIGRATION FOLDER>.
   Summarise in 10 lines what the project is and its rules, so I can confirm you understood.
2. Run: npm install, npm run build, npm run test:static. Then install the Playwright browser (npx playwright install
   chromium) and run npm run test:e2e. Compare the numbers (lessons, pages, capstones, e2e checks = 52) with
   03-content-and-data-inventory.md and 10-sync-log.md. If anything differs or fails, stop and tell me; do not fix yet.
3. Create a .gitignore with: node_modules/, dist/, release/, qa/screenshots/, *.log. Run git init, commit everything as
   "Baseline from original machine <date from 10-sync-log.md>", and show me git status and git log. Then add the
   GitHub remote <MY REPOSITORY URL> and push the main branch. (Ask me for the URL if it is missing.)
4. Tag the commit: git tag baseline-<date> and push the tag.
5. Check which tools exist: node, npm, python, dotnet. Tell me what is missing.
6. Propose, but do not start, the next work using "Verification debts" in 07-open-items-and-next-steps.md
   (compile the C# samples, run the Python samples, review the maths numbers). Wait for my go-ahead.

Rules for all later work are in CLAUDE.md and 08-PROMPT-FOR-CLAUDE-CODE.md. At the end of each session fill in
09-HANDBACK-TEMPLATE.md so the original machine can apply the changes.
```

Replace `<PATH TO MIGRATION FOLDER>` and `<MY REPOSITORY URL>` before pasting.

## Step C - After the baseline

- Every later session starts with `git pull`, then the normal prompt from `08-PROMPT-FOR-CLAUDE-CODE.md`.
- When you want the original machine to catch up: commit and push on the new machine; on the original machine there is no git yet, so either (a) install Git there and `git clone` the repository into a new folder and compare, or (b) bring over the files listed in the handback and let Claude Code apply them. Option (a) is the long-term fix.
- Whenever the original machine changes, click UpdateMigration.exe and copy the new md files (and the zip only if you need the code and are not using GitHub).

## What "baseline" gives you

A tagged commit that exactly equals the original machine's state at the sync time. Any later difference between the two machines can then be measured against it (`git diff baseline-<date>`), and the hashes in `10-sync-log.md` give a second, independent check.
