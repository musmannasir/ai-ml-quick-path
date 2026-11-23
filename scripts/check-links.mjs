// Opens every address in src/data/sources.mjs and records the real result in src/data/source-status.json.
// Run: npm run check:links        (needs internet; nothing is assumed when the network is blocked)
// Results: "ok" (HTTP 200 after redirects, still the same page), "moved" (redirected to a different page), "blocked" (the site refused an automated request: 401/403/429/999;
// a person must open it), "failed" (404/410/5xx or no answer). Only "ok" counts as verified.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCES } from '../src/data/sources.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/data/source-status.json');
const today = new Date().toISOString().slice(0, 10);
const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const UA = 'Mozilla/5.0 (compatible; link-check; static-site build)';

async function check(url) {
  for (const method of ['GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html,*/*' }, signal: AbortSignal.timeout(25000) });
      try { await res.body?.cancel(); } catch { /* ignore */ }
      const final = res.url && res.url !== url ? res.url : undefined;
      if (res.status === 200) {
        // A redirect that drops the page's own name (for example to a generic landing page) is not a confirmation.
        const seg = new URL(url).pathname.split('/').filter(Boolean).pop();
        if (final && seg && !decodeURIComponent(final).toLowerCase().includes(seg.toLowerCase())) return { result: 'moved', http: 200, final };
        return { result: 'ok', http: 200, final };
      }
      if ([401, 403, 429, 999].includes(res.status)) return { result: 'blocked', http: res.status, final };
      return { result: 'failed', http: res.status, final };
    } catch (e) { return { result: 'failed', http: 0, note: String(e.cause?.code || e.name || e.message).slice(0, 60) }; }
  }
}

const ids = Object.keys(SOURCES);
const status = {};
let i = 0;
async function worker() {
  while (i < ids.length) {
    const id = ids[i++];
    const r = await check(SOURCES[id].url);
    // Keep the last date the link was really confirmed, even if today's attempt was refused.
    status[id] = { ...r, checked: today, lastOk: r.result === 'ok' ? today : (prev[id]?.lastOk || null) };
    console.log(`${r.result.padEnd(8)} ${String(r.http).padEnd(4)} ${id}  ${SOURCES[id].url}${r.final ? `\n              -> ${r.final}` : ''}`);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
const sorted = Object.fromEntries(ids.map((id) => [id, status[id]]));
writeFileSync(OUT, JSON.stringify(sorted, null, 1) + '\n');
const n = (r) => ids.filter((id) => status[id].result === r).length;
console.log(`\n${ids.length} sources: ${n('ok')} ok, ${n('moved')} moved, ${n('blocked')} blocked (need a manual check), ${n('failed')} failed. Wrote src/data/source-status.json`);
