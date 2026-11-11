# 08 - Prompt for Claude Code on the new machine

(Last synced {{STAMP}}.) Paste everything inside the box below into Claude Code, opened in the project folder (the unzipped `source-snapshot.zip`, or your git clone), with the migration folder available.

```text
You are continuing development of an existing project: "AI & ML Quick Path: From Concepts to Industry", a zero-dependency
Node.js static site generator that builds a free learning website about AI and machine learning with Python and .NET (C#)
examples. It was developed on another Windows machine; this is a second development machine. Both must stay in sync.

Before changing anything:
1. Read CLAUDE.md in the project root (the authoritative rules), then the migration files in this order:
   00-README-START-HERE.md, 01-product-context-and-decisions.md, 02-architecture-and-workflow.md,
   03-content-and-data-inventory.md, 04-design-and-ui.md, 05-environment-and-deployment.md,
   06-testing-and-quality.md, 07-open-items-and-next-steps.md, 10-sync-log.md.
2. Run: npm install, npm run build, npm run test:static, then the browser tests (npx playwright install chromium, then
   npm run test:e2e). Report the real results. Everything must pass before you edit. Compare the counts with file 03.

Rules you must keep (details in CLAUDE.md):
- Honesty: never invent facts, numbers, citations or prices; never claim code ran if it did not; label untested code
  "not run" and add no "Output of" block for it. Worked maths examples must be recomputed and correct.
- The published site has NO external links, scripts, fonts or images. Research may use the internet; record source URLs
  only in CONTENT_SOURCES.md and show title + publisher on the page.
- Plain, simple international English; define terms on first use. Python and .NET example in every lesson.
- Maths is short and practical: the optional collapsible "Applied Maths - Statistics" section (formula, plain words,
  at least two worked examples per topic). Never say the guide has "no maths".
- Layout rule from the owner: diagrams and code always sit BELOW the text, never side by side with text.
- Accessibility (WCAG 2.2 AA, light and dark), no inline styles or scripts, storage key aimlqp.v1.
- After any change: npm run build, npm run test:static, browser tests. Fix failures, do not weaken tests. If a test
  must change because behaviour intentionally changed, say why. Update QA_REPORT.md, the docs in the project root,
  and migration-src/*.md when something a future reader needs to know has changed.

First tasks (unless the owner says otherwise): follow "Suggested first session on the new machine" in 07-open-items-and-next-steps.md:
(a) create the git repository and a .gitignore, (b) compile the C# samples and run the Python samples now that the tools exist,
(c) fix what fails and update the code status in lesson front matter, (d) re-run all checks.

Keeping the machines in sync: at the end of every session, fill in 09-HANDBACK-TEMPLATE.md (copy it to
HANDBACK-<date>.md in the migration folder or the project root): files changed, decisions, test results, anything unfinished.
Also add the lines you changed to the project's migration-src notes if they affect context (decisions, architecture, open items).

The task for this session: <WRITE YOUR TASK HERE>
```

Tips: keep the migration folder out of the public site (it is not under `public/` or `src/`, so the build never publishes it). The folder `migration-src/` inside the project is normal source; commit it.
