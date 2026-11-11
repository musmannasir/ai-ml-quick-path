// Minimal static server for local preview: node scripts/serve.mjs [port]
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.txt': 'text/plain', '.xml': 'application/xml' };
// Send the same security headers as production hosts (from dist/_headers).
const HEADERS = existsSync(join(DIST, '_headers')) ? Object.fromEntries(readFileSync(join(DIST, '_headers'), 'utf8').split('\n').slice(1).filter(Boolean).map((l) => l.trim().split(/: (.*)/s).slice(0, 2))) : {};
const port = Number(process.argv[2] || process.env.PORT || 8080);
createServer((req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  if (p.includes('..')) { res.writeHead(400); return res.end(); }
  let file = join(DIST, p || 'index.html');
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) { res.writeHead(404, { 'Content-Type': TYPES['.html'] }); return res.end(readFileSync(join(DIST, '404.html'))); }
  res.writeHead(200, { ...HEADERS, 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`Serving dist/ at http://localhost:${port}`));
