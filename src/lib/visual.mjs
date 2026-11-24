// Visual tab for a diagram (owner requirement 2026-11-23): the existing boxes-and-arrows diagram stays as the first tab, "Boxes",
// and a drawn visual is added as a second tab, "Visual". A `visual` block placed straight after a diagram in a lesson joins the two.
//
//   ```visual <title>
//   file: attention-it          (src/visuals/<file>.svg, drawn with the vz-* classes in app.css)
//   alt: Text alternative that says what the picture shows
//   caption: One visible sentence under the picture
//   ```
//
// Without JavaScript both parts are shown one under the other; the script adds the tab bar. Rules enforced here: the diagram must come
// first, alt text and caption are required, and the SVG file must hold no script, no style attribute, no event handler and no outside address.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'visuals');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderVisualTab(title, bodyLines, diagramHtml, inl, ctx, where) {
  const fail = (m) => { throw new Error(`${where} (visual "${title}"): ${m}`); };
  if (!diagramHtml || !diagramHtml.startsWith('<figure class="diagram ')) fail('a visual block must come straight after a diagram block');
  const kv = {};
  for (const ln of bodyLines) { const m = ln.match(/^(file|alt|caption):\s*(.+)$/); if (m) kv[m[1]] = m[2].trim(); else if (ln.trim()) fail(`unknown line "${ln}"`); }
  for (const k of ['file', 'alt', 'caption']) if (!kv[k]) fail(`needs a "${k}:" line`);
  if (!/^[a-z0-9-]+$/.test(kv.file)) fail('file must be lowercase letters, digits and hyphens');
  const path = join(DIR, kv.file + '.svg');
  if (!existsSync(path)) fail(`src/visuals/${kv.file}.svg does not exist`);
  let svg = readFileSync(path, 'utf8').replace(/\r\n/g, '\n').replace(/<!--[\s\S]*?-->/g, '').trim();
  if (!svg.startsWith('<svg') || !/viewBox="/.test(svg)) fail('the file must be one <svg> element with a viewBox');
  if (/<script|\sstyle=|\son[a-z]+=|https?:|<image|<foreignObject|xlink:href|href=/i.test(svg.replace('xmlns="http://www.w3.org/2000/svg"', ''))) fail('the SVG may not contain a script, a style attribute, an event handler, an image or an address');
  const n = (ctx.vz = (ctx.vz || 0) + 1), id = `vz-${n}`;
  svg = svg.replace('<svg ', `<svg role="img" aria-labelledby="${id}-t" `).replace(/(<svg[^>]*>)/, `$1<title id="${id}-t">${esc(kv.alt)}</title>`);
  return `<div class="vz" data-vz>
<div class="vz-bar" role="tablist" aria-label="Show this diagram as" hidden><button type="button" role="tab" class="tab vz-tab" id="${id}-tb" aria-controls="${id}-pb" aria-selected="true" data-vz-tab="boxes">Boxes</button><button type="button" role="tab" class="tab vz-tab" id="${id}-tv" aria-controls="${id}-pv" aria-selected="false" tabindex="-1" data-vz-tab="visual">Visual</button></div>
<div class="vz-panel" role="tabpanel" id="${id}-pb" aria-labelledby="${id}-tb" data-vz-panel="boxes"><p class="vz-label">Boxes</p>${diagramHtml}</div>
<div class="vz-panel" role="tabpanel" id="${id}-pv" aria-labelledby="${id}-tv" data-vz-panel="visual"><p class="vz-label">Visual</p><figure class="vz-fig">${svg}<figcaption><span class="dg-kicker">Visual</span> ${inl(kv.caption)}</figcaption></figure></div>
</div>`;
}

// ---- Used by the cheat sheets: the same drawings, with the text alternative written for the lesson that holds them ----
let META = null;
export function visualMeta() {
  if (META) return META;
  META = {};
  const root = join(DIR, '..', 'content', 'lessons');
  for (const part of readdirSync(root)) {
    for (const fn of readdirSync(join(root, part)).filter((f) => f.endsWith('.md'))) {
      const lines = readFileSync(join(root, part, fn), 'utf8').replace(/\r\n/g, '\n').split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].startsWith('```visual')) continue;
        const kv = {};
        for (i++; i < lines.length && !lines[i].startsWith('```'); i++) { const m = lines[i].match(/^(file|alt|caption):\s*(.+)$/); if (m) kv[m[1]] = m[2].trim(); }
        if (kv.file && !META[kv.file]) META[kv.file] = kv;
      }
    }
  }
  return META;
}

export function inlineVisual(file, idPrefix, where) {
  const meta = visualMeta()[file];
  if (!meta) throw new Error(`${where}: the visual "${file}" is not used in any lesson, so it has no text alternative`);
  const path = join(DIR, file + '.svg');
  if (!existsSync(path)) throw new Error(`${where}: src/visuals/${file}.svg does not exist`);
  let svg = readFileSync(path, 'utf8').replace(/\r\n/g, '\n').replace(/<!--[\s\S]*?-->/g, '').trim();
  svg = svg.replace('<svg ', `<svg role="img" aria-labelledby="${idPrefix}-t" `).replace(/(<svg[^>]*>)/, `$1<title id="${idPrefix}-t">${esc(meta.alt)}</title>`);
  return { svg, caption: meta.caption };
}
