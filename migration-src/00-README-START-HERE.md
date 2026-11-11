# 00 - Migration pack: START HERE

**Project:** AI & ML Quick Path: From Concepts to Industry (a free, static learning website)
**Last synced:** {{STAMP}} on the original Windows machine (A2DEV2011)
**Current size:** {{LESSONS}} lessons in {{PARTS}} parts, {{PROJECTS}} capstone projects, {{CASES}} company cases, {{GLOSSARY}} glossary terms, {{DIAGRAMS}} diagrams, {{PAGES}} HTML pages. {{MATHLESSONS}} lessons carry an "Applied Maths - Statistics" section ({{MATHTOPICS}} topics). About {{HOURS}} hours of study.

This folder lets you continue developing the whole guide on another machine (one with more internet access, GitHub and so on) and keep both machines in sync.

## Files in this pack

| File | What it holds | Kept by |
|---|---|---|
| 00-README-START-HERE.md | This file: how to use the pack and keep two machines in sync | hand-written + counts |
| 01-product-context-and-decisions.md | What the product is, audience, the rules, owner decisions in order, history of the work | hand-written |
| 02-architecture-and-workflow.md | Code layout, build pipeline, content model, commands, how to add things | hand-written |
| 03-content-and-data-inventory.md | Every lesson, roadmap, capstone, case, glossary term, with counts | **generated** |
| 04-design-and-ui.md | Design system, layout rules, accessibility, report-style look, theme tokens | hand-written + generated tokens |
| 05-environment-and-deployment.md | The Windows/IIS set-up, tools present and missing, what to install on the new machine | hand-written |
| 06-testing-and-quality.md | Definition of done, tests, known limits, what was never verified | hand-written + generated list |
| 07-open-items-and-next-steps.md | Honest list of unfinished work and ideas | hand-written |
| 08-PROMPT-FOR-CLAUDE-CODE.md | The text to paste into Claude Code on the new machine | hand-written |
| 09-HANDBACK-TEMPLATE.md | How the new machine reports its changes back | hand-written |
| 11-FIRST-MIGRATION-BASELINE.md | One-time steps and prompt to set up the new machine from source-snapshot.zip and push to GitHub | hand-written |
| 10-sync-log.md | One entry per run of UpdateMigration.exe: what changed since the last run | **generated, appended** |
| source-snapshot.zip | A full copy of the source (no node_modules, no dist, no screenshots) | **generated** |
| UpdateMigration.exe | Refreshes everything above from the live project | tool |

## Moving to the new machine (first time)

1. On the original machine, double-click **UpdateMigration.exe** (it refreshes this whole folder).
2. Copy the whole `migration` folder to the new machine (USB, cloud drive or GitHub).
3. Unzip `source-snapshot.zip` into your working folder. Run `npm install` there (the only dev dependency is Playwright).
4. Open the project in Claude Code and paste the prompt from **08-PROMPT-FOR-CLAUDE-CODE.md**. Claude reads these files first, then works.
5. (Recommended) Put the project on GitHub: `git init`, commit, push. The snapshot has no git history because the original machine had no repository.

## Keeping both machines in sync

There is no automatic sync. Use this simple, safe loop so nothing is lost:

- **Original machine -> new machine:** run UpdateMigration.exe, copy the folder, unzip the snapshot (or `git pull` if you use GitHub). `10-sync-log.md` shows what changed since last time.
- **New machine -> original machine:** at the end of a work session, ask Claude Code on the new machine to fill in `09-HANDBACK-TEMPLATE.md` (list of files changed, decisions, test results) and commit/push. On the original machine, give Claude Code that handback file and the changed files (or pull from GitHub) and ask it to apply them, then run the checks and the deploy script.
- Only one machine should edit the same file at the same time. If both did, compare with `10-sync-log.md` hashes and merge by hand (a git repository makes this much easier).
- The rules in CLAUDE.md (project root) are the single source of truth for how to work. If a rule changes, change it in CLAUDE.md and in `migration-src/` on the original machine, then rerun the exe.

## How UpdateMigration.exe works

- It is a small launcher. It runs `node scripts/migration-sync.mjs` inside the project (default path D:\AI\GuideApp\ai-ml-quick-path-source-2026-11-04, or the path written in `project-path.txt` next to the exe).
- It rereads the real lesson, data and test files, rewrites the generated files (03, the counts here, the theme tokens in 04, the test list in 06), copies the hand-written files from the project folder `migration-src/`, appends a new entry to `10-sync-log.md`, and rebuilds `source-snapshot.zip`.
- The hand-written files are edited in the project at `migration-src/*.md` (not in this folder, because this folder is overwritten on every run). Claude Code on the original machine updates them whenever a change needs explaining.
- It needs Node.js installed (it is, on the original machine). It never changes lesson content and never deploys anything.
