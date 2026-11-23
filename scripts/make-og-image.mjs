// Makes public/assets/og-image.png: the 1200 x 630 picture shown when a page is shared on social media or in chat apps.
// It is made once and committed (the build only copies it). Run again only when the wording or colours change:
//   node scripts/make-og-image.mjs        (needs Playwright and Microsoft Edge; set PW_CHANNEL to use another browser)
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'og-image.png');
const html = `<!doctype html><meta charset="utf-8"><style>
html, body { margin: 0; width: 1200px; height: 630px; }
body { font-family: "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif; color: #fff;
  background: linear-gradient(135deg, #0b4f4a 0%, #0f766e 55%, #14938a 100%); position: relative; overflow: hidden; }
.dots { position: absolute; right: -40px; top: -40px; width: 520px; height: 520px; opacity: .16;
  background-image: radial-gradient(#fff 3px, transparent 4px); background-size: 34px 34px; }
.wrap { position: absolute; left: 80px; top: 70px; right: 80px; bottom: 70px; display: flex; flex-direction: column; justify-content: space-between; }
.badge { width: 92px; height: 92px; border-radius: 20px; background: #fff; color: #0f766e; font-weight: 800; font-size: 44px; display: grid; place-items: center; }
h1 { font-size: 88px; line-height: 1.04; margin: 0 0 22px; font-weight: 800; letter-spacing: -1px; }
p { font-size: 36px; line-height: 1.3; margin: 0; max-width: 940px; color: #e3f4f2; }
.chips { display: flex; gap: 14px; }
.chips span { font-size: 28px; font-weight: 650; border: 2px solid rgba(255,255,255,.7); border-radius: 999px; padding: 8px 22px; }
</style><div class="dots"></div><div class="wrap">
<div class="badge">AI</div>
<div><h1>AI &amp; ML Quick Path</h1><p>A free guide from first steps to industry projects.</p></div>
<div class="chips"><span>Python</span><span>.NET (C#)</span><span>Live simulations</span></div></div>`;

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.screenshot({ path: OUT, type: 'png' });
await browser.close();
console.log('written', OUT);
