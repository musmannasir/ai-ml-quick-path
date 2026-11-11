# 04 - Design and UI

(Last synced {{STAMP}}. A generated appendix with the real theme tokens is at the bottom.)

## Principles

Professional, readable, report-like. One stylesheet (`public/assets/app.css`), one script. No images, no web fonts, no CDNs. WCAG 2.2 AA contrast (4.5:1 text) in **light and dark** themes; the e2e test measures contrast on all pages.

## Theme

- Tokens are CSS custom properties at the top of app.css. Dark values are defined **twice**: inside `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])` and inside `[data-theme="dark"]`. Never hard-code colours; use tokens such as `--bg`, `--surface`, `--surface-2`, `--ink`, `--ink-2`, `--ink-3`, `--line`, `--accent`, `--accent-soft`, `--link`, `--ok-bg/ok-ink`, `--warn-bg/warn-ink`, `--bad-bg/bad-ink`.
- State attributes on `<html>`: `data-theme` (light|dark, absent = system), `data-sidebar="hidden"`, `data-focus="on"`.
- Theme choice persists in localStorage; the site works with storage blocked.

## Type and layout

- Body 17px (18px from 1680px wide, 16px under 380px). System font stack. Prose measure up to about 76ch in lessons, up to 100ch on other pages; intro text up to about 110ch.
- Sidebar tree on the left (collapsible groups, filter box, Expand/Collapse all). Below 1024 px the sidebar is a drawer (scrim, `inert` main, Escape closes, focus returns).
- Lessons use `.lesson-layout` with a sticky `.lesson-rail` (facts, contents, prerequisites) at 1200 px and wider.
- **Owner rule:** wide screens put lesson prose sections (In plain words, Real-world example, How it works, Common mistakes) into **two text columns** when the lesson body is 880px or wider; headings, diagrams, code, tables and callouts span the full width and sit BELOW the text. Text and diagrams are never side by side.
- About, assessment, case and capstone pages use two columns (`.content.cols`, from 1500px). Plan, roadmap and glossary use grid layouts. Card-like list items must override the prose max-width with a `.content`-prefixed rule, otherwise `.content li {max-width:80ch}` wins.
- No document-level horizontal scroll from 320 to 1920 px; wide content goes in `.table-wrap` (scrollable region) or `.stack-on-mobile`. Pills and chips must be allowed to wrap on phones.
- Supports container queries with `@supports not (container-type…)` fallbacks.

## Report style (copied from the owner's AssistBot architecture report)

- Every lesson section is a bordered panel with a numbered blue badge heading (CSS counters `sec` for lessons and `sec2` for cards pages).
- Callouts have a coloured left bar (note = accent, warning = warn, expected output = ok).
- Tables: tinted header row, cell borders from 721px up.
- Lesson facts show Python/C# status as **pills** (`pill-ok`, `pill-warn`, plain) built by `codeStatus()` in build.mjs from the `code:` front matter.
- Not copied from that report: its filter bar, zoom button and CDN diagram library (external scripts are not allowed).

## Diagrams

Rendered by src/lib/diagram.mjs to `<figure class="diagram dgt-<type>" role="group" aria-labelledby="dg-N"><figcaption id="dg-N">`. Styles are at the end of app.css (`.dg-*`). Colours by item kind (input, process, model, output, store, warn, bad) use theme tokens, so they work in both themes. Group titles render as `<p class="dg-col-title">` (not headings) to keep heading order valid. Number of columns adapts to the container width.

## Applied maths panels

`<details class="maths-item">` per topic, inside `<div class="maths-list">`; the formula is `<div class="formula">` with a left accent bar, uppercase small title and a monospace pre-wrapped body. "Open all topics" / "Close all topics" buttons reuse the generic expand/collapse handler. Printing opens every `<details>`.

## Part (overview) pages

Wide intro, key-term chips for the part's glossary terms in the left column, and a "This part at a glance" panel on the right (lesson count, study time, level mix, comes after / leads to, capstones using the part). All values are computed from data, nothing hand-typed. On phones the panel stacks under the intro.

## Accessibility checklist the tests enforce

Skip link first in tab order; real `<button>`s for actions and `<a>` for navigation; accessible names on all controls; visible focus; `aria-expanded` in sync; one `<h1>` per page; heading levels never skip; unique ids; every diagram has a caption; contrast in default and dynamic states; reduced layout shift; zoom to 200% (640 px width) without horizontal scroll.

## Collapsible side panels (2026-11-05, second machine)

Lesson rail cards ("Lesson facts", "On this page") and the part page "This part at a glance" panel are `<details class="rail-details" open>` with the existing `h2` inside the `<summary>` (heading order stays valid). Each lesson has a `#rail-toggle` button ("Hide side panel" / "Show side panel") that sets `data-rail="hidden"` on `<html>`, hides `.lesson-rail` and gives the lesson text the full width. The choice is stored as pref `rail` in `aimlqp.v1` and restored by the inline theme script before first paint (so the CSP hash of that script changed; restart `npm run serve` after a rebuild, because it reads `_headers` once at start). Focus mode and print hide the button.

Edge tabs (2026-11-05): `#sidebar-edge` (left, every page, from 1024 px) and `#rail-edge` (right, lessons only, from 1200 px) are fixed slim buttons that call the existing Contents toggle and rail toggle, so both panels can slide away to their own side and the page uses the full screen. Their `aria-expanded` and `aria-label` follow the panel state; they are hidden in focus mode, in print and below the breakpoints (the drawer and the "Hide side panel" button remain there).

## Theme: teal accent, lighter weight (owner decision 2026-11-11)

The team reviewed ten accent colours and two visual weights and chose the recommended pair: **teal** accent and the **lighter** weight.
- Light: accent and link `#0f766e`, soft tint `#e7f1f0`, focus `#0f766e`. Dark: accent and link `#2dd4bf`, soft tint `#1a3a3e`, focus `#5eead4`. Visited-link colours unchanged.
- Track colours: the main "Quick path" track (`--applied`) now follows the accent; the ML track (`--ml`) took over the former blue (`#1a56b0` light, `#82b4ff` dark); the language-model track (`--lm`) is unchanged.
- Lighter weight: `--shadow` is `none`, `--radius` is 6 px, and lesson/about/case/capstone section panels are flat (thin bottom divider, outlined number badge) instead of shadowed boxes. These overrides sit in the last block of `app.css`.
- Status colours (ok green, warn amber, bad red) are separate from the accent and unchanged.
- Result: build 92 pages, static passed, e2e 52/52 (includes the contrast measurement in both themes).

Scrollbars (2026-11-11): the last block of `app.css` sets `scrollbar-width: thin` and a thumb from `--line-strong` on a transparent track for every scroll area; sidebar, side panel, search results, tables and code blocks turn the thumb accent-coloured on hover. A `::-webkit-scrollbar` fallback runs only where `scrollbar-color` is unsupported.
