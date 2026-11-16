// Design tokens: the ONE place where theme values are defined.
// The build turns this file into the token block at the top of dist/assets/app.css, so the dark values are
// written once here instead of twice in the stylesheet (once for the system setting, once for the manual switch).
// Rules: never hard-code a colour in app.css; add a token here. Text on its background must reach 4.5:1 in both
// themes (tests/e2e.mjs measures it). Track colours: Quick path = teal, ML = blue, language models = violet.

export const STATIC = {
  // Type
  '--sans': 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif',
  '--mono': 'ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  '--fs-0': '.8125rem', '--fs-1': '.875rem', '--fs-2': '1rem', '--fs-3': '1.125rem', '--fs-4': '1.3rem', '--fs-5': '1.6rem',
  '--lh-tight': '1.25', '--lh-body': '1.65',
  // Space (4 px steps) and shape
  '--s-1': '.25rem', '--s-2': '.5rem', '--s-3': '.75rem', '--s-4': '1rem', '--s-5': '1.5rem', '--s-6': '2rem', '--s-7': '3rem',
  '--radius': '6px', '--radius-lg': '10px',
  // Layout
  '--top': '56px', '--sb': '272px', '--measure': '72ch', '--rail': '17.5rem',
  '--shadow': 'none',
};

// name: [light, dark]
export const COLOURS = {
  // Surfaces and text
  '--bg': ['#f5f7fa', '#0f141a'], '--surface': ['#ffffff', '#161d25'], '--surface-2': ['#eef2f6', '#1d2630'], '--surface-3': ['#e3e9f0', '#26313d'],
  '--ink': ['#142030', '#e8edf2'], '--ink-2': ['#3c4a5c', '#b9c4cf'], '--ink-3': ['#56657a', '#a3afbc'],
  '--line': ['#d3dbe5', '#2f3b48'], '--line-strong': ['#9aa8b8', '#5d6b7a'],
  // Accent (teal) and links
  '--accent': ['#0f766e', '#2dd4bf'], '--accent-ink': ['#ffffff', '#0b1220'], '--accent-soft': ['#e7f1f0', '#1a3a3e'],
  '--link': ['#0f766e', '#2dd4bf'], '--link-visited': ['#5a3e9e', '#c3b3ff'],
  // Tracks
  '--applied': ['#0f766e', '#2dd4bf'], '--applied-soft': ['#e7f1f0', '#1a3a3e'],
  '--ml': ['#1a56b0', '#82b4ff'], '--ml-soft': ['#e4edfa', '#1b2a40'],
  '--lm': ['#5b45ad', '#b8a8ff'], '--lm-soft': ['#ece8f9', '#262043'],
  // Status (separate from the accent; never the only signal: each status also has a word or an icon)
  '--ok-ink': ['#17643a', '#8ee0ad'], '--ok-bg': ['#e3f4ea', '#12301f'],
  '--warn-ink': ['#6a4300', '#f2cf86'], '--warn-bg': ['#fdf2dc', '#2f2510'],
  '--bad-ink': ['#a12a2a', '#ffaaaa'], '--bad-bg': ['#fbe7e7', '#3a1919'],
  // Focus ring (ring colour and the halo that separates it from any background)
  '--focus': ['#0f766e', '#5eead4'], '--focus-halo': ['#ffffff', '#0f141a'],
  // Code and maths surfaces
  '--code-bg': ['#f1f4f8', '#111820'], '--code-ink': ['#142030', '#e8edf2'],
  '--math-bg': ['#f3f8f7', '#14232a'], '--math-line': ['#0f766e', '#2dd4bf'],
};

const block = (i) => Object.entries(COLOURS).map(([k, v]) => `${k}: ${v[i]};`).join(' ');

export function tokensCss() {
  const dark = block(1);
  return `/* Generated from src/design/tokens.mjs by the build. Do not edit here: change the token file and rebuild. */
:root { ${Object.entries(STATIC).map(([k, v]) => `${k}: ${v};`).join(' ')} ${block(0)} color-scheme: light; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${dark} color-scheme: dark; } }
:root[data-theme="dark"] { ${dark} color-scheme: dark; }
`;
}
