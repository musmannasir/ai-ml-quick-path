# 01 - Product context and decisions

(Last synced {{STAMP}}.)

## What the product is

A free, static learning website for people **new to AI**. It gives the quickest complete grip on AI and machine learning: every main concept in plain words, how industry uses it, and working examples in **both Python and .NET (C#)**, ending with the skills to plan and build real AI/ML systems. Title: "AI & ML Quick Path: From Concepts to Industry".

Audience: beginners with no AI background who can program a little (or are learning). They want to build industry AI/ML applications. They do not want heavy mathematics, so maths is short, practical and collapsible.

Sibling projects that share the code base (keep them separate): "AI, ML & Language Model Engineering Academy" (for .NET developers, storage key `aiea.v1`) and "Complete AI Academy" (for CS graduates, with full maths, key `caia.v1`). This site uses storage key `aimlqp.v1` and export schema `aimlqp-progress`.

## Structure (current)

7 parts: 1 The big picture, 2 Data, 3 Machine learning, 4 Deep learning, 5 Large language models, 6 AI applications, 7 Production. {{LESSONS}} lessons in total, {{PROJECTS}} capstone projects (c01-churn, c02-forecast, c03-vision, c04-rag-assistant, c05-agent, c06-tiny-llm, c07-local-assistant, c08-lora-finetune), {{CASES}} real company cases, {{ROADMAPS}} roadmaps (`applied` Quick path, `ml` ML engineer view, `lm` AI engineer view), a 12-week plan, a decision guide ("solve"), a maths map, hardware guide, glossary, assessment quizzes and a progress page. Full list: 03-content-and-data-inventory.md.

## Non-negotiable principles

1. Real teaching content, never placeholders.
2. Honesty: never invent case-study facts, metrics, citations, benchmarks or prices. Never claim code ran if it did not. Every number quoted from a real-run output must come from a real run. Worked maths examples are labelled as made-up/illustrative hand calculations.
3. Plain international English: short sentences, define every term on first use, concrete inputs and outputs. No patronising labels. Durations are study estimates; quizzes are self-checks.
4. Privacy: no backend, no sign-in, no analytics, no external scripts, fonts or images.
5. Accessibility: WCAG 2.2 AA in light and dark themes, keyboard operable, no horizontal page scroll from 320 to 1920 px.
6. Layout: use the full screen but keep prose lines near 80 to 100 characters.
7. **Self-contained: no external links** anywhere on the site. The build fails on any `https://` link in content; the static test fails on any external href/src or web address in visible text (only localhost / 127.0.0.1 inside code samples is allowed). Company case sources are shown as title + publisher text; their URLs live only in CONTENT_SOURCES.md.
8. Python and .NET (C#) examples in every lesson.

Note for the new machine: you have internet access there, but the rule above still holds for the **published site**. Fetch sources while researching, record the URL in CONTENT_SOURCES.md, and show only title + publisher on the page.

## Owner decisions, in the order they were made (this is the history)

1. Browser tests must run in the installed Microsoft Edge (Playwright's Chromium download was blocked by a certificate error). `npm run test:e2e:edge` is part of the definition of done.
2. Deploy to the local IIS site "AIGuide" (machine A2DEV2011) after every change. The folder `D:\AI\GuideApp\deploy` holds the deployed site. An exe-based host was built first, then **removed** at the owner's request: the deploy folder is now plain static files plus a generated `web.config`, because the owner plans to upload it to a public static host.
3. Every concept in every lesson gets diagrams (at least 3 per lesson; now {{DIAGRAMS}} in total). Renderer is built in (src/lib/diagram.mjs): accessible HTML+CSS, no images or scripts.
4. Fix white space, make the site mobile/tablet/cross-browser friendly, improve fonts. Explicit rule from the owner: **diagrams stay BELOW the text; never place text and a diagram side by side.** Empty space beside text is filled with more text (prose flows into two columns on wide screens).
5. Four checklist images (LLM basics, RAG, Agents, Evals and Ops; 60 concepts) were checked against the guide; every missing concept was added (as `### Related concepts` bullets and `####` sections inside lessons).
6. Formatting copied from the owner's AssistBot architecture report: numbered panels with badge headings, left-bar callouts, status pills, tinted bordered tables.
7. Overview/part pages: empty space fixed by expanding text (wide intro, "This part at a glance" panel, key-term chips).
8. **2026-11-05: "no maths" removed.** The guide no longer claims to teach no maths. Where maths or statistics applies, a lesson has a collapsible **Applied Maths - Statistics** section: main formula, plain-words meaning and at least two worked examples per topic ({{MATHLESSONS}} lessons, {{MATHTOPICS}} topics). "Maths behind it (names only)" was renamed "Maths behind it". The maths names page is now "Maths map". CLAUDE.md rule 1 was rewritten to match.
9. Added the advanced lesson **app-genai-agentic** "Generative AI and Agentic AI: the whole picture" (Part 6, last group), in very simple English.
10. Added the missing training techniques (batch normalisation, gradient clipping, learning-rate schedule, transfer learning, data augmentation, bagging, k-means update, QLoRA, DPO, RLHF, epsilon-greedy) each with explanation, diagram, maths panel, Python and C# snippets, plus the new capstone **c08-lora-finetune**.
11. Now: this migration pack, so development can continue on a second machine with internet and GitHub, with both machines kept in sync.

## The standing rule about deployment

After every requested change on the original machine, once build + static + Edge e2e pass, run `powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1` (elevated) and report the smoke test. On the new machine this deploy step is optional (it is IIS-specific); the build output `dist/` is a complete static site.

## Who to ask / ownership

Owner: Usman Nasir (m.usmannasir@outlook.com). The work so far was done by Claude Code (several parallel sub-agents authored lesson content under direction; see 07 for what was and was not independently reviewed).

## Decision 12 (2026-11-05, second machine): AdSense and external links allowed in future

The owner will host the site publicly and earn with Google AdSense, and may add external reference links later. The default build stays fully self-contained. AdSense is an optional build mode driven by environment variables (`ADSENSE_CLIENT`, `SITE_URL` required, `ADS_SLOTS`, `AD_SLOT_*`); see CLAUDE.md section 9. Ad slots are OFF until the owner reports AdSense approval. A new page `privacy.html` (Privacy and cookies) was added (92 pages). Design reference chosen for the layout: Stripe docs (left navigation, central content, right rail), which the site already follows.
