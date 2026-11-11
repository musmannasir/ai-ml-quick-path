# 07 - Open items and next steps

(Last synced {{STAMP}}. Edit this file in the project at migration-src/ when the list changes.)

## Verification debts (best done first on the new machine, it has more tools)

1. **Compile every C# sample.** Install the .NET SDK, create a scratch console project per lesson (or run `dotnet script`), and fix compile errors. Then change the `code:` front matter from "C# not compiled" to "C# compiled <date> (.NET <version>)". Run `npm run extract:code` afterwards.
2. **Run all Python.** Install Python 3.10+, numpy, pandas, scikit-learn. Run `npm run test:examples`. Then run the snippets added on 2026-11-05 (agent loop in app-genai-agentic; technique snippets in dl-training, dl-vision, dl-rl, ml-algorithms, ml-unsupervised, llm-finetune). Where useful, add real `Output of ...` blocks copied from the run and update the `code:` front matter.
3. **Review the Applied Maths numbers.** Have a statistician or ML engineer check the worked examples, or re-run each calculation in Python. Treat any mismatch as a bug.
4. **Test in more browsers:** Safari/WebKit and real phones; automated Firefox is not possible with stock Playwright, use a real Firefox. Add a screen-reader pass (NVDA/VoiceOver).
5. **Independent subject-matter review** of all lesson text (technical accuracy, plain-English quality).

## Product ideas not yet done

- A single "Training techniques" overview page listing every technique with a one-line explanation, the maths panel link, the code link and the capstone (offered to the owner, not requested yet).
- More capstones for gaps: reinforcement learning, distributed training, preference tuning (DPO) as its own project (currently only a stretch goal in c08).
- Applied Maths panels exist for 47 of 50 lessons (s-setup and app-frameworks are tooling only; app-genai-agentic has its own). Revisit if the owner wants them everywhere.
- Capstone grid on the projects page leaves a partial last row (8 cards in 4 columns fits now, but check on other widths).
- 404 page is short (spare space). Phone order of the part pages: key-term chips come before the "at a glance" panel; the owner may want the reverse.
- Public hosting set-up: pick a host, set `SITE_URL`, upload `dist/`, confirm security headers apply (see DEPLOYMENT.md).
- Put the project under git; add CI that runs build + static + e2e.
- Possible: a downloadable PDF edition, a printable cheat-sheet per part.

## Known limitations

See 06-testing-and-quality.md and CLAUDE.md section 8.

## Suggested first session on the new machine

1. Unzip, `npm install`, build, static test, e2e (all must pass before you change anything; compare with the counts in 03 and the totals in 10-sync-log.md).
2. Create the git repository and push.
3. Work through "Verification debts" 1 and 2 (they need only Python and .NET).
4. Then pick product ideas with the owner.

## AdSense follow-ups (added 2026-11-05)

- Owner: choose the domain (`SITE_URL`) and host. Hosting decides how security headers and the CSP are set.
- Stage 1: build with `ADSENSE_CLIENT` and `SITE_URL`, deploy, request AdSense review. Stage 2 after approval: consent message in the AdSense account, create 3 ad units, build with `ADS_SLOTS=on` and the slot ids.
- The AdSense build sends the CSP as Report-Only (Google supports only a strict nonce CSP). Revisit when the host is chosen.
- Never tested against the real AdSense service: only the build output and static checks were verified with fake ids. Check the live site after approval (layout shift, console CSP reports, consent message).
- A contact page was not added; set `CONTACT_EMAIL` to show an address on the privacy page. AdSense reviewers may expect one.
- The e2e suite is for the default (no-ads) build. Add an ads-build e2e (slot placement, contrast of the label, no horizontal scroll) once real ids exist.
