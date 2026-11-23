# Design system (2026-11)

One stylesheet (`public/assets/app.css`), one script (`public/assets/app.js`), no images, no web fonts, nothing from other sites.
The look is the owner's 2026-11-11 choice: teal accent, flat surfaces, thin dividers.

## Tokens: one source

All theme values live in `src/design/tokens.mjs`. The build writes them at the top of `dist/assets/app.css` as three blocks
(light, dark by system setting, dark by manual switch), so dark values are typed once. Never write a colour in `app.css`.

| Group | Tokens | Use |
|---|---|---|
| Surfaces | `--bg`, `--surface`, `--surface-2`, `--surface-3` | page, cards, quiet fills |
| Text | `--ink`, `--ink-2`, `--ink-3` | body, secondary, muted (all 4.5:1 or better on their surfaces) |
| Lines | `--line`, `--line-strong` | dividers, field borders |
| Accent | `--accent`, `--accent-ink`, `--accent-soft`, `--link`, `--link-visited` | actions and links |
| Tracks | `--applied` (teal, Quick path), `--ml` (blue), `--lm` (violet), each with `-soft` | roadmaps, tabs, legends. A track always has a text label too |
| Status | `--ok-*`, `--warn-*`, `--bad-*` | pills and callouts. Every status also carries words ("C#: compiled") |
| Focus | `--focus`, `--focus-halo` | 3 px ring plus halo on every control |
| Code and maths | `--code-bg`, `--code-ink`, `--math-bg`, `--math-line` | code figures, maths moments |
| Type | `--sans`, `--mono`, `--fs-0` to `--fs-5`, `--lh-tight`, `--lh-body` | system fonts only |
| Space and shape | `--s-1` to `--s-7` (4 px steps), `--radius`, `--radius-lg` | spacing and corners |
| Layout | `--top`, `--sb`, `--rail`, `--measure` (72ch) | top bar, sidebar, side panel, text line length |

## Layout rules

- Lesson text is **one column**, at most `--measure` wide. Diagrams, code and tables may use the full lesson width (60rem).
  (Owner priority 2026-11-13; replaces the two-column prose of 2026-11-04. Diagrams still sit below text, never beside it.)
- From 1200 px the side panel (contents, facts) sits to the right and stays in view. Below that it moves under the lesson, so
  reading starts right after the header.
- Below 1024 px the course list is a drawer. No page scrolls sideways from 320 to 1920 px; wide tables and code scroll inside their own box.
- Numbered sections have one definition (search for "Numbered sections" in `app.css`) shared by lessons and the about, quiz, case and capstone pages.

## Components added in this upgrade

| Component | Markup | Notes |
|---|---|---|
| Maths moment | `<aside class="math-moment">` from a ` ```maths ` block | Situation, question, numbered hand steps, answer, formula, why, caution, calculator, "try one change" with a revealed answer, optional deeper note. Steps are checked by the build |
| Calculator | `.mm-widget[data-widget]` | Hidden until the script runs; number inputs with bounds, an error message, Reset, and a live text result. The worked steps above are the no-script fallback |
| Code language switch | `fieldset.lang-switch` | Radio group: Both, Python, C#. Sets `data-lang` on `<html>`; keeps the reader's place; a deep link to a hidden section shows both |
| Code evidence line | `.code-evidence` | Pill plus one sentence taken from `qa/code-status.json` |
| Reference list | `.refs`, `a.ext` | Outside links from the register, each with publisher and the last link-check result |
| Start chooser | `.persona-grid` | Four cards; plain links without script, a "use this starting point" button with it |
| Resume card | `#resume-card` | Shown on the home page when a lesson was opened before |
| Search results | `.search-group`, `.res-snippet`, `mark` | Titles first, then matches inside lessons with the words marked |

## States on `<html>`

`data-theme` (light, dark; absent means system), `data-sidebar="hidden"`, `data-focus="on"`, `data-rail="hidden"`,
`data-lang` (python, cs; absent means both). All are restored by the small inline script before first paint.

## Accessibility checklist for new components

Real buttons and form fields; visible focus; state in words, not colour alone; `aria-live` on results; inputs have labels,
bounds and `aria-invalid`; nothing needs a pointer; `forced-colors` keeps borders and selection visible; print hides controls
and keeps the worked steps. Automated checks cover contrast, keyboard reach and overflow; a screen-reader pass has not been done.

## Not changed, still to review

Roadmap, plan, hardware, glossary and assessment templates were not redesigned in this pass. Older layered rules remain in
`app.css` for those pages (for example the two "Layout" blocks from 2026-11-04); they were left alone to avoid untested regressions.
