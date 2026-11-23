// Element or page screenshots for design review: node scripts/shot.mjs <page> <selector|page|full> <width> <light|dark> <name>
// Writes qa/screenshots/<name>.png. Uses the built site in dist/ (run npm run build first).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const [p, sel = 'page', width = '1280', scheme = 'light', name = 'shot'] = process.argv.slice(2);
const [file, hash] = p.split('#');
const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
const ctx = await browser.newContext({ viewport: { width: Number(width), height: 900 }, colorScheme: scheme });
const page = await ctx.newPage();
await page.goto(pathToFileURL(join(ROOT, 'dist', file)).href + (hash ? '#' + hash : ''));
const out = join(ROOT, 'qa', 'screenshots', name + '.png');
if (sel === 'page') await page.screenshot({ path: out });
else if (sel === 'full') await page.screenshot({ path: out, fullPage: true });
else await page.locator(sel).first().screenshot({ path: out });
await browser.close();
console.log('wrote', out);
